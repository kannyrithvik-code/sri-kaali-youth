using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SriKaaliYouth.Api.Data;
using System.Security.Claims;

namespace SriKaaliYouth.Api.Controllers
{
    [ApiController]
    [Authorize(Roles = "Admin,ADMIN,admin")]
    public class AdminLoginRequestsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdminLoginRequestsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/admin/login-requests OR api/auth/login-requests/pending
        [HttpGet("/api/admin/login-requests")]
        [HttpGet("/api/admin/login-requests/pending")]
        [HttpGet("/api/auth/login-requests/pending")]
        [HttpGet("/api/auth/login-requests")]
        public async Task<IActionResult> GetPendingLoginRequests()
        {
            // Sync any pending Member users that do not have an active MemberLoginRequest entry yet
            var pendingUsersWithoutRequest = await _context.Users
                .Where(u => u.Role == "Member" && (u.Status == "Pending" || u.Status == "PendingApproval"))
                .Where(u => !_context.MemberLoginRequests.Any(r => r.UserId == u.UserId && r.Status == "Pending"))
                .ToListAsync();

            if (pendingUsersWithoutRequest.Any())
            {
                foreach (var user in pendingUsersWithoutRequest)
                {
                    var requestedAt = user.CreatedAt != default
                        ? (user.CreatedAt.Kind == DateTimeKind.Unspecified
                            ? DateTime.SpecifyKind(user.CreatedAt, DateTimeKind.Utc)
                            : user.CreatedAt.ToUniversalTime())
                        : DateTime.UtcNow;

                    _context.MemberLoginRequests.Add(new Models.MemberLoginRequest
                    {
                        UserId = user.UserId,
                        RequestToken = Guid.NewGuid().ToString("N"),
                        RequestedAt = requestedAt,
                        ExpiresAt = DateTime.UtcNow.AddYears(100),
                        Status = "Pending"
                    });
                }
                await _context.SaveChangesAsync();
            }

            var pendingRequests = await _context.MemberLoginRequests
                .Include(r => r.User)
                .Where(r => r.Status == "Pending" && r.User != null && (r.User.Status == "Pending" || r.User.Status == "PendingApproval"))
                .OrderByDescending(r => r.RequestedAt)
                .Select(r => new
                {
                    loginRequestId = r.Id,
                    id = r.Id,
                    userId = r.UserId,
                    memberName = r.User != null ? r.User.Name : string.Empty,
                    name = r.User != null ? r.User.Name : string.Empty,
                    username = r.User != null ? r.User.Username : string.Empty,
                    requestedAt = r.RequestedAt,
                    expiresAt = r.ExpiresAt,
                    status = "Pending"
                })
                .ToListAsync();

            return Ok(pendingRequests);
        }

        // POST: api/admin/login-requests/5/approve OR api/auth/login-requests/5/approve
        [HttpPost("/api/admin/login-requests/{id}/approve")]
        [HttpPost("/api/auth/login-requests/{id}/approve")]
        [HttpPut("/api/admin/login-requests/{id}/approve")]
        [HttpPut("/api/auth/login-requests/{id}/approve")]
        public async Task<IActionResult> ApproveLoginRequest(int id)
        {
            var loginRequest = await _context.MemberLoginRequests
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.Id == id || r.UserId == id);

            if (loginRequest == null)
            {
                var userObj = await _context.Users.FirstOrDefaultAsync(u => u.UserId == id);
                if (userObj != null)
                {
                    userObj.Status = "Approved";
                    userObj.IsActive = true;
                    await _context.SaveChangesAsync();

                    return Ok(new
                    {
                        success = true,
                        message = "Member login request approved.",
                        loginRequestId = id,
                        status = "Approved"
                    });
                }

                return NotFound(new
                {
                    success = false,
                    message = "Login request not found."
                });
            }

            var adminIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            int? adminUserId = int.TryParse(adminIdClaim, out var parsedId) ? parsedId : null;

            loginRequest.Status = "Approved";
            loginRequest.ApprovedByUserId = adminUserId;
            loginRequest.ApprovedAt = DateTime.UtcNow;

            if (loginRequest.User != null)
            {
                loginRequest.User.Status = "Approved";
                loginRequest.User.IsActive = true;
            }

            var targetUserId = loginRequest.UserId;
            var otherRequests = await _context.MemberLoginRequests
                .Where(r => r.UserId == targetUserId && r.Status == "Pending")
                .ToListAsync();

            foreach (var req in otherRequests)
            {
                req.Status = "Approved";
                req.ApprovedByUserId = adminUserId;
                req.ApprovedAt = DateTime.UtcNow;
            }

            var userRecord = await _context.Users.FirstOrDefaultAsync(u => u.UserId == targetUserId);
            if (userRecord != null)
            {
                userRecord.Status = "Approved";
                userRecord.IsActive = true;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Member login request approved.",
                loginRequestId = id,
                status = "Approved"
            });
        }

        // POST: api/admin/login-requests/5/reject OR api/auth/login-requests/5/reject
        [HttpPost("/api/admin/login-requests/{id}/reject")]
        [HttpPost("/api/auth/login-requests/{id}/reject")]
        [HttpPut("/api/admin/login-requests/{id}/reject")]
        [HttpPut("/api/auth/login-requests/{id}/reject")]
        public async Task<IActionResult> RejectLoginRequest(int id)
        {
            var loginRequest = await _context.MemberLoginRequests
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.Id == id || r.UserId == id);

            if (loginRequest == null)
            {
                var userObj = await _context.Users.FirstOrDefaultAsync(u => u.UserId == id);
                if (userObj != null)
                {
                    userObj.Status = "Rejected";
                    userObj.IsActive = false;
                    await _context.SaveChangesAsync();

                    return Ok(new
                    {
                        success = true,
                        message = "Member login request rejected.",
                        loginRequestId = id,
                        status = "Rejected"
                    });
                }

                return NotFound(new
                {
                    success = false,
                    message = "Login request not found."
                });
            }

            loginRequest.Status = "Rejected";
            loginRequest.RejectedAt = DateTime.UtcNow;

            if (loginRequest.User != null)
            {
                loginRequest.User.Status = "Rejected";
                loginRequest.User.IsActive = false;
            }

            var targetUserId = loginRequest.UserId;
            var otherRequests = await _context.MemberLoginRequests
                .Where(r => r.UserId == targetUserId && r.Status == "Pending")
                .ToListAsync();

            foreach (var req in otherRequests)
            {
                req.Status = "Rejected";
                req.RejectedAt = DateTime.UtcNow;
            }

            var userRecord = await _context.Users.FirstOrDefaultAsync(u => u.UserId == targetUserId);
            if (userRecord != null)
            {
                userRecord.Status = "Rejected";
                userRecord.IsActive = false;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Member login request rejected.",
                loginRequestId = id,
                status = "Rejected"
            });
        }
    }
}
