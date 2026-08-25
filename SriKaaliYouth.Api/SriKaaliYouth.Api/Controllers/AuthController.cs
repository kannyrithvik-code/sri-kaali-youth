using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SriKaaliYouth.Api.Data;
using SriKaaliYouth.Api.DTOs;
using SriKaaliYouth.Api.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;

namespace SriKaaliYouth.Api.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(
            AppDbContext context,
            IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return BadRequest(new { message = "Full Name is required." });
            }

            if (string.IsNullOrWhiteSpace(request.Username))
            {
                return BadRequest(new { message = "Username is required." });
            }

            var usernameClean = request.Username.Trim();
            if (usernameClean.Contains(" ") || usernameClean.Length < 3)
            {
                return BadRequest(new { message = "Username must be at least 3 characters and contain no spaces." });
            }

            var phone = !string.IsNullOrWhiteSpace(request.PhoneNumber)
                ? request.PhoneNumber.Trim()
                : (!string.IsNullOrWhiteSpace(request.MobileNumber) ? request.MobileNumber.Trim() : "");

            if (string.IsNullOrWhiteSpace(phone) || !Regex.IsMatch(phone, @"^[6-9][0-9]{9}$"))
            {
                return BadRequest(new { message = "Valid 10-digit Indian mobile number is required." });
            }

            if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 8)
            {
                return BadRequest(new { message = "Password must be at least 8 characters long." });
            }

            var usernameExists = await _context.Users
                .AnyAsync(x => x.Username.ToLower() == usernameClean.ToLower());

            if (usernameExists)
            {
                return BadRequest(new { message = "Username already exists. Please choose a different username." });
            }

            var user = new User
            {
                Name = request.Name.Trim(),
                Username = usernameClean,
                MobileNumber = phone,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                Role = "Member",
                Status = "Pending",
                IsActive = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var loginRequest = new MemberLoginRequest
            {
                UserId = user.UserId,
                RequestToken = GenerateSecureToken(),
                RequestedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddYears(100),
                Status = "Pending"
            };

            _context.MemberLoginRequests.Add(loginRequest);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Registration submitted successfully. Your account is waiting for administrator approval."
            });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Username) ||
                string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new
                {
                    message = "Username and password are required."
                });
            }

            var username = request.Username.Trim().ToLower();

            var user = await _context.Users
                .FirstOrDefaultAsync(x => x.Username.ToLower() == username);

            if (user == null)
            {
                return Unauthorized(new
                {
                    message = "Invalid username or password."
                });
            }

            var passwordValid = BCrypt.Net.BCrypt.Verify(
                request.Password,
                user.PasswordHash
            );

            if (!passwordValid)
            {
                return Unauthorized(new
                {
                    message = "Invalid username or password."
                });
            }

            // 1. Check if account registration is awaiting Admin approval
            if (string.Equals(user.Status, "Pending", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(user.Status, "PendingApproval", StringComparison.OrdinalIgnoreCase))
            {
                return Unauthorized(new
                {
                    message = "Your account is waiting for administrator approval.",
                    status = "PendingApproval"
                });
            }

            // 2. Check if account registration was rejected
            if (string.Equals(user.Status, "Rejected", StringComparison.OrdinalIgnoreCase))
            {
                return Unauthorized(new
                {
                    message = "Your registration request has been rejected. Please contact the administrator.",
                    status = "Rejected"
                });
            }

            // 3. Check if account has been disabled
            if (string.Equals(user.Status, "Disabled", StringComparison.OrdinalIgnoreCase) ||
                (!user.IsActive && !string.Equals(user.Status, "Approved", StringComparison.OrdinalIgnoreCase)))
            {
                return Unauthorized(new
                {
                    message = "Your account has been disabled. Please contact the administrator.",
                    status = "Disabled"
                });
            }

            // LOGIN SUCCESSFUL (Admin or Approved Member)
            var token = GenerateJwtToken(user);
            return Ok(new
            {
                success = true,
                requiresAdminApproval = false,
                requiresApproval = false,
                message = "Login successful.",
                token = token,
                user = new
                {
                    id = user.UserId,
                    userId = user.UserId,
                    name = user.Name,
                    username = user.Username,
                    role = user.Role,
                    status = user.Status,
                    mobileNumber = user.MobileNumber
                }
            });
        }

        // GET: api/auth/login-requests/{requestId}/status
        [HttpGet("login-requests/{requestId}/status")]
        [HttpGet("login-request/{requestId}/status")]
        public async Task<IActionResult> GetLoginRequestStatus(int requestId, [FromQuery] string? requestToken)
        {
            MemberLoginRequest? loginRequest;

            if (!string.IsNullOrWhiteSpace(requestToken))
            {
                loginRequest = await _context.MemberLoginRequests
                    .Include(r => r.User)
                    .FirstOrDefaultAsync(r => r.Id == requestId && r.RequestToken == requestToken.Trim());
            }
            else
            {
                loginRequest = await _context.MemberLoginRequests
                    .Include(r => r.User)
                    .FirstOrDefaultAsync(r => r.Id == requestId);
            }

            if (loginRequest == null)
            {
                return NotFound(new
                {
                    status = "NotFound",
                    message = "Login request not found."
                });
            }

            // Check expiration for pending request
            if (string.Equals(loginRequest.Status, "Pending", StringComparison.OrdinalIgnoreCase))
            {
                if (DateTime.UtcNow > loginRequest.ExpiresAt)
                {
                    loginRequest.Status = "Expired";
                    await _context.SaveChangesAsync();

                    return Ok(new
                    {
                        status = "Expired",
                        message = "Your login request has expired. Please login again."
                    });
                }

                return Ok(new
                {
                    status = "Pending",
                    message = "Your account is awaiting administrator approval."
                });
            }

            if (string.Equals(loginRequest.Status, "Rejected", StringComparison.OrdinalIgnoreCase))
            {
                return Ok(new
                {
                    status = "Rejected",
                    message = "Your login request was rejected by the administrator."
                });
            }

            if (string.Equals(loginRequest.Status, "Expired", StringComparison.OrdinalIgnoreCase))
            {
                return Ok(new
                {
                    status = "Expired",
                    message = "Your login request has expired. Please login again."
                });
            }

            if (string.Equals(loginRequest.Status, "Approved", StringComparison.OrdinalIgnoreCase))
            {
                if (loginRequest.User == null || !loginRequest.User.IsActive)
                {
                    return Unauthorized(new
                    {
                        message = "User account is inactive or not found."
                    });
                }

                var token = GenerateJwtToken(loginRequest.User);

                if (!loginRequest.ConsumedAt.HasValue)
                {
                    loginRequest.ConsumedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                }

                return Ok(new
                {
                    status = "Approved",
                    token = token,
                    user = new
                    {
                        id = loginRequest.User.UserId,
                        userId = loginRequest.User.UserId,
                        name = loginRequest.User.Name,
                        username = loginRequest.User.Username,
                        role = loginRequest.User.Role,
                        status = loginRequest.User.Status,
                        mobileNumber = loginRequest.User.MobileNumber
                    }
                });
            }

            return BadRequest(new
            {
                message = "Invalid login request status."
            });
        }

        private static string GenerateSecureToken()
        {
            var bytes = new byte[32];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(bytes);
            return Convert.ToHexString(bytes).ToLowerInvariant();
        }

        private string GenerateJwtToken(User user)
        {
            var jwtKey = _configuration["Jwt:Key"]
                ?? throw new InvalidOperationException("JWT Key is not configured.");

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Role, user.Role)
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var expiryMinutes = int.TryParse(_configuration["Jwt:ExpiryMinutes"], out var minutes)
                ? minutes
                : 480;

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}