using BankApp.Domain.Enums;

namespace BankApp.Application.DTO;

public class CreateAccountDto
{
    public int AccountId { get; set; }    
    public CardType CardType { get; set; }
}
public class AccountResponseDto
{
    public int Id { get; set; }
    public Currency Currency { get; set; }
    public decimal Balance { get; set; }
    public List<CardResponseDto> Cards { get; set; } = new();
}