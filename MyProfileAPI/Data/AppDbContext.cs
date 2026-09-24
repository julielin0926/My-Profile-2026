using Microsoft.EntityFrameworkCore;
using MyProfileAPI.Models;

namespace MyProfileAPI.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<Author> Authors => Set<Author>();
    public DbSet<Work> Works => Set<Work>();
    public DbSet<WorkImage> WorkImages => Set<WorkImage>();
    protected override void OnModelCreating(
    ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<WorkImage>()
            .HasOne(image => image.Work)
            .WithMany()
            .HasForeignKey(image => image.WorkId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}