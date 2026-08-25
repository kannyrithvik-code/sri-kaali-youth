using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SriKaaliYouth.Api.Models
{
    [Table("sponsors")]
    public class Sponsor
    {
        [Key]
        [Column("sponsor_id")]
        public int SponsorId { get; set; }

        [Column("festival_id")]
        public int FestivalId { get; set; }

        [Column("sponsor_name")]
        public string SponsorName { get; set; } = string.Empty;

        [Column("village_area")]
        public string? VillageArea { get; set; }

        [Column("contribution")]
        public string Contribution { get; set; } = string.Empty;

        [Column("created_by")]
        public int? CreatedBy { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }
    }
}