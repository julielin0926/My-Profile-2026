using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyProfileAPI.Migrations
{
    /// <inheritdoc />
    public partial class UniqueExperienceImageSlots : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ExperienceImages_ExperienceId",
                table: "ExperienceImages");

            migrationBuilder.CreateIndex(
                name: "IX_ExperienceImages_ExperienceId_Kind",
                table: "ExperienceImages",
                columns: new[] { "ExperienceId", "Kind" },
                unique: true,
                filter: "[Kind] <> 'review'");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ExperienceImages_ExperienceId_Kind",
                table: "ExperienceImages");

            migrationBuilder.CreateIndex(
                name: "IX_ExperienceImages_ExperienceId",
                table: "ExperienceImages",
                column: "ExperienceId");
        }
    }
}
