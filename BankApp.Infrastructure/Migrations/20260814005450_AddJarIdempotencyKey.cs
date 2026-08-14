using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BankApp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddJarIdempotencyKey : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "IdempotencyKey",
                table: "JarTransactions",
                type: "nvarchar(450)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_JarTransactions_IdempotencyKey",
                table: "JarTransactions",
                column: "IdempotencyKey",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_JarTransactions_IdempotencyKey",
                table: "JarTransactions");

            migrationBuilder.DropColumn(
                name: "IdempotencyKey",
                table: "JarTransactions");
        }
    }
}
