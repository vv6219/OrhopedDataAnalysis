using OrthoErp.FiscalService.Models;
using OrthoErp.FiscalService.Services;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Resolve SQLite database path dynamically with multi-level upward search
var contentRoot = builder.Environment.ContentRootPath;
var configuredDb = builder.Configuration.GetConnectionString("SqliteDb");
string dbPath = "";

if (!string.IsNullOrWhiteSpace(configuredDb))
{
    var resolvedCfg = Path.IsPathRooted(configuredDb) ? configuredDb : Path.GetFullPath(Path.Combine(contentRoot, configuredDb));
    if (File.Exists(resolvedCfg)) dbPath = resolvedCfg;
}

if (string.IsNullOrEmpty(dbPath))
{
    var searchDir = new DirectoryInfo(contentRoot);
    while (searchDir != null)
    {
        var c1 = Path.Combine(searchDir.FullName, "DB", "orthopedic_data_center.sqlite");
        if (File.Exists(c1)) { dbPath = c1; break; }
        var c2 = Path.Combine(searchDir.FullName, "db", "orthopedic_data_center.sqlite");
        if (File.Exists(c2)) { dbPath = c2; break; }
        searchDir = searchDir.Parent;
    }
}

if (string.IsNullOrEmpty(dbPath))
{
    dbPath = Path.GetFullPath(Path.Combine(contentRoot, "..", "..", "..", "DB", "orthopedic_data_center.sqlite"));
}

var connString = $"Data Source={dbPath}";

// Configure Serilog completely from appsettings.json (enrichers, rollingInterval, sinks, levels)
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
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
    "service_started", dbPath);

app.Run("http://localhost:5050");
