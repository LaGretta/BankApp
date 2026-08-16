using BankApp.Domain.Enums;

namespace BankApp.Domain.Entities;

public class Loan
{
    public int Id { get; set; }

    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public int AccountId { get; set; }
    public Account Account { get; set; } = null!;

    public decimal Principal { get; set; }          
    public decimal AnnualRate { get; set; }       
    public int TermMonths { get; set; }            
    public decimal MonthlyPayment { get; set; }   
    public decimal RemainingBalance { get; set; }   
    public Currency Currency { get; set; }
    public LoanStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime NextPaymentDate { get; set; }

    public List<LoanPayment> Payments { get; set; } = new();
}