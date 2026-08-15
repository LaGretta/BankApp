namespace BankApp.Application.DTO;

public class TransferByCardDto
{
    public int FromCardId { get; set; }
    public string CardNumber { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Description { get; set; } = string.Empty;
    public string IdempotencyKey { get; set; } = string.Empty;
}