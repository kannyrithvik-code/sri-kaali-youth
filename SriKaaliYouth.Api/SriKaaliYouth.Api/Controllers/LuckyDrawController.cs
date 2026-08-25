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
    [Route("api/lucky-draw")]
    [Authorize]
    public class LuckyDrawController : ControllerBase
    {
        private readonly AppDbContext _context;

        public LuckyDrawController(AppDbContext context)
        {
            _context = context;
        }

        private int? GetCurrentUserId()
        {
            var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(claim, out var id) ? id : null;
        }

        // GET: api/lucky-draw (Admin only)
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAll()
        {
            var entries = await _context.LuckyDrawEntries
                .OrderByDescending(x => x.EntryDate)
                .ThenByDescending(x => x.LuckyDrawId)
                .ToListAsync();

            return Ok(entries);
        }

        // GET: api/lucky-draw/1 (Admin or record creator)
        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,Member")]
        public async Task<IActionResult> GetById(int id)
        {
            var entry = await _context.LuckyDrawEntries
                .FirstOrDefaultAsync(x => x.LuckyDrawId == id);

            if (entry == null)
            {
                return NotFound(new
                {
                    message = "Lucky draw entry not found."
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

        // POST: api/lucky-draw (Admin + Member)
        [HttpPost]
        [Authorize(Roles = "Admin,Member")]
        public async Task<IActionResult> Create(LuckyDrawCreateDto request)
        {
            if (request.FestivalId <= 0)
            {
                return BadRequest(new
                {
                    message = "Festival is required."
                });
            }

            if (string.IsNullOrWhiteSpace(request.TicketNumber))
            {
                return BadRequest(new
                {
                    message = "Ticket number is required."
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

            var ticketNumber = request.TicketNumber.Trim();

            var duplicateTicket = await _context.LuckyDrawEntries
                .AnyAsync(x =>
                    x.FestivalId == request.FestivalId &&
                    x.TicketNumber.ToLower() == ticketNumber.ToLower());

            if (duplicateTicket)
            {
                return BadRequest(new
                {
                    message = "This ticket number already exists for the selected festival."
                });
            }

            var currentUserId = GetCurrentUserId();

            var entry = new LuckyDrawEntry
            {
                FestivalId = request.FestivalId,
                TicketNumber = ticketNumber,
                PersonName = request.PersonName.Trim(),
                MobileNumber = string.IsNullOrWhiteSpace(request.MobileNumber)
                    ? null
                    : request.MobileNumber.Trim(),
                Amount = request.Amount,
                PaymentMode = request.PaymentMode,
                ReceiverName = request.ReceiverName.Trim(),
                EntryDate = request.EntryDate,
                CreatedBy = currentUserId,
                CreatedAt = DateTime.UtcNow
            };

            _context.LuckyDrawEntries.Add(entry);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Lucky draw entry created successfully.",
                data = entry
            });
        }

        // PUT: api/lucky-draw/1 (Admin or record creator)
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Member")]
        public async Task<IActionResult> Update(
            int id,
            LuckyDrawUpdateDto request)
        {
            var entry = await _context.LuckyDrawEntries.FindAsync(id);

            if (entry == null)
            {
                return NotFound(new
                {
                    message = "Lucky draw entry not found."
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

            if (string.IsNullOrWhiteSpace(request.TicketNumber))
            {
                return BadRequest(new
                {
                    message = "Ticket number is required."
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

            var duplicateTicket = await _context.LuckyDrawEntries
                .AnyAsync(x =>
                    x.LuckyDrawId != id &&
                    x.FestivalId == request.FestivalId &&
                    x.TicketNumber.ToLower() == request.TicketNumber.Trim().ToLower());

            if (duplicateTicket)
            {
                return BadRequest(new
                {
                    message = "This ticket number already exists for the selected festival."
                });
            }

            entry.FestivalId = request.FestivalId;
            entry.TicketNumber = request.TicketNumber.Trim();
            entry.PersonName = request.PersonName.Trim();
            entry.MobileNumber = string.IsNullOrWhiteSpace(request.MobileNumber)
                ? null
                : request.MobileNumber.Trim();

            entry.Amount = request.Amount;
            entry.PaymentMode = request.PaymentMode;
            entry.ReceiverName = request.ReceiverName.Trim();
            entry.EntryDate = request.EntryDate;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Lucky draw entry updated successfully.",
                data = entry
            });
        }

        // DELETE: api/lucky-draw/1 (Admin only)
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var entry = await _context.LuckyDrawEntries.FindAsync(id);

            if (entry == null)
            {
                return NotFound(new
                {
                    message = "Lucky draw entry not found."
                });
            }

            _context.LuckyDrawEntries.Remove(entry);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Lucky draw entry deleted successfully."
            });
        }
    }
}