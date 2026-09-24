using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyProfileAPI.Data;
using MyProfileAPI.Models;

namespace MyProfileAPI.Controllers;

[ApiController]
[Route("api/Works/{workId:int}/images")]
public class WorkImagesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly string _imageDirectory;

    public WorkImagesController(
        AppDbContext context,
        IWebHostEnvironment environment)
    {
        _context = context;

        _imageDirectory = Path.Combine(
            environment.ContentRootPath,
            "App_Data",
            "work-images"
        );
    }

    // 取得某件作品的精華圖片清單。
    [AllowAnonymous]
    [HttpGet]
    public async Task<IActionResult> GetAll(int workId)
    {
        if (!await _context.Works.AnyAsync(work => work.Id == workId))
        {
            return NotFound(new { message = "作品不存在。" });
        }

        var images = await _context.WorkImages
            .AsNoTracking()
            .Where(image => image.WorkId == workId)
            .OrderBy(image => image.SortOrder)
            .ThenBy(image => image.Id)
            .Select(image => new
            {
                image.Id,
                image.Caption,
                Url = $"/api/Works/{workId}/images/{image.Id}/file"
            })
            .ToListAsync();

        return Ok(images);
    }

    // 提供圖片內容，不直接開放整個磁碟資料夾。
    [AllowAnonymous]
    [HttpGet("{imageId:int}/file")]
    public async Task<IActionResult> GetFile(int workId, int imageId)
    {
        var image = await _context.WorkImages
            .AsNoTracking()
            .FirstOrDefaultAsync(image =>
                image.WorkId == workId && image.Id == imageId);

        if (image == null)
        {
            return NotFound();
        }

        var fileName = Path.GetFileName(image.ImageUrl);
        var extension = Path.GetExtension(fileName).ToLowerInvariant();

        var contentType = extension switch
        {
            ".png" => "image/png",
            ".jpg" => "image/jpeg",
            ".webp" => "image/webp",
            _ => null
        };

        if (contentType == null ||
            !Guid.TryParseExact(
                Path.GetFileNameWithoutExtension(fileName),
                "N",
                out _))
        {
            return NotFound();
        }

        var path = Path.Combine(_imageDirectory, fileName);

        if (!System.IO.File.Exists(path))
        {
            return NotFound();
        }

        Response.Headers["X-Content-Type-Options"] = "nosniff";
        return PhysicalFile(path, contentType);
    }

    // 一次接收一張；前端可逐張上傳多張。
    [Authorize]
    [HttpPost]
    [RequestSizeLimit(6 * 1024 * 1024)]
    [RequestFormLimits(MultipartBodyLengthLimit = 6 * 1024 * 1024)]
    public async Task<IActionResult> Upload(
        int workId,
        [FromForm] IFormFile file)
    {
        if (!await _context.Works.AnyAsync(work => work.Id == workId))
        {
            return NotFound(new { message = "作品不存在。" });
        }

        if (file.Length == 0 || file.Length > 5 * 1024 * 1024)
        {
            return BadRequest(new
            {
                message = "每張圖片需大於 0 Bytes，且不得超過 5 MB。"
            });
        }

        await using var memory = new MemoryStream();
        await file.CopyToAsync(memory);
        var bytes = memory.ToArray();

        // 依檔案內容判斷格式，不只相信副檔名。
        var extension = DetectExtension(bytes);

        if (extension == null)
        {
            return BadRequest(new
            {
                message = "只接受 PNG、JPEG 或 WebP 圖片。"
            });
        }

        Directory.CreateDirectory(_imageDirectory);

        var fileName = $"{Guid.NewGuid():N}{extension}";
        var path = Path.Combine(_imageDirectory, fileName);

        var image = new WorkImage
        {
            WorkId = workId,
            ImageUrl = fileName,
            CreatedAtUtc = DateTime.UtcNow
        };

        try
        {
            await System.IO.File.WriteAllBytesAsync(path, bytes);

            _context.WorkImages.Add(image);
            await _context.SaveChangesAsync();
        }
        catch
        {
            if (System.IO.File.Exists(path))
            {
                System.IO.File.Delete(path);
            }

            throw;
        }

        return StatusCode(StatusCodes.Status201Created, new
        {
            image.Id,
            Url = $"/api/Works/{workId}/images/{image.Id}/file"
        });
    }

    [Authorize]
    [HttpDelete("{imageId:int}")]
    public async Task<IActionResult> Delete(int workId, int imageId)
    {
        var image = await _context.WorkImages.FirstOrDefaultAsync(
            image => image.WorkId == workId && image.Id == imageId);

        if (image == null)
        {
            return NotFound();
        }

        _context.WorkImages.Remove(image);
        await _context.SaveChangesAsync();

        // 檔案暫時保留，公開 API 已無法再透過這筆紀錄取得。
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