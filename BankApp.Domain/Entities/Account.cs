using BankApp.Domain.Enums;

namespace BankApp.Domain.Entities;

public class Account
{
    public int Id { get; set; }
    
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    
    public Currency Currency { get; set; }
    public decimal Balance { get; set; }
    
    public ICollection<Card> Cards { get; set; } = new List<Card>();
    public byte[] RowVersion  { get; set; } = new  byte[0];
}