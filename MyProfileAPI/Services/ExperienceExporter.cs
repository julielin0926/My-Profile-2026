using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using MyProfileAPI.Data;

namespace MyProfileAPI.Services;

public static class ExperienceExporter
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
                "API 上一層找不到 index.html。");
        }

        var dataDirectory = Path.Combine(siteRoot, "Data");

        var sourceDirectory = Path.Combine(
            contentRoot, "App_Data", "experience-images");

        var outputDirectory = Path.Combine(
            dataDirectory, "experience-images");

        var experiences = await context.Experiences
            .AsNoTracking()
            .Include(item => item.Images)
            .OrderBy(item => item.SortOrder)
            .ThenBy(item => item.Id)
            .ToListAsync();

        var images = experiences
            .SelectMany(item => item.Images)
            .ToArray();

        // 先檢查來源，確認所有需要公開的圖片都存在。
        foreach (var image in images)
        {
            ValidateFileName(image.FileName);

            var source = Path.Combine(
                sourceDirectory, image.FileName);

            if (!File.Exists(source))
            {
                throw new FileNotFoundException(
                    $"工作經驗 {image.ExperienceId} 缺少圖片：{image.FileName}");
            }
        }

        Directory.CreateDirectory(outputDirectory);

        foreach (var image in images)
        {
            File.Copy(
                Path.Combine(sourceDirectory, image.FileName),
                Path.Combine(outputDirectory, image.FileName),
                overwrite: true
            );
        }

        // 只輸出公開頁面需要的欄位。
        var publicExperiences = experiences.Select(item => new
        {
            item.Id,
            item.Title,
            item.Summary,
            item.Company,
            item.Role,
            item.Period,
            item.WorkContent,
            item.IntroductionHeading,
            item.Introduction,
            item.SortOrder,

            Images = item.Images
                .OrderBy(image => image.SortOrder)
                .ThenBy(image => image.Id)
                .Select(image => new
                {
                    image.Id,
                    image.Kind,
                    image.Caption,
                    Url = $"Data/experience-images/{image.FileName}"
                })
                .ToArray()
        }).ToArray();

        var json = JsonSerializer.Serialize(
            publicExperiences,
            new JsonSerializerOptions(JsonSerializerDefaults.Web)
            {
                WriteIndented = true
            }
        );

        var destination = Path.Combine(
            dataDirectory, "experiences.json");

        var temporary = destination + ".tmp";

        await File.WriteAllTextAsync(temporary, json);
        File.Move(temporary, destination, overwrite: true);

        Console.WriteLine(
            $"工作經驗匯出完成：{publicExperiences.Length} 筆，" +
            $"{images.Length} 張圖片。");
    }

    private static void ValidateFileName(string fileName)
    {
        var extension = Path.GetExtension(fileName);

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