using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SriKaaliYouth.Api.Data;
using Microsoft.AspNetCore.Authorization;

namespace SriKaaliYouth.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DatabaseTestController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DatabaseTestController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("connection")]
        public async Task<IActionResult> TestConnection()
        {
            try
            {
                var canConnect = await _context.Database.CanConnectAsync();

                if (!canConnect)
                {
                    return StatusCode(500, new
                    {
                        success = false,
                        message = "Unable to connect to PostgreSQL database."
                    });
                }

                return Ok(new
                {
                    success = true,
                    message = "PostgreSQL database connected successfully."
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        [HttpPost("seed-test-users")]
        public async Task<IActionResult> SeedTestUsers()
        {
            var adminUser = await _context.Users.FirstOrDefaultAsync(u => u.Username == "admin");
            if (adminUser == null)
            {
                adminUser = new Models.User
                {
                    Name = "System Admin",
                    Username = "admin",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("AdminPassword123!"),
                    Role = "Admin",
                    Status = "Approved",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Users.Add(adminUser);
            }
            else
            {
                adminUser.Role = "Admin";
                adminUser.Status = "Approved";
                adminUser.IsActive = true;
                adminUser.PasswordHash = BCrypt.Net.BCrypt.HashPassword("AdminPassword123!");
            }

            var memberUser = await _context.Users.FirstOrDefaultAsync(u => u.Username == "kanny");
            if (memberUser == null)
            {
                memberUser = new Models.User
                {
                    Name = "Kanny",
                    Username = "kanny",
                    MobileNumber = "9876543210",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("MemberPassword123!"),
                    Role = "Member",
                    Status = "Approved",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Users.Add(memberUser);
            }
            else
            {
                memberUser.Role = "Member";
                memberUser.Status = "Approved";
                memberUser.IsActive = true;
                memberUser.PasswordHash = BCrypt.Net.BCrypt.HashPassword("MemberPassword123!");
            }

            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = "Test users seeded successfully." });
        }
    }
}