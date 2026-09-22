namespace MyProfileAPI.Models;

public class Author
{
    public int Id { get; set; }

    public string Username { get; set; } = "";

    public string PasswordHash { get; set; } = "";
}