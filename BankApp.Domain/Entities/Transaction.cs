using BankApp.Domain.Enums;

namespace BankApp.Domain.Entities;

public class Transaction
{
    public int Id { get; set; }
    
    public int? FromAccountId { get; set; }
    public Account? FromAccount  { get; set; }
    
    public int? ToAccountId { get; set; }
    public Account? ToAccount { get; set; }
    
    public decimal Amount { get; set; }
    public Currency Currency { get; set; }
    
    public TransactionType Type  { get; set; }
    public TransactionStatus Status { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string IdempotencyKey  { get; set; } = string.Empty;
}