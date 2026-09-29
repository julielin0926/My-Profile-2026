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

    public DbSet<Experience> Experiences => Set<Experience>();

    public DbSet<ExperienceImage> ExperienceImages
        => Set<ExperienceImage>();

    protected override void OnModelCreating(
        ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<WorkImage>()
            .HasOne(image => image.Work)
            .WithMany()
            .HasForeignKey(image => image.WorkId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ExperienceImage>()
            .HasOne(image => image.Experience)
            .WithMany(experience => experience.Images)
            .HasForeignKey(image => image.ExperienceId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ExperienceImage>()
            .HasIndex(image => new
            {
                image.ExperienceId,
                image.Kind
            })
            .IsUnique()
            .HasFilter("[Kind] <> 'review'");
    }

}