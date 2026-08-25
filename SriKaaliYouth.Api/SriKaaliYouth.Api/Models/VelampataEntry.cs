using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SriKaaliYouth.Api.Models
{
    [Table("velampata_entries")]
    public class VelampataEntry
    {
        [Key]
        [Column("velampata_id")]
        public int VelampataId { get; set; }

        [Column("festival_id")]
        public int FestivalId { get; set; }

        [Column("item_name")]
        public string ItemName { get; set; } = string.Empty;

        [Column("person_name")]
        public string PersonName { get; set; } = string.Empty;

        [Column("amount")]
        public decimal Amount { get; set; }

        [Column("payment_mode")]
        public string PaymentMode { get; set; } = string.Empty;

        [Column("receiver_name")]
        public string ReceiverName { get; set; } = string.Empty;

        [Column("entry_date", TypeName = "date")]
        public DateTime EntryDate { get; set; }

        [Column("created_by")]
        public int? CreatedBy { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }
    }
}