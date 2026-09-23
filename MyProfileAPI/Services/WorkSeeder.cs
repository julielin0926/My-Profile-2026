using Microsoft.EntityFrameworkCore;
using MyProfileAPI.Data;
using MyProfileAPI.Models;

namespace MyProfileAPI.Services;

public static class WorkSeeder
{
    public static async Task RunAsync(AppDbContext context)
    {
        var works = new List<Work>
        {
            new()
            {
                Title = "小幽登ㄉㄨㄚˇ郎",
                Category = "animation",
                YouTubeVideoId = "CC11UbcK9qM",
                SortOrder = 1
            },
            new()
            {
                Title = "失去的聲音",
                Category = "animation",
                YouTubeVideoId = "8bAwB68yzBY",
                SortOrder = 2
            },
            new()
            {
                Title = "消失的幽靈",
                Category = "animation",
                YouTubeVideoId = "lx1hlF5YE5Q",
                SortOrder = 3
            },
            new()
            {
                Title = "事石令人鼻酸",
                Category = "animation",
                YouTubeVideoId = "TCYr43luywc",
                SortOrder = 4
            },
            new()
            {
                Title = "Surprise",
                Category = "video",
                YouTubeVideoId = "bt--nQfPIU0",
                SortOrder = 1
            },
            new()
            {
                Title = "流浪動物的日與夜",
                Category = "video",
                YouTubeVideoId = "g2LEcenuQHo",
                SortOrder = 2
            },
            new()
            {
                Title = "心聲密語",
                Category = "game",
                ImageUrl = "images/xinshengmimi.png",
                Genre = "3D Game",
                Year = 2026,
                ExternalUrl =
                    "https://drive.google.com/drive/folders/1yTG1GwC1kpS2oyGAruwCzZpNf6i1fbY-",
                ButtonText = "前往下載",
                SortOrder = 1
            },
            new()
            {
                Title = "雨林之戰",
                Category = "game",
                ImageUrl = "images/yulinzhizhan.png",
                Genre = "2D Web Game",
                Year = 2023,
                ExternalUrl =
                    "https://julielin0926.github.io/game/game/index.html",
                ButtonText = "前往試玩",
                SortOrder = 2
            },
            new()
            {
                Title = "眾果出征紀",
                Category = "game",
                ImageUrl = "images/zhongguo.chuzhengji.png",
                Genre = "2D Web Game",
                Year = 2023,
                ExternalUrl =
                    "https://julielin0926.github.io/game/game2/index.html",
                ButtonText = "前往試玩",
                SortOrder = 3
            },
            new()
            {
                Title = "獴混過關",
                Category = "game",
                ImageUrl = "images/menghun guoguan.png",
                Genre = "2D Web Game",
                Year = 2023,
                ExternalUrl =
                    "https://drive.google.com/drive/folders/1djUY1nl4SwsrczSiR6uErls92ixK1UdO",
                ButtonText = "僅提供閱覽",
                SortOrder = 4
            }
        };

        var addedCount = 0;

        foreach (var work in works)
        {
            var exists = await context.Works.AnyAsync(existing =>
                existing.Category == work.Category
                && existing.Title == work.Title);

            if (exists)
            {
                continue;
            }

            context.Works.Add(work);
            addedCount++;
        }

        await context.SaveChangesAsync();

        Console.WriteLine($"作品匯入完成，本次新增 {addedCount} 件。");
    }
}