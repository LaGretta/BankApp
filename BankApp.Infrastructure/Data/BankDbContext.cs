using BankApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace BankApp.Infrastructure.Data;

public class BankDbContext : DbContext
{
    public BankDbContext(DbContextOptions<BankDbContext> options)  : base(options) {}
    
    public DbSet<User> Users { get; set; }
    public DbSet<Account> Accounts { get; set; }
    public DbSet<Transaction> Transactions { get; set; }
    public DbSet<Card> Cards { get; set; }
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.Entity<Account>()
            .Property(a => a.Balance)
            .HasPrecision(18, 2);

        modelBuilder.Entity<Transaction>()
            .Property(t => t.Amount)
            .HasPrecision(18, 2);
      
        modelBuilder.Entity<Account>()
            .Property(a => a.RowVersion)
            .IsRowVersion();
        modelBuilder.Entity<Card>()
            .HasIndex(c => c.Number)
            .IsUnique();

        modelBuilder.Entity<Transaction>()
            .HasIndex(t => t.IdempotencyKey)
            .IsUnique();
        
        modelBuilder.Entity<Transaction>()
            .HasOne(t => t.FromAccount)
            .WithMany()                              
            .HasForeignKey(t => t.FromAccountId)
            .OnDelete(DeleteBehavior.Restrict);      
        
        modelBuilder.Entity<Transaction>()
            .HasOne(t => t.ToAccount)
            .WithMany()
            .HasForeignKey(t => t.ToAccountId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Card>()
            .HasOne(c => c.Account)
            .WithMany(a => a.Cards)
            .HasForeignKey(c => c.AccountId)
            .OnDelete(DeleteBehavior.Cascade);
        
        modelBuilder.Entity<Account>()
            .HasOne(a => a.User)
            .WithMany(u => u.Accounts)
            .HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}