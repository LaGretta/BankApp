namespace BankApp.Domain.Entities;

public class LoanPayment
{
    public int Id { get; set; }

    public int LoanId { get; set; }
    public Loan Loan { get; set; } = null!;

    public DateTime DueDate { get; set; }           
    public decimal Amount { get; set; }         
    public decimal PrincipalPart { get; set; }     
    public decimal InterestPart { get; set; }      
    public bool IsPaid { get; set; }
    public DateTime? PaidAt { get; set; }     
}