using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace MyProfileAPI.Models;

public class UploadExperienceImageRequest
{
    [Required]
    public IFormFile File { get; set; } = null!;

    [Required]
    [RegularExpression(
        "^(cover|company-logo|activity-logo|work-1|work-2|work-3|review)$")]
    public string Kind { get; set; } = "";

    [StringLength(200)]
public string? Caption { get; set; }
}