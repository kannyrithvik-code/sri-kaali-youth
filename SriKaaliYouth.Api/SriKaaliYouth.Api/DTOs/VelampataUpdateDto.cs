namespace SriKaaliYouth.Api.DTOs
{
    public class VelampataUpdateDto
    {
        public int FestivalId { get; set; }

        public string ItemName { get; set; } = string.Empty;

        public string PersonName { get; set; } = string.Empty;

        public decimal Amount { get; set; }

        public string PaymentMode { get; set; } = string.Empty;

        public string ReceiverName { get; set; } = string.Empty;

        public DateTime EntryDate { get; set; }
    }
}