using System.ComponentModel.DataAnnotations;

namespace MyProfileAPI.Models;

public class Work
{
    public int Id { get; set; }

    [Required]
    [MaxLength(120)]
    public string Title { get; set; } = "";

    [Required]
    [MaxLength(20)]
    [RegularExpression("^(animation|video|game)$")]
    public string Category { get; set; } = "";

    [MaxLength(11)]
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

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}