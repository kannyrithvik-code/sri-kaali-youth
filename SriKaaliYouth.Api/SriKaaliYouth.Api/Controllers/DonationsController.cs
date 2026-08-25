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
    [Route("api/donations")]
    [Authorize]
    public class DonationsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DonationsController(AppDbContext context)
        {
            _context = context;
        }

        private int? GetCurrentUserId()
        {
            var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(claim, out var id) ? id : null;
        }

        // GET: api/donations (Admin only: financial history records)
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllDonations()
        {
            var donations = await _context.Donations
                .OrderByDescending(x => x.DonationDate)
                .ThenByDescending(x => x.DonationId)
                .ToListAsync();

            return Ok(donations);
        }

        // GET: api/donations/1 (Admin or record creator)
        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,Member")]
        public async Task<IActionResult> GetDonation(int id)
        {
            var donation = await _context.Donations
                .FirstOrDefaultAsync(x => x.DonationId == id);

            if (donation == null)
            {
                return NotFound(new
                {
                    message = "Donation not found."
                });
            }

            if (!User.IsInRole("Admin"))
            {
                var userId = GetCurrentUserId();
                if (donation.CreatedBy != userId)
                {
                    return Forbid();
                }
            }

            return Ok(donation);
        }

        // POST: api/donations (Admin + Member)
        [HttpPost]
        [Authorize(Roles = "Admin,Member")]
        public async Task<IActionResult> CreateDonation(DonationCreateDto request)
        {
            if (request.FestivalId <= 0)
            {
                return BadRequest(new
                {
                    message = "Festival is required."
                });
            }

            if (string.IsNullOrWhiteSpace(request.DonorName))
            {
                return BadRequest(new
                {
                    message = "Donor name is required."
                });
            }

            if (request.Amount <= 0)
            {
                return BadRequest(new
                {
                    message = "Amount must be greater than zero."
                });
            }

            if (request.PaymentMode != "Cash" &&
                request.PaymentMode != "Online")
            {
                return BadRequest(new
                {
                    message = "Payment mode must be Cash or Online."
                });
            }

            if (string.IsNullOrWhiteSpace(request.ReceiverName))
            {
                return BadRequest(new
                {
                    message = "Receiver name is required."
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

            var donation = new Donation
            {
                FestivalId = request.FestivalId,
                DonorName = request.DonorName.Trim(),
                VillageArea = string.IsNullOrWhiteSpace(request.VillageArea)
                    ? null
                    : request.VillageArea.Trim(),
                Amount = request.Amount,
                PaymentMode = request.PaymentMode,
                ReceiverName = request.ReceiverName.Trim(),
                DonationDate = request.DonationDate,
                CreatedBy = currentUserId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Donations.Add(donation);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Donation created successfully.",
                data = donation
            });
        }

        // PUT: api/donations/1 (Admin or record creator)
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Member")]
        public async Task<IActionResult> UpdateDonation(
            int id,
            DonationUpdateDto request)
        {
            var donation = await _context.Donations.FindAsync(id);

            if (donation == null)
            {
                return NotFound(new
                {
                    message = "Donation not found."
                });
            }

            if (!User.IsInRole("Admin"))
            {
                var userId = GetCurrentUserId();
                if (donation.CreatedBy != userId)
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

            if (string.IsNullOrWhiteSpace(request.DonorName))
            {
                return BadRequest(new
                {
                    message = "Donor name is required."
                });
            }

            if (request.Amount <= 0)
            {
                return BadRequest(new
                {
                    message = "Amount must be greater than zero."
                });
            }

            if (request.PaymentMode != "Cash" &&
                request.PaymentMode != "Online")
            {
                return BadRequest(new
                {
                    message = "Payment mode must be Cash or Online."
                });
            }

            if (string.IsNullOrWhiteSpace(request.ReceiverName))
            {
                return BadRequest(new
                {
                    message = "Receiver name is required."
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

            donation.FestivalId = request.FestivalId;
            donation.DonorName = request.DonorName.Trim();
            donation.VillageArea = string.IsNullOrWhiteSpace(request.VillageArea)
                ? null
                : request.VillageArea.Trim();

            donation.Amount = request.Amount;
            donation.PaymentMode = request.PaymentMode;
            donation.ReceiverName = request.ReceiverName.Trim();
            donation.DonationDate = request.DonationDate;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Donation updated successfully.",
                data = donation
            });
        }

        // DELETE: api/donations/1 (Admin only)
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteDonation(int id)
        {
            var donation = await _context.Donations.FindAsync(id);

            if (donation == null)
            {
                return NotFound(new
                {
                    message = "Donation not found."
                });
            }

            _context.Donations.Remove(donation);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Donation deleted successfully."
            });
        }
    }
}
