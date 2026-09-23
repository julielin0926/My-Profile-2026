using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using MyProfileAPI.Data;
using MyProfileAPI.Models;

namespace MyProfileAPI.Services;

public static class AuthorSeeder
{
    public static async Task RunAsync(AppDbContext context)
    {
        // 這個功能只用來建立第一位作者。
        if (await context.Authors.AnyAsync())
        {
            Console.WriteLine("已有作者帳號，不再新增。");
            return;
        }

        Console.Write("請輸入作者帳號：");
        var username = Console.ReadLine()?.Trim();

        Console.Write("請輸入密碼（輸入時不會顯示）：");
        var password = ReadPassword();

        Console.Write("請再次輸入密碼：");
        var confirmation = ReadPassword();

        if (string.IsNullOrWhiteSpace(username))
        {
            Console.WriteLine("帳號不可空白。");
            return;
        }

        if (password.Length < 8)
        {
            Console.WriteLine("請使用至少 8 個字元的密碼。");
            return;
        }

        if (password != confirmation)
        {
            Console.WriteLine("兩次密碼不同，未建立帳號。");
            return;
        }

        var author = new Author
        {
            Username = username
        };

        var hasher = new PasswordHasher<Author>();

        author.PasswordHash = hasher.HashPassword(
            author,
            password
        );

        context.Authors.Add(author);
        await context.SaveChangesAsync();

        Console.WriteLine($"作者帳號 {author.Username} 已建立。");
    }

    private static string ReadPassword()
    {
        var characters = new List<char>();

        while (true)
        {
            var key = Console.ReadKey(intercept: true);

            if (key.Key == ConsoleKey.Enter)
            {
                Console.WriteLine();
                return new string(characters.ToArray());
            }

            if (key.Key == ConsoleKey.Backspace)
            {
                if (characters.Count > 0)
                {
                    characters.RemoveAt(characters.Count - 1);
                }

                continue;
            }

            if (!char.IsControl(key.KeyChar))
            {
                characters.Add(key.KeyChar);
            }
        }
    }
}