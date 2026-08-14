using BankApp.Domain.Enums;

namespace BankApp.Domain.Entities;

public class SavingsJar
{
    public int Id { get; set; }

    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public int AccountId { get; set; }
    public Account Account { get; set; } = null!;

    public string Name { get; set; } = string.Empty;
    public string IconKey { get; set; } = string.Empty;

    public decimal TargetAmount { get; set; }
    public decimal CurrentAmount { get; set; }
    public Currency Currency { get; set; }

    public DateTime? TargetDate { get; set; }
    public bool IsClosed { get; set; }
    public DateTime CreatedAt { get; set; }
}