namespace BankApp.Application.DTO;

public class CreateLoanDto
{
    public int AccountId { get; set; }       
    public decimal Principal { get; set; }   
    public int TermMonths { get; set; }     
}

public class LoanPaymentRequestDto
{
    public string IdempotencyKey { get; set; } = string.Empty;
}

public class LoanCalculationDto
{
    public decimal Principal { get; set; }
    public int TermMonths { get; set; }
}

public class LoanResponseDto
{
    public int Id { get; set; }
    public int AccountId { get; set; }
    public decimal Principal { get; set; }
    public decimal AnnualRate { get; set; }
    public int TermMonths { get; set; }
    public decimal MonthlyPayment { get; set; }
    public decimal RemainingBalance { get; set; }
    public string Currency { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime NextPaymentDate { get; set; }
}

public class LoanPaymentResponseDto
{
    public int Id { get; set; }
    public DateTime DueDate { get; set; }
    public decimal Amount { get; set; }
    public decimal PrincipalPart { get; set; }
    public decimal InterestPart { get; set; }
    public bool IsPaid { get; set; }
    public DateTime? PaidAt { get; set; }
}

public class LoanCalculationResultDto
{
    public decimal MonthlyPayment { get; set; }
    public decimal TotalToRepay { get; set; }   
    public decimal TotalInterest { get; set; }    
    public decimal AnnualRate { get; set; }
}