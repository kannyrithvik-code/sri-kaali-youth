using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SriKaaliYouth.Api.Data;
using Microsoft.AspNetCore.Authorization;

namespace SriKaaliYouth.Api.Controllers
{
    [ApiController]
    [Route("api/reports")]
    [Authorize(Roles = "Admin")]
    public class ReportsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ReportsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/reports/day-wise-expenses?festivalId=1
        [HttpGet("day-wise-expenses")]
        public async Task<IActionResult> GetDayWiseExpenses(int festivalId)
        {
            var festivalExists = await _context.FestivalEvents
                .AnyAsync(x => x.FestivalId == festivalId);

            if (!festivalExists)
            {
                return BadRequest(new
                {
                    message = "Festival not found."
                });
            }

            var data = await _context.Expenses
                .Where(x =>
                    x.FestivalId == festivalId &&
                    x.ExpenseType == "DayWise" &&
                    x.FestivalDay != null)
                .GroupBy(x => x.FestivalDay)
                .Select(group => new
                {
                    day = group.Key,
                    totalAmount = group.Sum(x => x.Amount),
                    totalEntries = group.Count()
                })
                .OrderBy(x => x.day)
                .ToListAsync();

            return Ok(data);
        }

        // GET: api/reports/category-wise-expenses?festivalId=1
        [HttpGet("category-wise-expenses")]
        public async Task<IActionResult> GetCategoryWiseExpenses(int festivalId)
        {
            var data = await (
                from expense in _context.Expenses
                join category in _context.Categories
                    on expense.CategoryId equals category.CategoryId
                where expense.FestivalId == festivalId
                group expense by new
                {
                    category.CategoryId,
                    category.CategoryName
                }
                into groupData
                select new
                {
                    categoryId = groupData.Key.CategoryId,
                    categoryName = groupData.Key.CategoryName,
                    totalAmount = groupData.Sum(x => x.Amount),
                    totalEntries = groupData.Count()
                }
            )
            .OrderByDescending(x => x.totalAmount)
            .ToListAsync();

            return Ok(data);
        }

        // GET: api/reports/donations?festivalId=1
        [HttpGet("donations")]
        public async Task<IActionResult> GetDonationsReport(int festivalId)
        {
            var data = await _context.Donations
                .Where(x => x.FestivalId == festivalId)
                .OrderByDescending(x => x.DonationDate)
                .ThenByDescending(x => x.DonationId)
                .ToListAsync();

            var totalAmount = data.Sum(x => x.Amount);

            return Ok(new
            {
                totalAmount,
                totalEntries = data.Count,
                data
            });
        }

        // GET: api/reports/lucky-draw?festivalId=1
        [HttpGet("lucky-draw")]
        public async Task<IActionResult> GetLuckyDrawReport(int festivalId)
        {
            var data = await _context.LuckyDrawEntries
                .Where(x => x.FestivalId == festivalId)
                .OrderByDescending(x => x.EntryDate)
                .ThenByDescending(x => x.LuckyDrawId)
                .ToListAsync();

            var totalAmount = data.Sum(x => x.Amount);

            return Ok(new
            {
                totalAmount,
                totalEntries = data.Count,
                data
            });
        }

        // GET: api/reports/velampata?festivalId=1
        [HttpGet("velampata")]
        public async Task<IActionResult> GetVelampataReport(int festivalId)
        {
            var data = await _context.VelampataEntries
                .Where(x => x.FestivalId == festivalId)
                .OrderByDescending(x => x.EntryDate)
                .ThenByDescending(x => x.VelampataId)
                .ToListAsync();

            var totalAmount = data.Sum(x => x.Amount);

            return Ok(new
            {
                totalAmount,
                totalEntries = data.Count,
                data
            });
        }

        // GET: api/reports/sponsors?festivalId=1
        [HttpGet("sponsors")]
        public async Task<IActionResult> GetSponsorsReport(int festivalId)
        {
            var data = await _context.Sponsors
                .Where(x => x.FestivalId == festivalId)
                .OrderByDescending(x => x.SponsorId)
                .ToListAsync();

            return Ok(new
            {
                totalEntries = data.Count,
                data
            });
        }

        // GET: api/reports/final?festivalId=1
        [HttpGet("final")]
        public async Task<IActionResult> GetFinalFestivalReport(int festivalId)
        {
            var festival = await _context.FestivalEvents
                .FirstOrDefaultAsync(x => x.FestivalId == festivalId);

            if (festival == null)
            {
                return BadRequest(new
                {
                    message = "Festival not found."
                });
            }

            var totalDonations = await _context.Donations
                .Where(x => x.FestivalId == festivalId)
                .SumAsync(x => (decimal?)x.Amount) ?? 0;

            var totalLuckyDraw = await _context.LuckyDrawEntries
                .Where(x => x.FestivalId == festivalId)
                .SumAsync(x => (decimal?)x.Amount) ?? 0;

            var totalVelampata = await _context.VelampataEntries
                .Where(x => x.FestivalId == festivalId)
                .SumAsync(x => (decimal?)x.Amount) ?? 0;

            var totalIncome =
                totalDonations +
                totalLuckyDraw +
                totalVelampata;

            var totalExpenses = await _context.Expenses
                .Where(x => x.FestivalId == festivalId)
                .SumAsync(x => (decimal?)x.Amount) ?? 0;

            var remainingBalance =
                totalIncome - totalExpenses;

            var dayWiseExpenses = await _context.Expenses
                .Where(x =>
                    x.FestivalId == festivalId &&
                    x.ExpenseType == "DayWise" &&
                    x.FestivalDay != null)
                .GroupBy(x => x.FestivalDay)
                .Select(group => new
                {
                    day = group.Key,
                    totalAmount = group.Sum(x => x.Amount)
                })
                .OrderBy(x => x.day)
                .ToListAsync();

            var categoryWiseExpenses = await (
                from expense in _context.Expenses
                join category in _context.Categories
                    on expense.CategoryId equals category.CategoryId
                where expense.FestivalId == festivalId
                group expense by new
                {
                    category.CategoryId,
                    category.CategoryName
                }
                into groupData
                select new
                {
                    categoryId = groupData.Key.CategoryId,
                    categoryName = groupData.Key.CategoryName,
                    totalAmount = groupData.Sum(x => x.Amount)
                }
            )
            .OrderByDescending(x => x.totalAmount)
            .ToListAsync();

            var sponsors = await _context.Sponsors
                .Where(x => x.FestivalId == festivalId)
                .Select(x => new
                {
                    x.SponsorId,
                    x.SponsorName,
                    x.VillageArea,
                    x.Contribution
                })
                .ToListAsync();

            return Ok(new
            {
                festival = new
                {
                    festival.FestivalId,
                    festival.FestivalName,
                    festival.Year,
                    festival.StartDate,
                    festival.EndDate
                },

                financialSummary = new
                {
                    totalDonations,
                    totalLuckyDraw,
                    totalVelampata,
                    totalIncome,
                    totalExpenses,
                    remainingBalance
                },

                dayWiseExpenses,
                categoryWiseExpenses,

                sponsors = new
                {
                    totalSponsors = sponsors.Count,
                    data = sponsors
                }
            });
        }
    }
}