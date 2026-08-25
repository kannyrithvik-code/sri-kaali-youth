namespace SriKaaliYouth.Api.DTOs
{
    public class DonationCreateDto
    {
        public int FestivalId { get; set; }

        public string DonorName { get; set; } = string.Empty;

        public string? VillageArea { get; set; }

        public decimal Amount { get; set; }

        public string PaymentMode { get; set; } = string.Empty;

        public string ReceiverName { get; set; } = string.Empty;

        public DateTime DonationDate { get; set; }
    }
}