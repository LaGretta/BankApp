using BankApp.Domain.Enums;

namespace BankApp.Domain.Entities;

public class JarTransaction
{
    public int Id { get; set; }

    public int JarId { get; set; }
    public SavingsJar Jar { get; set; } = null!;

    public decimal Amount { get; set; }
    public JarTransactionType Type { get; set; }
    public DateTime CreatedAt { get; set; }
    public string IdempotencyKey { get; set; } = string.Empty;
}