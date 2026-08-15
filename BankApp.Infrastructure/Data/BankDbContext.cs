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
    public DbSet<SavingsJar> SavingsJars { get; set; }
    public DbSet<JarTransaction> JarTransactions { get; set; }
    public DbSet<RefreshToken> RefreshTokens { get; set; }
    
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
        
        modelBuilder.Entity<Transaction>()
            .HasOne(t => t.Card)
            .WithMany()
            .HasForeignKey(t => t.CardId)
            .OnDelete(DeleteBehavior.Restrict);
        
        modelBuilder.Entity<Card>()
            .Property(c => c.DailyLimit)
            .HasPrecision(18, 2);
        
        
        modelBuilder.Entity<SavingsJar>(e =>
        {
            e.Property(x => x.TargetAmount).HasPrecision(18, 2);
            e.Property(x => x.CurrentAmount).HasPrecision(18, 2);

            e.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(x => x.Account)
                .WithMany()
                .HasForeignKey(x => x.AccountId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<JarTransaction>(e =>
        {
            e.HasIndex(x => x.IdempotencyKey).IsUnique();
            e.Property(x => x.Amount).HasPrecision(18, 2);

            e.HasOne(x => x.Jar)
                .WithMany()
                .HasForeignKey(x => x.JarId)
                .OnDelete(DeleteBehavior.Restrict);   
        });
        
        modelBuilder.Entity<RefreshToken>(e =>
        {
            e.HasIndex(x => x.Token).IsUnique();

            e.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}