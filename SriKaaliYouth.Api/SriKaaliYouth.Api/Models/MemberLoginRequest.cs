using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SriKaaliYouth.Api.Models
{
    [Table("member_login_requests")]
    public class MemberLoginRequest
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("user_id")]
        public int UserId { get; set; }

        [ForeignKey(nameof(UserId))]
        public User? User { get; set; }

        [Column("request_token")]
        public string RequestToken { get; set; } = string.Empty;

        [Column("requested_at")]
        public DateTime RequestedAt { get; set; }

        [Column("status")]
        public string Status { get; set; } = "Pending";

        [Column("approved_by_user_id")]
        public int? ApprovedByUserId { get; set; }

        [ForeignKey(nameof(ApprovedByUserId))]
        public User? ApprovedByUser { get; set; }

        [Column("approved_at")]
        public DateTime? ApprovedAt { get; set; }

        [Column("rejected_at")]
        public DateTime? RejectedAt { get; set; }

        [Column("expires_at")]
        public DateTime ExpiresAt { get; set; }

        [Column("consumed_at")]
        public DateTime? ConsumedAt { get; set; }
    }
}
