namespace MyProfileAPI.Models;

public class WorkImage
{
    public int Id { get; set; }

    public int WorkId { get; set; }

    public string ImageUrl { get; set; } = "";

    public int SortOrder { get; set; }

    public string? Caption { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public Work? Work { get; set; }
}