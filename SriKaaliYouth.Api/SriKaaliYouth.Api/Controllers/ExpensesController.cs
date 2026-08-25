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
    [Route("api/expenses")]
    [Authorize]
    public class ExpensesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ExpensesController(AppDbContext context)
        {
            _context = context;
        }

        private int? GetCurrentUserId()
        {
            var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(claim, out var id) ? id : null;
        }

        // GET: api/expenses (Admin only)
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllExpenses()
        {
            var expenses = await _context.Expenses
                .OrderByDescending(x => x.ExpenseDate)
                .ThenByDescending(x => x.ExpenseId)
                .ToListAsync();

            return Ok(expenses);
        }

        // GET: api/expenses/5 (Admin or record creator)
        [HttpGet("{id:int}")]
        [Authorize(Roles = "Admin,Member")]
        public async Task<IActionResult> GetExpense(int id)
        {
            var expense = await _context.Expenses
                .FirstOrDefaultAsync(x => x.ExpenseId == id);

            if (expense == null)
            {
                return NotFound(new
                {
                    message = "Expense not found."
                });
            }

            if (!User.IsInRole("Admin"))
            {
                var userId = GetCurrentUserId();
                if (expense.CreatedBy != userId)
                {
                    return Forbid();
                }
            }

            return Ok(expense);
        }

        // GET: api/expenses/decoration (Admin only)
        [HttpGet("decoration")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetDecorationExpenses()
        {
            var expenses = await _context.Expenses
                .Where(x => x.ExpenseType == "Decoration")
                .OrderByDescending(x => x.ExpenseDate)
                .ToListAsync();

            return Ok(expenses);
        }

        // GET: api/expenses/aagaman (Admin only)
        [HttpGet("aagaman")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAagamanExpenses()
        {
            var expenses = await _context.Expenses
                .Where(x => x.ExpenseType == "Aagaman")
                .OrderByDescending(x => x.ExpenseDate)
                .ToListAsync();

            return Ok(expenses);
        }

        // GET: api/expenses/day/1 (Admin only)
        [HttpGet("day/{day}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetDayExpenses(int day)
        {
            if (day < 1 || day > 11)
            {
                return BadRequest(new
                {
                    message = "Festival day must be between 1 and 11."
                });
            }

            var expenses = await _context.Expenses
                .Where(x =>
                    x.ExpenseType == "DayWise" &&
                    x.FestivalDay == day)
                .OrderByDescending(x => x.ExpenseDate)
                .ToListAsync();

            return Ok(expenses);
        }

        // GET: api/expenses/last-day (Admin only)
        [HttpGet("last-day")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetLastDayExpenses()
        {
            var expenses = await _context.Expenses
                .Where(x => x.ExpenseType == "LastDay")
                .OrderByDescending(x => x.ExpenseDate)
                .ToListAsync();

            return Ok(expenses);
        }

        // POST: api/expenses (Admin + Member)
        [HttpPost]
        [Authorize(Roles = "Admin,Member")]
        public async Task<IActionResult> CreateExpense(ExpenseCreateDto request)
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

            var allowedTypes = new[]
            {
                "Decoration",
                "Aagaman",
                "DayWise",
                "LastDay"
            };

            if (!allowedTypes.Contains(request.ExpenseType))
            {
                return BadRequest(new
                {
                    message = "Invalid expense type."
                });
            }

            if (request.ExpenseType == "DayWise")
            {
                if (request.FestivalDay == null ||
                    request.FestivalDay < 1 ||
                    request.FestivalDay > 11)
                {
                    return BadRequest(new
                    {
                        message = "Festival day must be between 1 and 11."
                    });
                }
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

            if (request.CategoryId.HasValue)
            {
                var categoryExists = await _context.Categories
                    .AnyAsync(x => x.CategoryId == request.CategoryId.Value);

                if (!categoryExists)
                {
                    return BadRequest(new
                    {
                        message = "Category not found."
                    });
                }
            }

            var currentUserId = GetCurrentUserId();

            var expense = new Expense
            {
                FestivalId = request.FestivalId,
                CategoryId = request.CategoryId,
                ExpenseType = request.ExpenseType,
                FestivalDay = request.ExpenseType == "DayWise" ? request.FestivalDay : null,
                ItemName = request.ItemName.Trim(),
                Amount = request.Amount,
                PaymentMode = request.PaymentMode,
                ExpenseDate = request.ExpenseDate,
                CreatedBy = currentUserId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Expenses.Add(expense);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Expense created successfully.",
                data = expense
            });
        }

        // PUT: api/expenses/5 (Admin or record creator)
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Member")]
        public async Task<IActionResult> UpdateExpense(
            int id,
            Expense request)
        {
            var expense = await _context.Expenses.FindAsync(id);

            if (expense == null)
            {
                return NotFound(new
                {
                    message = "Expense not found."
                });
            }

            if (!User.IsInRole("Admin"))
            {
                var userId = GetCurrentUserId();
                if (expense.CreatedBy != userId)
                {
                    return Forbid();
                }
            }

            if (string.IsNullOrWhiteSpace(request.ItemName))
            {
                return BadRequest(new
                {
                    message = "Item name is required."
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

            var allowedTypes = new[]
            {
                "Decoration",
                "Aagaman",
                "DayWise",
                "LastDay"
            };

            if (!allowedTypes.Contains(request.ExpenseType))
            {
                return BadRequest(new
                {
                    message = "Invalid expense type."
                });
            }

            if (request.ExpenseType == "DayWise")
            {
                if (request.FestivalDay == null ||
                    request.FestivalDay < 1 ||
                    request.FestivalDay > 11)
                {
                    return BadRequest(new
                    {
                        message = "Festival day must be between 1 and 11."
                    });
                }
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

            if (request.CategoryId.HasValue)
            {
                var categoryExists = await _context.Categories
                    .AnyAsync(x => x.CategoryId == request.CategoryId.Value);

                if (!categoryExists)
                {
                    return BadRequest(new
                    {
                        message = "Category not found."
                    });
                }
            }

            expense.FestivalId = request.FestivalId;
            expense.CategoryId = request.CategoryId;
            expense.ExpenseType = request.ExpenseType;
            expense.FestivalDay = request.ExpenseType == "DayWise" ? request.FestivalDay : null;
            expense.ItemName = request.ItemName.Trim();
            expense.Amount = request.Amount;
            expense.PaymentMode = request.PaymentMode;
            expense.ExpenseDate = request.ExpenseDate;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Expense updated successfully.",
                data = expense
            });
        }

        // DELETE: api/expenses/5 (Admin only)
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteExpense(int id)
        {
            var expense = await _context.Expenses.FindAsync(id);

            if (expense == null)
            {
                return NotFound(new
                {
                    message = "Expense not found."
                });
            }

            _context.Expenses.Remove(expense);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Expense deleted successfully."
            });
        }
    }
}
