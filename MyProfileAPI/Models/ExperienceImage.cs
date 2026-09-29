using System.ComponentModel.DataAnnotations;

namespace MyProfileAPI.Models;

public class ExperienceImage
{
    public int Id { get; set; }

    public int ExperienceId { get; set; }

    [MaxLength(30)]
    public string Kind { get; set; } = "";

    [MaxLength(100)]
    public string FileName { get; set; } = "";

    [MaxLength(200)]
    public string Caption { get; set; } = "";

    public int SortOrder { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public Experience? Experience { get; set; }
}