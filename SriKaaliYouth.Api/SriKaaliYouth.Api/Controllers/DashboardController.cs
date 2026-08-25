using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SriKaaliYouth.Api.Data;
using Microsoft.AspNetCore.Authorization;

namespace SriKaaliYouth.Api.Controllers
{
    [ApiController]
    [Route("api/dashboard")]
    [Authorize(Roles = "Admin")]
    public class DashboardController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DashboardController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/dashboard?festivalId=1
        [HttpGet]
        public async Task<IActionResult> GetDashboard(int festivalId)
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

            var today = DateTime.Today;

            // -------------------------------------------------
            // TOTAL INCOME
            // -------------------------------------------------

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


            // -------------------------------------------------
            // TOTAL EXPENSES
            // -------------------------------------------------

            var totalExpenses = await _context.Expenses
                .Where(x => x.FestivalId == festivalId)
                .SumAsync(x => (decimal?)x.Amount) ?? 0;


            // -------------------------------------------------
            // REMAINING BALANCE
            // -------------------------------------------------

            var remainingBalance =
                totalIncome - totalExpenses;


            // -------------------------------------------------
            // TODAY'S INCOME
            // -------------------------------------------------

            var todayDonations = await _context.Donations
                .Where(x =>
                    x.FestivalId == festivalId &&
                    x.DonationDate.Date == today)
                .SumAsync(x => (decimal?)x.Amount) ?? 0;

            var todayLuckyDraw = await _context.LuckyDrawEntries
                .Where(x =>
                    x.FestivalId == festivalId &&
                    x.EntryDate.Date == today)
                .SumAsync(x => (decimal?)x.Amount) ?? 0;

            var todayVelampata = await _context.VelampataEntries
                .Where(x =>
                    x.FestivalId == festivalId &&
                    x.EntryDate.Date == today)
                .SumAsync(x => (decimal?)x.Amount) ?? 0;

            var todayIncome =
                todayDonations +
                todayLuckyDraw +
                todayVelampata;


            // -------------------------------------------------
            // TODAY'S EXPENSES
            // -------------------------------------------------

            var todayExpenses = await _context.Expenses
                .Where(x =>
                    x.FestivalId == festivalId &&
                    x.ExpenseDate.Date == today)
                .SumAsync(x => (decimal?)x.Amount) ?? 0;


            // -------------------------------------------------
            // TODAY'S BALANCE
            // -------------------------------------------------

            var todayBalance =
                todayIncome - todayExpenses;


            // -------------------------------------------------
            // PAYMENT MODE - INCOME
            // -------------------------------------------------

            var donationCash = await _context.Donations
                .Where(x =>
                    x.FestivalId == festivalId &&
                    x.PaymentMode == "Cash")
                .SumAsync(x => (decimal?)x.Amount) ?? 0;

            var luckyDrawCash = await _context.LuckyDrawEntries
                .Where(x =>
                    x.FestivalId == festivalId &&
                    x.PaymentMode == "Cash")
                .SumAsync(x => (decimal?)x.Amount) ?? 0;

            var velampataCash = await _context.VelampataEntries
                .Where(x =>
                    x.FestivalId == festivalId &&
                    x.PaymentMode == "Cash")
                .SumAsync(x => (decimal?)x.Amount) ?? 0;

            var totalCashIncome =
                donationCash +
                luckyDrawCash +
                velampataCash;


            var donationOnline = await _context.Donations
                .Where(x =>
                    x.FestivalId == festivalId &&
                    x.PaymentMode == "Online")
                .SumAsync(x => (decimal?)x.Amount) ?? 0;

            var luckyDrawOnline = await _context.LuckyDrawEntries
                .Where(x =>
                    x.FestivalId == festivalId &&
                    x.PaymentMode == "Online")
                .SumAsync(x => (decimal?)x.Amount) ?? 0;

            var velampataOnline = await _context.VelampataEntries
                .Where(x =>
                    x.FestivalId == festivalId &&
                    x.PaymentMode == "Online")
                .SumAsync(x => (decimal?)x.Amount) ?? 0;

            var totalOnlineIncome =
                donationOnline +
                luckyDrawOnline +
                velampataOnline;


            // -------------------------------------------------
            // PAYMENT MODE - EXPENSES
            // -------------------------------------------------

            var cashExpenses = await _context.Expenses
                .Where(x =>
                    x.FestivalId == festivalId &&
                    x.PaymentMode == "Cash")
                .SumAsync(x => (decimal?)x.Amount) ?? 0;

            var onlineExpenses = await _context.Expenses
                .Where(x =>
                    x.FestivalId == festivalId &&
                    x.PaymentMode == "Online")
                .SumAsync(x => (decimal?)x.Amount) ?? 0;


            // -------------------------------------------------
            // EXPENSES BY CATEGORY
            // -------------------------------------------------

            var expensesByCategory = await (
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
                    amount = groupData.Sum(x => x.Amount)
                }
            )
            .OrderByDescending(x => x.amount)
            .ToListAsync();


            // -------------------------------------------------
            // DAY-WISE EXPENSES
            // -------------------------------------------------

            var dayWiseExpenses = await _context.Expenses
                .Where(x =>
                    x.FestivalId == festivalId &&
                    x.ExpenseType == "DayWise" &&
                    x.FestivalDay != null)
                .GroupBy(x => x.FestivalDay)
                .Select(x => new
                {
                    day = x.Key,
                    amount = x.Sum(y => y.Amount)
                })
                .OrderBy(x => x.day)
                .ToListAsync();


            // -------------------------------------------------
            // FINAL RESPONSE
            // -------------------------------------------------

            return Ok(new
            {
                financialSummary = new
                {
                    totalIncome,
                    totalExpenses,
                    remainingBalance,

                    todayIncome,
                    todayExpenses,
                    todayBalance
                },

                incomeBreakdown = new
                {
                    donations = totalDonations,
                    luckyDraw = totalLuckyDraw,
                    velampata = totalVelampata
                },

                incomePaymentMode = new
                {
                    cash = totalCashIncome,
                    online = totalOnlineIncome
                },

                expensePaymentMode = new
                {
                    cash = cashExpenses,
                    online = onlineExpenses
                },

                expensesByCategory,

                dayWiseExpenses
            });
        }
    }
}