using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SriKaaliYouth.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddUserAccountStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "status",
                table: "users",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "status",
                table: "users");
        }
    }
}
