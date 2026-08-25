using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SriKaaliYouth.Api.Models
{
    [Table("donations")]
    public class Donation
    {
        [Key]
        [Column("donation_id")]
        public int DonationId { get; set; }

        [Column("festival_id")]
        public int FestivalId { get; set; }

        [Column("donor_name")]
        public string DonorName { get; set; } = string.Empty;

        [Column("village_area")]
        public string? VillageArea { get; set; }

        [Column("amount")]
        public decimal Amount { get; set; }

        [Column("payment_mode")]
        public string PaymentMode { get; set; } = string.Empty;

        [Column("receiver_name")]
        public string ReceiverName { get; set; } = string.Empty;

        [Column("donation_date", TypeName = "date")]
        public DateTime DonationDate { get; set; }

        [Column("created_by")]
        public int? CreatedBy { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }
    }
}
