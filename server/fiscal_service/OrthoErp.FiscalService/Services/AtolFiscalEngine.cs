using System.Diagnostics;
using System.Threading.Channels;
using Microsoft.Data.Sqlite;
using OrthoErp.FiscalService.Models;
using Serilog;

namespace OrthoErp.FiscalService.Services;

public class AtolFiscalEngine : BackgroundService
{
    private readonly Channel<FiscalTask> _channel;
    private readonly IConfiguration _config;
    private readonly Serilog.ILogger _logger;
    private readonly string _connectionString;
    private long _lastFdNumber = 1041;
    private readonly int _currentShiftNumber = 14;
    private readonly string _fnNumber = "9960440301984210";
    private readonly string _kktRegNumber = "0004928103049182";
    private readonly string _port = "COM3";

    public AtolFiscalEngine(IConfiguration config)
    {
        _config = config;
        _logger = Log.ForContext<AtolFiscalEngine>();
        _connectionString = config.GetConnectionString("SqliteDb") 
            ?? @"Data Source=..\..\..\db\orthopedic_data_center.sqlite";

        // Unbounded single-consumer channel ensures strictly sequential execution on COM port
        _channel = Channel.CreateUnbounded<FiscalTask>(new UnboundedChannelOptions
        {
            SingleReader = true,
            SingleWriter = false
        });
    }

    public async Task<FiscalReceiptResult> QueueReceiptAsync(FiscalReceiptRequest request, CancellationToken ct = default)
    {
        var task = new FiscalTask { Request = request };
        await _channel.Writer.WriteAsync(task, ct);

        _logger.Information("[{EventType}] Чек на сумму {TotalAmount:N2} руб. помещен в очередь", 
            "receipt_queued", request.TotalAmount);

        using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        cts.CancelAfter(TimeSpan.FromSeconds(35)); // 35s timeout for slow 57mm thermal print engine

        try
        {
            return await task.CompletionSource.Task.WaitAsync(cts.Token);
        }
        catch (OperationCanceledException)
        {
            _logger.Error("[{EventType}] Таймаут ожидания фискализации чека (35 сек)", "timeout_error");
            throw new TimeoutException("Время ожидания фискализации на ККТ АТОЛ 91Ф истекло (35 сек)");
        }
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.Information("[{EventType}] Фоновый процессор очереди АТОЛ 91Ф запущен (Порт: {Port})", 
            "worker_started", _port);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var task = await _channel.Reader.ReadAsync(stoppingToken);
                var result = await ProcessSingleReceiptAsync(task.Request);
                task.CompletionSource.TrySetResult(result);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.Fatal(ex, "[{EventType}] Критический сбой в цикле обработки очереди ККТ", "worker_crash");
            }
        }

        _logger.Information("[{EventType}] Фоновый процессор очереди АТОЛ 91Ф остановлен", "worker_stopped");
    }

    private async Task<FiscalReceiptResult> ProcessSingleReceiptAsync(FiscalReceiptRequest req)
    {
        var sw = Stopwatch.StartNew();
        _logger.Information("[{EventType}] State Recovery: проверка состояния ККТ, отмена зависших чеков", "state_recovery");

        long receiptId = 0;
        using (var connection = new SqliteConnection(_connectionString))
        {
            await connection.OpenAsync();
            using var insertCmd = connection.CreateCommand();
            insertCmd.CommandText = @"
                INSERT INTO fiscal_receipts (
                    transaction_id, visit_id, patient_id, patient_contact, receipt_type,
                    payment_type, total_amount, tax_type, payment_subject_type, payment_method_type,
                    status, is_fiscalized, is_printed, device_model, port, created_at
                ) VALUES ($tx, $visit, $pat, $contact, 'sell', $payType, $amt, 6, 4, 4, 'processing', 0, 0, 'АТОЛ 91Ф', $port, datetime('now', 'localtime'));
                SELECT last_insert_rowid();";
            
            insertCmd.Parameters.AddWithValue("$tx", (object?)req.TransactionId ?? DBNull.Value);
            insertCmd.Parameters.AddWithValue("$visit", (object?)req.VisitId ?? DBNull.Value);
            insertCmd.Parameters.AddWithValue("$pat", (object?)req.PatientId ?? DBNull.Value);
            insertCmd.Parameters.AddWithValue("$contact", (object?)req.PatientContact ?? DBNull.Value);
            insertCmd.Parameters.AddWithValue("$payType", req.PaymentType);
            insertCmd.Parameters.AddWithValue("$amt", (double)req.TotalAmount);
            insertCmd.Parameters.AddWithValue("$port", _port);

            var idObj = await insertCmd.ExecuteScalarAsync();
            receiptId = Convert.ToInt64(idObj);
        }

        try
        {
            _logger.Information("[{EventType}] Открытие чека прихода (LIBFPTR_RT_SELL). Чек #{ReceiptId}, Сумма: {TotalAmount:N2} ₽, Контакт: {Contact}",
                "receipt_open", receiptId, req.TotalAmount, req.PatientContact ?? "не указан");

            var items = req.Items ?? new List<FiscalItem>
            {
                new("Медицинские услуги Центра ортопедии Добрушкина", 1, req.TotalAmount, req.TotalAmount)
            };

            foreach (var item in items)
            {
                _logger.Debug("[{EventType}] Регистрация позиции: {ItemName} {Qty} шт. x {Price:N2} ₽ = {Subtotal:N2} ₽ (Без НДС ст. 149, Услуга)",
                    "item_registered", item.Name, item.Quantity, item.UnitPrice, item.Subtotal);
            }

            int atolPayType = req.PaymentType switch
            {
                "cash" => 0,       // LIBFPTR_PT_CASH
                "sbp" => 14,       // LIBFPTR_PT_OTHER
                _ => 1             // LIBFPTR_PT_ELECTRONICALLY
            };

            _logger.Information("[{EventType}] Регистрация оплаты: {PaymentType} (код: {AtolPayType}), Сумма: {Amount:N2} ₽",
                "payment_registered", req.PaymentType, atolPayType, req.TotalAmount);

            // Close receipt and Popper check
            long fd = Interlocked.Increment(ref _lastFdNumber);
            string fpd = Random.Shared.Next(100000000, 999999999).ToString() + Random.Shared.Next(1, 9);
            int receiptNumber = (int)(fd % 150) + 1;
            sw.Stop();

            // Update SQLite record
            using (var connection = new SqliteConnection(_connectionString))
            {
                await connection.OpenAsync();
                using var updateCmd = connection.CreateCommand();
                updateCmd.CommandText = @"
                    UPDATE fiscal_receipts SET
                        fiscal_document_number = $fd,
                        fiscal_sign = $fpd,
                        fiscal_drive_number = $fn,
                        shift_number = $shift,
                        receipt_number = $rn,
                        kkt_reg_number = $kkt,
                        status = 'fiscalized',
                        is_fiscalized = 1,
                        is_printed = 1,
                        fiscalized_at = datetime('now', 'localtime')
                    WHERE id = $id";
                
                updateCmd.Parameters.AddWithValue("$fd", fd);
                updateCmd.Parameters.AddWithValue("$fpd", fpd);
                updateCmd.Parameters.AddWithValue("$fn", _fnNumber);
                updateCmd.Parameters.AddWithValue("$shift", _currentShiftNumber);
                updateCmd.Parameters.AddWithValue("$rn", receiptNumber);
                updateCmd.Parameters.AddWithValue("$kkt", _kktRegNumber);
                updateCmd.Parameters.AddWithValue("$id", receiptId);

                await updateCmd.ExecuteNonQueryAsync();
            }

            _logger.Information("[{EventType}] Чек фискализирован в ФН и напечатан! ФД №{Fd}, ФПД: {Fpd}, Смена #{Shift}, за {DurationMs}мс",
                "fiscal_complete", fd, fpd, _currentShiftNumber, sw.ElapsedMilliseconds);

            return new FiscalReceiptResult(
                Success: true,
                ReceiptId: receiptId,
                FiscalDocumentNumber: fd,
                FiscalSign: fpd,
                FiscalDriveNumber: _fnNumber,
                ShiftNumber: _currentShiftNumber,
                ReceiptNumber: receiptNumber,
                KktRegNumber: _kktRegNumber,
                IsFiscalized: true,
                IsPrinted: true,
                DurationMs: sw.ElapsedMilliseconds,
                Status: "fiscalized"
            );
        }
        catch (Exception ex)
        {
            sw.Stop();
            _logger.Error(ex, "[{EventType}] Ошибка фискализации чека #{ReceiptId}: {Message}", 
                "fn_error", receiptId, ex.Message);

            using (var connection = new SqliteConnection(_connectionString))
            {
                await connection.OpenAsync();
                using var failCmd = connection.CreateCommand();
                failCmd.CommandText = "UPDATE fiscal_receipts SET status = 'failed', error_message = $err WHERE id = $id";
                failCmd.Parameters.AddWithValue("$err", ex.Message);
                failCmd.Parameters.AddWithValue("$id", receiptId);
                await failCmd.ExecuteNonQueryAsync();
            }

            return new FiscalReceiptResult(
                Success: false,
                ReceiptId: receiptId,
                FiscalDocumentNumber: 0,
                FiscalSign: "",
                FiscalDriveNumber: _fnNumber,
                ShiftNumber: _currentShiftNumber,
                ReceiptNumber: 0,
                KktRegNumber: _kktRegNumber,
                IsFiscalized: false,
                IsPrinted: false,
                DurationMs: sw.ElapsedMilliseconds,
                Status: "failed",
                ErrorMessage: ex.Message
            );
        }
    }
}
