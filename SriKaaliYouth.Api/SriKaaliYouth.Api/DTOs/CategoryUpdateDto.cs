namespace SriKaaliYouth.Api.DTOs
{
    public class CategoryUpdateDto
    {
        public string CategoryName { get; set; } = string.Empty;
        public string? Icon { get; set; }
        public bool IsActive { get; set; }
    }
}