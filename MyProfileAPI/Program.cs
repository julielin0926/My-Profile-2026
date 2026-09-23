using Microsoft.EntityFrameworkCore;
using MyProfileAPI.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using MyProfileAPI.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowMyProfile", policy =>
    {
        policy
            .AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

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

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var jwtKey = builder.Configuration["Jwt:Key"];

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,

            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtKey!)
            ),

            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],

            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"],

            ValidateLifetime = true
        };
    });

var app = builder.Build();


// 原本建立作者的區塊
if (args.Contains("--seed-author"))
{
    if (!app.Environment.IsDevelopment())
    {
        Console.WriteLine("作者初始化功能僅允許在開發環境執行。");
        return;
    }

    using var scope = app.Services.CreateScope();

    var context = scope.ServiceProvider
        .GetRequiredService<AppDbContext>();

    await AuthorSeeder.RunAsync(context);

    return;
}


// 新增作品匯入區塊
if (args.Contains("--seed-works"))
{
    if (!app.Environment.IsDevelopment())
    {
        Console.WriteLine("作品匯入僅允許在開發環境執行。");
        return;
    }

    using var scope = app.Services.CreateScope();

    var context = scope.ServiceProvider
        .GetRequiredService<AppDbContext>();

    await WorkSeeder.RunAsync(context);

    return;
}



// ==================================================
// 設定 HTTP Request Pipeline
// ==================================================

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseCors("AllowMyProfile");

app.UseAuthentication();
app.UseAuthorization();

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