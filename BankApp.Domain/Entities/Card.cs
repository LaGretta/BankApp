using BankApp.Domain.Enums;

namespace BankApp.Domain.Entities;

public class Card
{
    public int Id { get; set; }
    public CardType CardType { get; set; }
    
    public int AccountId { get; set; }
    public Account Account { get; set; } = null!;
    
    public string Number { get; set; } = string.Empty;
    public string Cvv { get; set; } =  string.Empty;
    public string HolderName { get; set; } = string.Empty;
    
    public DateTime ExpiryDate  { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsActive { get; set; }
}