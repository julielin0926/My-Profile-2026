using Microsoft.EntityFrameworkCore;
using MyProfileAPI.Data;

var builder = WebApplication.CreateBuilder(args);

// ==================================================
// 加入 API Controller
// ==================================================

builder.Services.AddControllers();


// ==================================================
// 加入 OpenAPI
// ==================================================

// 用來產生 API 文件
builder.Services.AddOpenApi();


// ==================================================
// 加入 Entity Framework Core
// ==================================================

// 告訴 ASP.NET Core 使用 AppDbContext
// 並透過 appsettings.json 裡的 DefaultConnection
// 連接到 MSSQL
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")
    ));


var app = builder.Build();


// ==================================================
// 設定 HTTP Request Pipeline
// ==================================================

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();


// ==================================================
// 啟用 Controller
// ==================================================

app.MapControllers();


// ==================================================
// 原本 ASP.NET Core 範本的測試 API
// ==================================================

var summaries = new[]
{
    "Freezing",
    "Bracing",
    "Chilly",
    "Cool",
    "Mild",
    "Warm",
    "Balmy",
    "Hot",
    "Sweltering",
    "Scorching"
};


app.MapGet("/weatherforecast", () =>
{
    var forecast = Enumerable.Range(1, 5).Select(index =>
        new WeatherForecast
        (
            DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            Random.Shared.Next(-20, 55),
            summaries[Random.Shared.Next(summaries.Length)]
        ))
        .ToArray();

    return forecast;
})
.WithName("GetWeatherForecast");


app.Run();


// ==================================================
// WeatherForecast 資料結構
// ==================================================

record WeatherForecast(
    DateOnly Date,
    int TemperatureC,
    string? Summary)
{
    public int TemperatureF =>
        32 + (int)(TemperatureC / 0.5556);
}