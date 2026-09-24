using System.ComponentModel.DataAnnotations;

namespace MyProfileAPI.Models;

public class UpdateWorkDescriptionRequest
{
    [MaxLength(10000)]
    public string Description { get; set; } = "";
}
