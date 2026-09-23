using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyProfileAPI.Data;
using MyProfileAPI.Models;

namespace MyProfileAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WorksController : ControllerBase
{
    private readonly AppDbContext _context;

    public WorksController(AppDbContext context)
    {
        _context = context;
    }

    // 公開作品清單，不需要登入。
    [AllowAnonymous]
    [HttpGet]
    public async Task<ActionResult<List<Work>>> GetAll(
        [FromQuery] string? category)
    {
        if (category != null
            && category != "animation"
            && category != "video"
            && category != "game")
        {
            return BadRequest(new
            {
                message = "作品分類不正確。"
            });
        }

        var query = _context.Works.AsNoTracking();

        if (category != null)
        {
            query = query.Where(work => work.Category == category);
        }

        var works = await query
            .OrderBy(work => work.SortOrder)
            .ThenBy(work => work.Id)
            .ToListAsync();

        return Ok(works);
    }

    // 公開的單件作品查詢。
    [AllowAnonymous]
    [HttpGet("{id:int}")]
    public async Task<ActionResult<Work>> GetById(int id)
    {
        var work = await _context.Works
            .AsNoTracking()
            .FirstOrDefaultAsync(work => work.Id == id);

        if (work == null)
        {
            return NotFound();
        }

        return Ok(work);
    }

    // 新增作品必須登入。
    [Authorize]
    [HttpPost]
    public async Task<ActionResult<Work>> Create(
        CreateWorkRequest request)
    {
        var isGame = request.Category == "game";

        var work = new Work
        {
            Title = request.Title.Trim(),
            Category = request.Category,

            YouTubeVideoId = isGame
                ? null
                : request.YouTubeVideoId?.Trim(),

            ImageUrl = isGame ? request.ImageUrl?.Trim() : null,
            Genre = isGame ? request.Genre?.Trim() : null,
            Year = isGame ? request.Year : null,
            ExternalUrl = isGame ? request.ExternalUrl?.Trim() : null,
            ButtonText = isGame ? request.ButtonText?.Trim() : null,

            SortOrder = request.SortOrder,
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.Works.Add(work);
        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetById),
            new { id = work.Id },
            work
        );
    }


    // 刪除作品必須登入。
    [Authorize]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var work = await _context.Works
            .FirstOrDefaultAsync(work => work.Id == id);

        if (work == null)
        {
            return NotFound(new
            {
                message = "這件作品已不存在。"
            });
        }

        _context.Works.Remove(work);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}