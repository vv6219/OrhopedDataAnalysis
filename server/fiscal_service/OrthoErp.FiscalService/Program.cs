using OrthoErp.FiscalService.Models;
using OrthoErp.FiscalService.Services;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Absolute or relative path to database
var defaultDbPath = Path.GetFullPath(Path.Combine(builder.Environment.ContentRootPath, "..", "..", "..", "db", "orthopedic_data_center.sqlite"));
var connString = $"Data Source={defaultDbPath}";

// Configure Serilog with Console, Rolling File, and SQLite audit sink
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Debug()
    .Enrich.FromLogContext()
    .Enrich.WithProperty("Application", "OrthoErp.FiscalDaemon")
    .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] [{EventType}] {Message:lj}{NewLine}{Exception}")
    .WriteTo.File("logs/atol-fiscal-.log", rollingInterval: RollingInterval.Day)
    .WriteTo.Sink(new SqliteFiscalAuditSink(connString))
    .CreateLogger();

builder.Host.UseSerilog();

builder.Services.AddSingleton<AtolFiscalEngine>();
builder.Services.AddHostedService(sp => sp.GetRequiredService<AtolFiscalEngine>());
builder.Services.AddCors(opt => opt.AddDefaultPolicy(p => p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()));

var app = builder.Build();

app.UseCors();

app.MapGet("/api/fiscal/status", () => Results.Ok(new
{
    Online = true,
    DeviceModel = "АТОЛ 91Ф",
    Port = "COM3",
    IsShiftOpen = true,
    ShiftNumber = 14,
    FfdVersion = "1.2 / 1.05",
    TaxRegime = "Без НДС (пп. 2 п. 2 ст. 149 НК РФ — медицинские услуги)",
    SerilogSinkActive = true
}));

app.MapPost("/api/fiscal/receipt", async (FiscalReceiptRequest request, AtolFiscalEngine engine) =>
{
    try
    {
        var res = await engine.QueueReceiptAsync(request);
        return Results.Ok(res);
    }
    catch (Exception ex)
    {
        return Results.Problem(detail: ex.Message, statusCode: 500);
    }
});

Log.Information("[{EventType}] OrthoErp.FiscalDaemon запущен. База данных SQLite: {DbPath}", 
    "service_started", defaultDbPath);

app.Run("http://localhost:5050");
