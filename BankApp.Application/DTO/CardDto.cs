using BankApp.Domain.Enums;

namespace BankApp.Application.DTO;

public class CreteCardDto
{
    public int AccountId { get; set; }      
    public CardType CardType { get; set; }
}
public class CardResponseDto
{
    public int Id { get; set; }
    public CardType CardType { get; set; }
    public string MaskedNumber { get; set; } = string.Empty; 
    public string HolderName { get; set; } = string.Empty;
    public DateTime ExpiryDate { get; set; }
    public bool IsActive { get; set; }
}
