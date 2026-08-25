using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SriKaaliYouth.Api.Models
{
    [Table("expenses")]
    public class Expense
    {
        [Key]
        [Column("expense_id")]
        public int ExpenseId { get; set; }

        [Column("festival_id")]
        public int FestivalId { get; set; }

        [Column("category_id")]
        public int? CategoryId { get; set; }

        [Column("expense_type")]
        public string ExpenseType { get; set; } = string.Empty;

        [Column("festival_day")]
        public int? FestivalDay { get; set; }

        [Column("item_name")]
        public string ItemName { get; set; } = string.Empty;

        [Column("amount")]
        public decimal Amount { get; set; }

        [Column("payment_mode")]
        public string PaymentMode { get; set; } = string.Empty;

        [Column("expense_date", TypeName = "date")]
        public DateTime ExpenseDate { get; set; }

        [Column("created_by")]
        public int? CreatedBy { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }
    }
}