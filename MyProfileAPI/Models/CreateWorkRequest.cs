using System.ComponentModel.DataAnnotations;

namespace MyProfileAPI.Models;

public class CreateWorkRequest : IValidatableObject
{
    [Required]
    [MaxLength(120)]
    public string Title { get; set; } = "";

    [MaxLength(10000)]
    public string Description { get; set; } = "";

    [Required]
    [RegularExpression("^(animation|video|game)$")]
    public string Category { get; set; } = "";

    [RegularExpression("^[A-Za-z0-9_-]{11}$")]
    public string? YouTubeVideoId { get; set; }

    [MaxLength(1000)]
    public string? ImageUrl { get; set; }

    [MaxLength(80)]
    public string? Genre { get; set; }

    [Range(1900, 2100)]
    public int? Year { get; set; }

    [MaxLength(2000)]
    public string? ExternalUrl { get; set; }

    [MaxLength(40)]
    public string? ButtonText { get; set; }

    [Range(0, int.MaxValue)]
    public int SortOrder { get; set; }

    public IEnumerable<ValidationResult> Validate(
        ValidationContext validationContext)
    {
        if (Category == "animation" || Category == "video")
        {
            if (string.IsNullOrWhiteSpace(YouTubeVideoId))
            {
                yield return new ValidationResult(
                    "動畫與影音作品必須填寫 YouTube 影片 ID。",
                    new[] { nameof(YouTubeVideoId) }
                );
            }
        }

        if (Category == "game")
        {
            if (!IsImageLocation(ImageUrl))
            {
                yield return new ValidationResult(
                    "請填寫 images/ 開頭的圖片路徑，或 HTTPS 圖片網址。",
                    new[] { nameof(ImageUrl) }
                );
            }

            if (string.IsNullOrWhiteSpace(Genre))
            {
                yield return new ValidationResult(
                    "請填寫遊戲類型。",
                    new[] { nameof(Genre) }
                );
            }

            if (Year == null)
            {
                yield return new ValidationResult(
                    "請填寫作品年份。",
                    new[] { nameof(Year) }
                );
            }

            if (!IsHttpsUrl(ExternalUrl))
            {
                yield return new ValidationResult(
                    "遊戲連結必須是完整的 HTTPS 網址。",
                    new[] { nameof(ExternalUrl) }
                );
            }

            if (string.IsNullOrWhiteSpace(ButtonText))
            {
                yield return new ValidationResult(
                    "請填寫按鈕文字。",
                    new[] { nameof(ButtonText) }
                );
            }
        }
    }

    private static bool IsHttpsUrl(string? value)
    {
        return Uri.TryCreate(value, UriKind.Absolute, out var uri)
            && uri.Scheme == Uri.UriSchemeHttps
            && !string.IsNullOrWhiteSpace(uri.Host)
            && string.IsNullOrEmpty(uri.UserInfo);
    }

    private static bool IsImageLocation(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        if (IsHttpsUrl(value))
        {
            return true;
        }

        return value.StartsWith("images/", StringComparison.Ordinal)
            && value.Length > "images/".Length
            && !value.Contains("..")
            && !value.Contains('\\')
            && !value.Contains('%')
            && !value.Contains('?')
            && !value.Contains('#');
    }
}
