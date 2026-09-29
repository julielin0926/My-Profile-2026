using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyProfileAPI.Data;
using MyProfileAPI.Models;

namespace MyProfileAPI.Controllers;

[ApiController]
[Route("api/Experiences/{experienceId:int}/images")]
public class ExperienceImagesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly string _directory;

    public ExperienceImagesController(
        AppDbContext context,
        IWebHostEnvironment environment)
    {
        _context = context;

        _directory = Path.Combine(
            environment.ContentRootPath,
            "App_Data",
            "experience-images"
        );
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(int experienceId)
    {
        if (!await _context.Experiences.AnyAsync(
            item => item.Id == experienceId))
        {
            return NotFound(new { message = "工作經驗不存在。" });
        }

        var images = await _context.ExperienceImages
            .AsNoTracking()
            .Where(image => image.ExperienceId == experienceId)
            .OrderBy(image => image.SortOrder)
            .ThenBy(image => image.Id)
            .Select(image => new
            {
                image.Id,
                image.Kind,
                image.Caption,
                Url = $"/api/Experiences/{experienceId}/images/{image.Id}/file"
            })
            .ToListAsync();

        return Ok(images);
    }

    [HttpGet("{imageId:int}/file")]
    public async Task<IActionResult> GetFile(
        int experienceId,
        int imageId)
    {
        var image = await _context.ExperienceImages
            .AsNoTracking()
            .SingleOrDefaultAsync(image =>
                image.ExperienceId == experienceId &&
                image.Id == imageId);

        if (image is null)
        {
            return NotFound();
        }

        var fileName = image.FileName;
        var extension = Path.GetExtension(fileName).ToLowerInvariant();

        if (Path.GetFileName(fileName) != fileName ||
            !Guid.TryParseExact(
                Path.GetFileNameWithoutExtension(fileName),
                "N",
                out _))
        {
            return NotFound();
        }

        var contentType = extension switch
        {
            ".jpg" => "image/jpeg",
            ".png" => "image/png",
            ".webp" => "image/webp",
            _ => null
        };

        if (contentType is null)
        {
            return NotFound();
        }

        var path = Path.Combine(_directory, fileName);

        if (!System.IO.File.Exists(path))
        {
            return NotFound();
        }

        Response.Headers["X-Content-Type-Options"] = "nosniff";
        Response.Headers["Cache-Control"] = "no-store";

        return PhysicalFile(path, contentType);
    }

    [Authorize]
    [HttpPost]
    [RequestSizeLimit(6 * 1024 * 1024)]
    [RequestFormLimits(MultipartBodyLengthLimit = 6 * 1024 * 1024)]
    public async Task<IActionResult> Upload(
        int experienceId,
        [FromForm] UploadExperienceImageRequest request)
    {
        if (!await _context.Experiences.AnyAsync(
            item => item.Id == experienceId))
        {
            return NotFound(new { message = "工作經驗不存在。" });
        }

        if (request.File.Length == 0 ||
            request.File.Length > 5 * 1024 * 1024)
        {
            return BadRequest(new
            {
                message = "圖片不可為空，每張上限 5 MB。"
            });
        }

        await using var memory = new MemoryStream();
        await request.File.CopyToAsync(memory);

        var bytes = memory.ToArray();
        var extension = DetectExtension(bytes);

        if (extension is null)
        {
            return BadRequest(new
            {
                message = "只接受 PNG、JPEG 或 WebP 圖片。"
            });
        }

        // 固定位置有圖片時更新該筆紀錄；好評每次新增一筆。
        ExperienceImage? image = null;

        if (request.Kind != "review")
        {
            image = await _context.ExperienceImages
                .SingleOrDefaultAsync(image =>
                    image.ExperienceId == experienceId &&
                    image.Kind == request.Kind);
        }

        var isNew = image is null;

        image ??= new ExperienceImage
        {
            ExperienceId = experienceId,
            Kind = request.Kind
        };

        var fileName = $"{Guid.NewGuid():N}{extension}";
        var path = Path.Combine(_directory, fileName);

        image.FileName = fileName;
        image.Caption = (request.Caption ?? "").Trim();

        Directory.CreateDirectory(_directory);

        try
        {
            await System.IO.File.WriteAllBytesAsync(path, bytes);

            if (isNew)
            {
                _context.ExperienceImages.Add(image);
            }

            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            if (System.IO.File.Exists(path))
            {
                System.IO.File.Delete(path);
            }

            return Conflict(new
            {
                message = "圖片紀錄未能儲存，請重新載入圖片清單後再試。"
            });
        }
        catch
        {
            if (System.IO.File.Exists(path))
            {
                System.IO.File.Delete(path);
            }

            throw;
        }

        return Ok(new
        {
            image.Id,
            image.Kind,
            image.Caption,
            Url = $"/api/Experiences/{experienceId}/images/{image.Id}/file"
        });
    }

    [Authorize]
    [HttpDelete("{imageId:int}")]
    public async Task<IActionResult> Delete(
        int experienceId,
        int imageId)
    {
        var image = await _context.ExperienceImages
            .SingleOrDefaultAsync(image =>
                image.ExperienceId == experienceId &&
                image.Id == imageId);

        if (image is null)
        {
            return NotFound(new { message = "圖片不存在。" });
        }

        _context.ExperienceImages.Remove(image);
        await _context.SaveChangesAsync();

        // 原始檔暫時保留；失去紀錄後不再由此 API 提供。
        return NoContent();
    }

    private static string? DetectExtension(byte[] bytes)
    {
        if (bytes.Length >= 8 &&
            bytes.AsSpan(0, 8).SequenceEqual(
                new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 }))
        {
            return ".png";
        }

        if (bytes.Length >= 3 &&
            bytes[0] == 255 &&
            bytes[1] == 216 &&
            bytes[2] == 255)
        {
            return ".jpg";
        }

        if (bytes.Length >= 12 &&
            System.Text.Encoding.ASCII.GetString(bytes, 0, 4) == "RIFF" &&
            System.Text.Encoding.ASCII.GetString(bytes, 8, 4) == "WEBP")
        {
            return ".webp";
        }

        return null;
    }
}