namespace OrthoErp.FiscalService.Models;

public record FiscalItem(
    string Name,
    decimal Quantity,
    decimal UnitPrice,
    decimal Subtotal
);

public record FiscalReceiptRequest(
    long? TransactionId,
    long? VisitId,
    long? PatientId,
    string? PatientContact, // Тег 1008
    string PaymentType,    // 'card', 'cash', 'sbp', 'invoice'
    decimal TotalAmount,
    List<FiscalItem>? Items
);

public record FiscalReceiptResult(
    bool Success,
    long? ReceiptId,
    long FiscalDocumentNumber, // Тег 1040
    string FiscalSign,         // Тег 1077 (ФПД)
    string FiscalDriveNumber,  // Тег 1041 (ФН)
    int ShiftNumber,           // Тег 1038
    int ReceiptNumber,         // Тег 1042
    string KktRegNumber,
    bool IsFiscalized,
    bool IsPrinted,
    long DurationMs,
    string Status,
    string? ErrorMessage = null
);

public class FiscalTask
{
    public required FiscalReceiptRequest Request { get; init; }
    public TaskCompletionSource<FiscalReceiptResult> CompletionSource { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);
    public DateTime EnqueuedAt { get; } = DateTime.UtcNow;
}
