namespace SriKaaliYouth.Api.DTOs
{
    public class SponsorCreateDto
    {
        public int FestivalId { get; set; }

        public string SponsorName { get; set; } = string.Empty;

        public string? VillageArea { get; set; }

        public string Contribution { get; set; } = string.Empty;
    }
}