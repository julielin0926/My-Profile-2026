using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyProfileAPI.Data;
using MyProfileAPI.Models;

namespace MyProfileAPI.Controllers;

[ApiController]
[Route("api/Experiences")]
public class ExperiencesController : ControllerBase
{
    private readonly AppDbContext _context;

    public ExperiencesController(AppDbContext context)
    {
        _context = context;
    }

    // 取得全部工作經驗。
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var experiences = await _context.Experiences
            .AsNoTracking()
            .OrderBy(item => item.SortOrder)
            .ThenBy(item => item.Id)
            .ToListAsync();

        return Ok(experiences);
    }

    // 取得單筆工作經驗。
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var experience = await _context.Experiences
            .AsNoTracking()
            .SingleOrDefaultAsync(item => item.Id == id);

        if (experience is null)
        {
            return NotFound(new { message = "找不到這筆工作經驗。" });
        }

        return Ok(experience);
    }

    // 新增：必須登入。
    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create(
        SaveExperienceRequest request)
    {
        var experience = new Experience();

        ApplyRequest(experience, request);

        _context.Experiences.Add(experience);
        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetById),
            new { id = experience.Id },
            experience
        );
    }

    // 編輯：必須登入。
    [Authorize]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(
        int id,
        SaveExperienceRequest request)
    {
        var experience = await _context.Experiences.FindAsync(id);

        if (experience is null)
        {
            return NotFound(new { message = "找不到這筆工作經驗。" });
        }

        ApplyRequest(experience, request);
        await _context.SaveChangesAsync();

        return Ok(experience);
    }

    // 刪除：必須登入。
    [Authorize]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var experience = await _context.Experiences.FindAsync(id);

        if (experience is null)
        {
            return NotFound(new { message = "找不到這筆工作經驗。" });
        }

        _context.Experiences.Remove(experience);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private static void ApplyRequest(
        Experience experience,
        SaveExperienceRequest request)
    {
        experience.Title = request.Title.Trim();
        experience.Summary = (request.Summary ?? "").Trim();
        experience.Company = (request.Company ?? "").Trim();
        experience.Role = (request.Role ?? "").Trim();
        experience.Period = (request.Period ?? "").Trim();
        experience.WorkContent = request.WorkContent.Trim();
        experience.IntroductionHeading =
            request.IntroductionHeading.Trim();
        experience.Introduction = request.Introduction.Trim();
        experience.SortOrder = request.SortOrder;
    }
}