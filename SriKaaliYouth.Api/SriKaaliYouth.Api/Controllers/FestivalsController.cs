using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SriKaaliYouth.Api.Data;
using SriKaaliYouth.Api.Models;

namespace SriKaaliYouth.Api.Controllers
{
    [ApiController]
    [Route("api/festivals")]
    [Authorize(Roles = "Admin,Member")]
    public class FestivalsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public FestivalsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var festivals = await _context.FestivalEvents
                .OrderByDescending(x => x.Year)
                .ToListAsync();

            return Ok(festivals);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var festival = await _context.FestivalEvents.FindAsync(id);

            if (festival == null)
            {
                return NotFound(new
                {
                    message = "Festival not found."
                });
            }

            return Ok(festival);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create(FestivalEvent festival)
        {
            if (string.IsNullOrWhiteSpace(festival.FestivalName))
            {
                return BadRequest(new
                {
                    message = "Festival name is required."
                });
            }

            if (festival.EndDate < festival.StartDate)
            {
                return BadRequest(new
                {
                    message = "End date cannot be before start date."
                });
            }

            var duplicate = await _context.FestivalEvents
                .AnyAsync(x =>
                    x.FestivalName.ToLower() ==
                    festival.FestivalName.Trim().ToLower() &&
                    x.Year == festival.Year);

            if (duplicate)
            {
                return BadRequest(new
                {
                    message = "Festival already exists for this year."
                });
            }

            festival.FestivalName = festival.FestivalName.Trim();
            festival.IsActive = true;
            festival.CreatedAt = DateTime.UtcNow;

            _context.FestivalEvents.Add(festival);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Festival created successfully.",
                data = festival
            });
        }
    }
}