using BankApp.Domain.Enums;

namespace BankApp.Application.DTO;

public class TransferDto   
{
    public int FromAccountId { get; set; }
    public int ToAccountId { get; set; }
    public decimal Amount { get; set; }
    public string Description { get; set; } = string.Empty;
    public string IdempotencyKey { get; set; } = string.Empty; 
}
public class TransactionResponseDto
{
    public int Id { get; set; }
    public int? FromAccountId { get; set; }
    public int? ToAccountId { get; set; }
    public decimal Amount { get; set; }
    public Currency Currency { get; set; }
    public TransactionType Type { get; set; }
    public TransactionStatus Status { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
public class TopUpDto
{
    public int ToAccountId { get; set; }
    public decimal Amount { get; set; }
    public string IdempotencyKey { get; set; } = string.Empty;
}
