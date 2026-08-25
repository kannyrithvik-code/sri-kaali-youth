namespace SriKaaliYouth.Api.DTOs
{
    public class LuckyDrawUpdateDto
    {
        public int FestivalId { get; set; }

        public string TicketNumber { get; set; } = string.Empty;

        public string PersonName { get; set; } = string.Empty;

        public string? MobileNumber { get; set; }

        public decimal Amount { get; set; }

        public string PaymentMode { get; set; } = string.Empty;

        public string ReceiverName { get; set; } = string.Empty;

        public DateTime EntryDate { get; set; }
    }
}