using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SriKaaliYouth.Api.Data;
using SriKaaliYouth.Api.DTOs;
using SriKaaliYouth.Api.Models;
using System.Security.Claims;

namespace SriKaaliYouth.Api.Controllers
{
    [ApiController]
    [Route("api/sponsors")]
    [Authorize]
    public class SponsorsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SponsorsController(AppDbContext context)
        {
            _context = context;
        }

        private int? GetCurrentUserId()
        {
            var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(claim, out var id) ? id : null;
        }

        // GET: api/sponsors (Admin only)
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAll()
        {
            var sponsors = await _context.Sponsors
                .OrderByDescending(x => x.SponsorId)
                .ToListAsync();

            return Ok(sponsors);
        }

        // GET: api/sponsors/1 (Admin or record creator)
        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,Member")]
        public async Task<IActionResult> GetById(int id)
        {
            var sponsor = await _context.Sponsors
                .FirstOrDefaultAsync(x => x.SponsorId == id);

            if (sponsor == null)
            {
                return NotFound(new
                {
                    message = "Sponsor not found."
                });
            }

            if (!User.IsInRole("Admin"))
            {
                var userId = GetCurrentUserId();
                if (sponsor.CreatedBy != userId)
                {
                    return Forbid();
                }
            }

            return Ok(sponsor);
        }

        // POST: api/sponsors (Admin + Member)
        [HttpPost]
        [Authorize(Roles = "Admin,Member")]
        public async Task<IActionResult> Create(SponsorCreateDto request)
        {
            if (request.FestivalId <= 0)
            {
                return BadRequest(new
                {
                    message = "Festival is required."
                });
            }

            if (string.IsNullOrWhiteSpace(request.SponsorName))
            {
                return BadRequest(new
                {
                    message = "Sponsor name is required."
                });
            }

            if (string.IsNullOrWhiteSpace(request.Contribution))
            {
                return BadRequest(new
                {
                    message = "Contribution is required."
                });
            }

            var festivalExists = await _context.FestivalEvents
                .AnyAsync(x => x.FestivalId == request.FestivalId);

            if (!festivalExists)
            {
                return BadRequest(new
                {
                    message = "Festival not found."
                });
            }

            var currentUserId = GetCurrentUserId();

            var sponsor = new Sponsor
            {
                FestivalId = request.FestivalId,
                SponsorName = request.SponsorName.Trim(),
                VillageArea = string.IsNullOrWhiteSpace(request.VillageArea)
                    ? null
                    : request.VillageArea.Trim(),
                Contribution = request.Contribution.Trim(),
                CreatedBy = currentUserId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Sponsors.Add(sponsor);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Sponsor created successfully.",
                data = sponsor
            });
        }

        // PUT: api/sponsors/1 (Admin or record creator)
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Member")]
        public async Task<IActionResult> Update(
            int id,
            SponsorUpdateDto request)
        {
            var sponsor = await _context.Sponsors.FindAsync(id);

            if (sponsor == null)
            {
                return NotFound(new
                {
                    message = "Sponsor not found."
                });
            }

            if (!User.IsInRole("Admin"))
            {
                var userId = GetCurrentUserId();
                if (sponsor.CreatedBy != userId)
                {
                    return Forbid();
                }
            }

            if (request.FestivalId <= 0)
            {
                return BadRequest(new
                {
                    message = "Festival is required."
                });
            }

            if (string.IsNullOrWhiteSpace(request.SponsorName))
            {
                return BadRequest(new
                {
                    message = "Sponsor name is required."
                });
            }

            if (string.IsNullOrWhiteSpace(request.Contribution))
            {
                return BadRequest(new
                {
                    message = "Contribution is required."
                });
            }

            var festivalExists = await _context.FestivalEvents
                .AnyAsync(x => x.FestivalId == request.FestivalId);

            if (!festivalExists)
            {
                return BadRequest(new
                {
                    message = "Festival not found."
                });
            }

            sponsor.FestivalId = request.FestivalId;
            sponsor.SponsorName = request.SponsorName.Trim();
            sponsor.VillageArea = string.IsNullOrWhiteSpace(request.VillageArea)
                ? null
                : request.VillageArea.Trim();
            sponsor.Contribution = request.Contribution.Trim();

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Sponsor updated successfully.",
                data = sponsor
            });
        }

        // DELETE: api/sponsors/1 (Admin only)
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var sponsor = await _context.Sponsors.FindAsync(id);

            if (sponsor == null)
            {
                return NotFound(new
                {
                    message = "Sponsor not found."
                });
            }

            _context.Sponsors.Remove(sponsor);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Sponsor deleted successfully."
            });
        }
    }
}