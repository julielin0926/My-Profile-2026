using System.ComponentModel.DataAnnotations;

namespace MyProfileAPI.Models;

public class Experience
{
    public int Id { get; set; }

    [MaxLength(100)]
    public string Title { get; set; } = "";

    [MaxLength(300)]
    public string Summary { get; set; } = "";

    [MaxLength(100)]
    public string Company { get; set; } = "";

    [MaxLength(100)]
    public string Role { get; set; } = "";

    [MaxLength(100)]
    public string Period { get; set; } = "";

    [MaxLength(10000)]
    public string WorkContent { get; set; } = "";

    [MaxLength(50)]
    public string IntroductionHeading { get; set; } = "活動介紹";

    [MaxLength(10000)]
    public string Introduction { get; set; } = "";

    public int SortOrder { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public ICollection<ExperienceImage> Images { get; set; }
        = new List<ExperienceImage>();
}