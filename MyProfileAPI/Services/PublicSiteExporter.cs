using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using MyProfileAPI.Data;

namespace MyProfileAPI.Services;

public static class PublicSiteExporter
{
    public static async Task RunAsync(
        AppDbContext context,
        string contentRoot)
    {
        var siteRoot = Directory.GetParent(contentRoot)?.FullName
            ?? throw new InvalidOperationException("找不到網站根目錄。");

        if (!File.Exists(Path.Combine(siteRoot, "index.html")))
        {
            throw new InvalidOperationException(
                "API 上一層找不到 index.html，請確認專案位置。");
        }

        var dataDirectory = Path.Combine(siteRoot, "Data");
        var outputImages = Path.Combine(dataDirectory, "work-images");
        var sourceImages = Path.Combine(
            contentRoot, "App_Data", "work-images");

        var works = await context.Works
            .AsNoTracking()
            .OrderBy(work => work.SortOrder)
            .ThenBy(work => work.Id)
            .ToListAsync();

        var images = await context.WorkImages
            .AsNoTracking()
            .OrderBy(image => image.SortOrder)
            .ThenBy(image => image.Id)
            .ToListAsync();

        var workIds = works.Select(work => work.Id).ToHashSet();
        var imagesByWork = images
            .Where(image => workIds.Contains(image.WorkId))
            .ToLookup(image => image.WorkId);

        // 先檢查全部來源圖片，避免缺圖時產生不完整清單。
        foreach (var image in images.Where(
            image => workIds.Contains(image.WorkId)))
        {
            ValidateImageFileName(image.ImageUrl);

            var source = Path.Combine(sourceImages, image.ImageUrl);

            if (!File.Exists(source))
            {
                throw new FileNotFoundException(
                    $"作品 {image.WorkId} 的圖片不存在：{image.ImageUrl}");
            }
        }

        Directory.CreateDirectory(outputImages);

        foreach (var image in images.Where(
            image => workIds.Contains(image.WorkId)))
        {
            File.Copy(
                Path.Combine(sourceImages, image.ImageUrl),
                Path.Combine(outputImages, image.ImageUrl),
                overwrite: true
            );
        }

        // 明確列出公開欄位，不匯出作者帳號、密碼或設定。
        var publicWorks = works.Select(work => new
        {
            work.Id,
            work.Title,
            work.Description,
            work.Category,
            work.YouTubeVideoId,
            work.ImageUrl,
            work.Genre,
            work.Year,
            work.ExternalUrl,
            work.ButtonText,
            work.SortOrder,

            Images = imagesByWork[work.Id].Select(image => new
            {
                image.Id,
                image.Caption,
                Url = $"Data/work-images/{image.ImageUrl}"
            }).ToArray()
        }).ToArray();

        var json = JsonSerializer.Serialize(
            publicWorks,
            new JsonSerializerOptions(JsonSerializerDefaults.Web)
            {
                WriteIndented = true
            }
        );

        var destination = Path.Combine(dataDirectory, "works.json");
        var temporary = destination + ".tmp";

        await File.WriteAllTextAsync(temporary, json);
        File.Move(temporary, destination, overwrite: true);

        Console.WriteLine(
            $"公開資料匯出完成：{publicWorks.Length} 件作品。");
        Console.WriteLine(destination);
    }

    private static void ValidateImageFileName(string fileName)
    {
        var extension = Path.GetExtension(fileName).ToLowerInvariant();

        if (Path.GetFileName(fileName) != fileName ||
            !Guid.TryParseExact(
                Path.GetFileNameWithoutExtension(fileName),
                "N",
                out _) ||
            extension is not (".jpg" or ".png" or ".webp"))
        {
            throw new InvalidOperationException(
                $"圖片檔名格式不正確：{fileName}");
        }
    }
}