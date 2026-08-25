using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SriKaaliYouth.Api.Models
{
    [Table("festival_events")]
    public class FestivalEvent
    {
        [Key]
        [Column("festival_id")]
        public int FestivalId { get; set; }

        [Column("festival_name")]
        public string FestivalName { get; set; } = string.Empty;

        [Column("year")]
        public int Year { get; set; }

        [Column("start_date", TypeName = "date")]
        public DateTime StartDate { get; set; }

        [Column("end_date", TypeName = "date")]
        public DateTime EndDate { get; set; }

        [Column("is_active")]
        public bool IsActive { get; set; } = true;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }
    }
}