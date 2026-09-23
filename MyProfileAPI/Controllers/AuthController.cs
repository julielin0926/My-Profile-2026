using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using MyProfileAPI.Data;
using MyProfileAPI.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace MyProfileAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthController(
    AppDbContext context,
    IConfiguration configuration)
{
    _context = context;
    _configuration = configuration;
}

    [HttpPost("login")]
    public IActionResult Login(LoginRequest request)
    {
        // 先從資料庫尋找帳號
        var author = _context.Authors
            .FirstOrDefault(x => x.Username == request.Username);

        // 找不到帳號
        if (author == null)
        {
            return Unauthorized();
        }

        // 建立密碼驗證工具
        var passwordHasher = new PasswordHasher<Author>();

        // 驗證使用者輸入的密碼
        var result = passwordHasher.VerifyHashedPassword(
            author,
            author.PasswordHash,
            request.Password
        );

        // 密碼錯誤
        if (result == PasswordVerificationResult.Failed)
        {
            return Unauthorized();
        }
var claims = new[]
{
    new Claim(ClaimTypes.Name, author.Username)
};

var key = new SymmetricSecurityKey(
    Encoding.UTF8.GetBytes(
        _configuration["Jwt:Key"]!
    )
);

var credentials = new SigningCredentials(
    key,
    SecurityAlgorithms.HmacSha256
);

var token = new JwtSecurityToken(
    issuer: _configuration["Jwt:Issuer"],
    audience: _configuration["Jwt:Audience"],
    claims: claims,
    expires: DateTime.UtcNow.AddHours(2),
    signingCredentials: credentials
);

var tokenString = new JwtSecurityTokenHandler()
    .WriteToken(token);

return Ok(new
{
    token = tokenString
});
    }
}