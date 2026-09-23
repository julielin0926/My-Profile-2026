using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using MyProfileAPI.Data;
using MyProfileAPI.Models;

namespace MyProfileAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;

    public AuthController(AppDbContext context)
    {
        _context = context;
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

        return Ok(new
        {
            message = "登入成功"
        });
    }
}