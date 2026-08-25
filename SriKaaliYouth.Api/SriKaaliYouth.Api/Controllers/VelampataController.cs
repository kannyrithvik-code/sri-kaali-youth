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
    [Route("api/velampata")]
    [Authorize]
    public class VelampataController : ControllerBase
    {
        private readonly AppDbContext _context;

        public VelampataController(AppDbContext context)
        {
            _context = context;
        }

        private int? GetCurrentUserId()
        {
            var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(claim, out var id) ? id : null;
        }

        // GET: api/velampata (Admin only)
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAll()
        {
            var entries = await _context.VelampataEntries
                .OrderByDescending(x => x.EntryDate)
                .ThenByDescending(x => x.VelampataId)
                .ToListAsync();

            return Ok(entries);
        }

        // GET: api/velampata/1 (Admin or record creator)
        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,Member")]
        public async Task<IActionResult> GetById(int id)
        {
            var entry = await _context.VelampataEntries
                .FirstOrDefaultAsync(x => x.VelampataId == id);

            if (entry == null)
            {
                return NotFound(new
                {
                    message = "Velampata entry not found."
                });
            }

            if (!User.IsInRole("Admin"))
            {
                var userId = GetCurrentUserId();
                if (entry.CreatedBy != userId)
                {
                    return Forbid();
                }
            }

            return Ok(entry);
        }

        // POST: api/velampata (Admin + Member)
        [HttpPost]
        [Authorize(Roles = "Admin,Member")]
        public async Task<IActionResult> Create(VelampataCreateDto request)
        {
            if (request.FestivalId <= 0)
            {
                return BadRequest(new
                {
                    message = "Festival is required."
                });
            }

            if (string.IsNullOrWhiteSpace(request.ItemName))
            {
                return BadRequest(new
                {
                    message = "Item name is required."
                });
            }

            if (string.IsNullOrWhiteSpace(request.PersonName))
            {
                return BadRequest(new
                {
                    message = "Person name is required."
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

            var entry = new VelampataEntry
            {
                FestivalId = request.FestivalId,
                ItemName = request.ItemName.Trim(),
                PersonName = request.PersonName.Trim(),
                Amount = request.Amount,
                PaymentMode = request.PaymentMode,
                ReceiverName = request.ReceiverName.Trim(),
                EntryDate = request.EntryDate,
                CreatedBy = currentUserId,
                CreatedAt = DateTime.UtcNow
            };

            _context.VelampataEntries.Add(entry);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Velampata entry created successfully.",
                data = entry
            });
        }

        // PUT: api/velampata/1 (Admin or record creator)
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Member")]
        public async Task<IActionResult> Update(
            int id,
            VelampataUpdateDto request)
        {
            var entry = await _context.VelampataEntries.FindAsync(id);

            if (entry == null)
            {
                return NotFound(new
                {
                    message = "Velampata entry not found."
                });
            }

            if (!User.IsInRole("Admin"))
            {
                var userId = GetCurrentUserId();
                if (entry.CreatedBy != userId)
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

            if (string.IsNullOrWhiteSpace(request.ItemName))
            {
                return BadRequest(new
                {
                    message = "Item name is required."
                });
            }

            if (string.IsNullOrWhiteSpace(request.PersonName))
            {
                return BadRequest(new
                {
                    message = "Person name is required."
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

            entry.FestivalId = request.FestivalId;
            entry.ItemName = request.ItemName.Trim();
            entry.PersonName = request.PersonName.Trim();
            entry.Amount = request.Amount;
            entry.PaymentMode = request.PaymentMode;
            entry.ReceiverName = request.ReceiverName.Trim();
            entry.EntryDate = request.EntryDate;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Velampata entry updated successfully.",
                data = entry
            });
        }

        // DELETE: api/velampata/1 (Admin only)
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var entry = await _context.VelampataEntries.FindAsync(id);

            if (entry == null)
            {
                return NotFound(new
                {
                    message = "Velampata entry not found."
                });
            }

            _context.VelampataEntries.Remove(entry);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Velampata entry deleted successfully."
            });
        }
    }
}