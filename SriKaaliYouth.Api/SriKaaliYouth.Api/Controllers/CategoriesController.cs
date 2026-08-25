using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SriKaaliYouth.Api.Data;
using SriKaaliYouth.Api.DTOs;
using SriKaaliYouth.Api.Models;

namespace SriKaaliYouth.Api.Controllers
{
    [ApiController]
    [Route("api/categories")]
    [Authorize(Roles = "Admin,Member")]
    public class CategoriesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CategoriesController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/categories
        [HttpGet]
        public async Task<IActionResult> GetCategories()
        {
            var categories = await _context.Categories
                .OrderBy(x => x.CategoryId)
                .ToListAsync();

            return Ok(categories);
        }

        // GET: api/categories/1
        [HttpGet("{id}")]
        public async Task<IActionResult> GetCategory(int id)
        {
            var category = await _context.Categories
                .FirstOrDefaultAsync(x => x.CategoryId == id);

            if (category == null)
            {
                return NotFound(new
                {
                    message = "Category not found."
                });
            }

            return Ok(category);
        }

        // POST: api/categories
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateCategory(CategoryCreateDto request)
        {
            if (string.IsNullOrWhiteSpace(request.CategoryName))
            {
                return BadRequest(new
                {
                    message = "Category name is required."
                });
            }

            var categoryName = request.CategoryName.Trim();

            var exists = await _context.Categories
                .AnyAsync(x =>
                    x.CategoryName.ToLower() ==
                    categoryName.ToLower());

            if (exists)
            {
                return BadRequest(new
                {
                    message = "Category already exists."
                });
            }

            var category = new Category
            {
                CategoryName = categoryName,
                Icon = request.Icon,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Categories.Add(category);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Category created successfully.",
                data = category
            });
        }

        // PUT: api/categories/1
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateCategory(
    int id,
    CategoryUpdateDto request)
        {
            var category = await _context.Categories.FindAsync(id);

            if (category == null)
            {
                return NotFound(new
                {
                    message = "Category not found."
                });
            }

            if (string.IsNullOrWhiteSpace(request.CategoryName))
            {
                return BadRequest(new
                {
                    message = "Category name is required."
                });
            }

            var categoryName = request.CategoryName.Trim();

            var duplicate = await _context.Categories
                .AnyAsync(x =>
                    x.CategoryId != id &&
                    x.CategoryName.ToLower() ==
                    categoryName.ToLower());

            if (duplicate)
            {
                return BadRequest(new
                {
                    message = "Another category with this name already exists."
                });
            }

            category.CategoryName = categoryName;
            category.Icon = request.Icon;
            category.IsActive = request.IsActive;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Category updated successfully.",
                data = category
            });
        }

        // DELETE: api/categories/1
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            var category = await _context.Categories.FindAsync(id);

            if (category == null)
            {
                return NotFound(new
                {
                    message = "Category not found."
                });
            }

            var usedInExpenses = await _context.Expenses
                .AnyAsync(x => x.CategoryId == id);

            if (usedInExpenses)
            {
                return BadRequest(new
                {
                    message = "This category is already used in expenses and cannot be deleted."
                });
            }

            _context.Categories.Remove(category);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Category deleted successfully."
            });
        }
    }
}