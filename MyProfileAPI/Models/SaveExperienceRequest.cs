using System.ComponentModel.DataAnnotations;

namespace MyProfileAPI.Models;

public class SaveExperienceRequest
{
    [Required]
    [StringLength(100)]
    public string Title { get; set; } = "";

    [StringLength(300)]
    public string Summary { get; set; } = "";

    [StringLength(100)]
    public string Company { get; set; } = "";

    [StringLength(100)]
    public string Role { get; set; } = "";

    [StringLength(100)]
    public string Period { get; set; } = "";

    [Required]
    [StringLength(10000)]
    public string WorkContent { get; set; } = "";

    [Required]
    [StringLength(50)]
    public string IntroductionHeading { get; set; } = "活動介紹";

    [Required]
    [StringLength(10000)]
    public string Introduction { get; set; } = "";

    [Range(0, 100000)]
    public int SortOrder { get; set; } = 10;
}