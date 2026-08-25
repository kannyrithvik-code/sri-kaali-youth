namespace SriKaaliYouth.Api.DTOs
{
    public class ExpenseCreateDto
    {
        public int FestivalId { get; set; }

        public int? CategoryId { get; set; }

        public string ExpenseType { get; set; } = string.Empty;

        public int? FestivalDay { get; set; }

        public string ItemName { get; set; } = string.Empty;

        public decimal Amount { get; set; }

        public string PaymentMode { get; set; } = string.Empty;

        public DateTime ExpenseDate { get; set; }
    }
}