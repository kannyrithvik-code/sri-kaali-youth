using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SriKaaliYouth.Api.Models
{
    [Table("lucky_draw_entries")]
    public class LuckyDrawEntry
    {
        [Key]
        [Column("lucky_draw_id")]
        public int LuckyDrawId { get; set; }

        [Column("festival_id")]
        public int FestivalId { get; set; }

        [Column("ticket_number")]
        public string TicketNumber { get; set; } = string.Empty;

        [Column("person_name")]
        public string PersonName { get; set; } = string.Empty;

        [Column("mobile_number")]
        public string? MobileNumber { get; set; }

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