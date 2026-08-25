using Microsoft.EntityFrameworkCore;
using SriKaaliYouth.Api.Models;

namespace SriKaaliYouth.Api.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users => Set<User>();
        public DbSet<MemberLoginRequest> MemberLoginRequests => Set<MemberLoginRequest>();
        public DbSet<FestivalEvent> FestivalEvents => Set<FestivalEvent>();
        public DbSet<Category> Categories => Set<Category>();
        public DbSet<Expense> Expenses => Set<Expense>();
        public DbSet<Donation> Donations => Set<Donation>();
        public DbSet<LuckyDrawEntry> LuckyDrawEntries => Set<LuckyDrawEntry>();
        public DbSet<VelampataEntry> VelampataEntries => Set<VelampataEntry>();
        public DbSet<Sponsor> Sponsors => Set<Sponsor>();
    }
}