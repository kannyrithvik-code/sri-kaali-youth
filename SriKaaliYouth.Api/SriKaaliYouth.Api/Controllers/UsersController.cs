using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SriKaaliYouth.Api.Data;
using SriKaaliYouth.Api.DTOs;
using SriKaaliYouth.Api.Models;
using Microsoft.AspNetCore.Authorization;

namespace SriKaaliYouth.Api.Controllers
{
    [ApiController]
    [Route("api/users")]
    [Authorize(Roles = "Admin")]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UsersController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/users
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var users = await _context.Users
                .OrderBy(x => x.UserId)
                .Select(x => new
                {
                    x.UserId,
                    x.Name,
                    x.MobileNumber,
                    x.Username,
                    x.Role,
                    status = x.Status ?? (x.IsActive ? "Approved" : "Disabled"),
                    x.IsActive,
                    x.CreatedAt
                })
                .ToListAsync();

            return Ok(users);
        }

        // GET: api/users/1
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var user = await _context.Users
                .Where(x => x.UserId == id)
                .Select(x => new
                {
                    x.UserId,
                    x.Name,
                    x.MobileNumber,
                    x.Username,
                    x.Role,
                    status = x.Status ?? (x.IsActive ? "Approved" : "Disabled"),
                    x.IsActive,
                    x.CreatedAt
                })
                .FirstOrDefaultAsync();

            if (user == null)
            {
                return NotFound(new
                {
                    message = "User not found."
                });
            }

            return Ok(user);
        }

        // POST: api/users
        [HttpPost]
        public async Task<IActionResult> Create(UserCreateDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return BadRequest(new { message = "Name is required." });
            }

            if (string.IsNullOrWhiteSpace(request.Username))
            {
                return BadRequest(new { message = "Username is required." });
            }

            if (string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new { message = "Password is required." });
            }

            if (request.Role != "Admin" && request.Role != "Member")
            {
                return BadRequest(new { message = "Role must be Admin or Member." });
            }

            var usernameExists = await _context.Users
                .AnyAsync(x => x.Username.ToLower() == request.Username.Trim().ToLower());

            if (usernameExists)
            {
                return BadRequest(new { message = "Username already exists." });
            }

            var user = new User
            {
                Name = request.Name.Trim(),
                MobileNumber = string.IsNullOrWhiteSpace(request.MobileNumber) ? null : request.MobileNumber.Trim(),
                Username = request.Username.Trim(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                Role = request.Role,
                Status = "Approved",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "User created successfully.",
                data = new
                {
                    user.UserId,
                    user.Name,
                    user.MobileNumber,
                    user.Username,
                    user.Role,
                    status = user.Status,
                    user.IsActive
                }
            });
        }

        // PUT: api/users/1/approve OR POST: api/users/1/approve
        [HttpPut("{id}/approve")]
        [HttpPost("{id}/approve")]
        public async Task<IActionResult> ApproveMember(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound(new { message = "User not found." });
            }

            user.Status = "Approved";
            user.IsActive = true;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Member approved successfully.",
                userId = id,
                status = "Approved"
            });
        }

        // PUT: api/users/1/reject OR POST: api/users/1/reject
        [HttpPut("{id}/reject")]
        [HttpPost("{id}/reject")]
        public async Task<IActionResult> RejectMember(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound(new { message = "User not found." });
            }

            user.Status = "Rejected";
            user.IsActive = false;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Member registration rejected.",
                userId = id,
                status = "Rejected"
            });
        }

        // PUT: api/users/1
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, UserUpdateDto request)
        {
            var user = await _context.Users.FindAsync(id);

            if (user == null)
            {
                return NotFound(new { message = "User not found." });
            }

            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return BadRequest(new { message = "Name is required." });
            }

            if (string.IsNullOrWhiteSpace(request.Username))
            {
                return BadRequest(new { message = "Username is required." });
            }

            if (request.Role != "Admin" && request.Role != "Member")
            {
                return BadRequest(new { message = "Role must be Admin or Member." });
            }

            var username = request.Username.Trim();

            var usernameExists = await _context.Users
                .AnyAsync(x => x.UserId != id && x.Username.ToLower() == username.ToLower());

            if (usernameExists)
            {
                return BadRequest(new { message = "Username already exists." });
            }

            user.Name = request.Name.Trim();
            user.MobileNumber = string.IsNullOrWhiteSpace(request.MobileNumber) ? null : request.MobileNumber.Trim();
            user.Username = username;
            user.Role = request.Role;
            user.IsActive = request.IsActive;
            if (!request.IsActive && user.Status == "Approved")
            {
                user.Status = "Disabled";
            }
            else if (request.IsActive && (user.Status == "Disabled" || string.IsNullOrEmpty(user.Status)))
            {
                user.Status = "Approved";
            }

            if (!string.IsNullOrWhiteSpace(request.Password))
            {
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "User updated successfully.",
                data = new
                {
                    user.UserId,
                    user.Name,
                    user.MobileNumber,
                    user.Username,
                    user.Role,
                    status = user.Status,
                    user.IsActive
                }
            });
        }

        // DELETE: api/users/1
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var user = await _context.Users.FindAsync(id);

            if (user == null)
            {
                return NotFound(new { message = "User not found." });
            }

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "User deleted successfully." });
        }
    }
}