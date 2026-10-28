using System.Text.Json;
using Microsoft.Data.Sqlite;
using Serilog.Core;
using Serilog.Events;

namespace OrthoErp.FiscalService.Services;

public class SqliteFiscalAuditSink : ILogEventSink
{
    private readonly string _connectionString;
    private readonly IFormatProvider? _formatProvider;

    public SqliteFiscalAuditSink(string connectionString, IFormatProvider? formatProvider = null)
    {
        _connectionString = connectionString;
        _formatProvider = formatProvider;
    }

    public void Emit(LogEvent logEvent)
    {
        try
        {
            var message = logEvent.RenderMessage(_formatProvider);
            var level = logEvent.Level.ToString();
            
            // Extract structured properties
            string eventType = "general";
            long? receiptId = null;
            long? transactionId = null;
            string devicePort = "COM3";
            long durationMs = 0;

            if (logEvent.Properties.TryGetValue("EventType", out var etVal))
                eventType = etVal.ToString().Trim('\"');

            if (logEvent.Properties.TryGetValue("ReceiptId", out var rVal) && long.TryParse(rVal.ToString(), out var rId))
                receiptId = rId;

            if (logEvent.Properties.TryGetValue("TransactionId", out var txVal) && long.TryParse(txVal.ToString(), out var txId))
                transactionId = txId;

            if (logEvent.Properties.TryGetValue("Port", out var pVal))
                devicePort = pVal.ToString().Trim('\"');

            if (logEvent.Properties.TryGetValue("DurationMs", out var dVal) && long.TryParse(dVal.ToString(), out var dMs))
                durationMs = dMs;

            var propsDict = logEvent.Properties.ToDictionary(
                kvp => kvp.Key,
                kvp => kvp.Value.ToString().Trim('\"')
            );
            var propertiesJson = JsonSerializer.Serialize(propsDict);
            var exceptionDetails = logEvent.Exception?.ToString();

            using var connection = new SqliteConnection(_connectionString);
            connection.Open();
            using var cmd = connection.CreateCommand();
            cmd.CommandText = @"
                INSERT INTO fiscal_audit_logs (
                    timestamp, level, message, event_type, receipt_id, transaction_id,
                    device_port, duration_ms, properties_json, exception_details
                ) VALUES (datetime('now', 'localtime'), $lvl, $msg, $et, $rcpt, $tx, $port, $dur, $props, $ex)";

            cmd.Parameters.AddWithValue("$lvl", level);
            cmd.Parameters.AddWithValue("$msg", message);
            cmd.Parameters.AddWithValue("$et", eventType);
            cmd.Parameters.AddWithValue("$rcpt", (object?)receiptId ?? DBNull.Value);
            cmd.Parameters.AddWithValue("$tx", (object?)transactionId ?? DBNull.Value);
            cmd.Parameters.AddWithValue("$port", devicePort);
            cmd.Parameters.AddWithValue("$dur", durationMs);
            cmd.Parameters.AddWithValue("$props", propertiesJson);
            cmd.Parameters.AddWithValue("$ex", (object?)exceptionDetails ?? DBNull.Value);

            cmd.ExecuteNonQuery();

            // Also insert into unified master serilog table
            using var serilogCmd = connection.CreateCommand();
            serilogCmd.CommandText = @"
                INSERT INTO serilog (
                    timestamp, level, event_type, source_context, message, properties_json,
                    duration_ms, client_ip, exception
                ) VALUES (datetime('now', 'localtime'), $lvl, $et, 'OrthoErp.FiscalDaemon', $msg, $props, $dur, '127.0.0.1', $ex)";
            serilogCmd.Parameters.AddWithValue("$lvl", level);
            serilogCmd.Parameters.AddWithValue("$et", eventType);
            serilogCmd.Parameters.AddWithValue("$msg", message);
            serilogCmd.Parameters.AddWithValue("$props", propertiesJson);
            serilogCmd.Parameters.AddWithValue("$dur", durationMs);
            serilogCmd.Parameters.AddWithValue("$ex", (object?)exceptionDetails ?? DBNull.Value);
            serilogCmd.ExecuteNonQuery();
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[SqliteFiscalAuditSink] Error writing audit log: {ex.Message}");
        }
    }
}
