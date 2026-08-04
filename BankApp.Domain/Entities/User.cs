using BankApp.Domain.Enums;

namespace BankApp.Domain.Entities;

public class User
{
    public int Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;   
    public Role Role { get; set; }
    public DateTime CreatedAt { get; set; } 
    
    public ICollection<Account> Accounts { get; set; } = new List<Account>();
}