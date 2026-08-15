using BankApp.Domain.Enums;

namespace BankApp.Application.DTO;

public class CreateCardDto
{
    public int AccountId { get; set; }      
    public CardType CardType { get; set; }
}
public class CardResponseDto
{
    public int Id { get; set; }
    public CardType CardType { get; set; }
    public string Number { get; set; } = string.Empty;
    public string HolderName { get; set; } = string.Empty;
    public DateTime ExpiryDate { get; set; }
    public bool IsActive { get; set; }
    public decimal? DailyLimit { get; set; }
}
public class CardCreatedDto
{
    public int Id { get; set; }
    public CardType CardType { get; set; }
    public string Number { get; set; } = string.Empty;
    public string Cvv { get; set; } = string.Empty;   
    public string HolderName { get; set; } = string.Empty;
    public DateTime ExpiryDate { get; set; }
}
public class SetLimitDto
{
    public decimal? DailyLimit { get; set; }
}

