using BankApp.Domain.Entities;

namespace BankApp.Application.Interfaces.Repository;

public interface ILoanRepository
{
    Task CreateLoanAsync(Loan loan, CancellationToken ct);
    Task<List<Loan>> GetMyLoansAsync(int userId, CancellationToken ct);
    Task<Loan?> GetMyLoanByIdAsync(int userId, int loanId, CancellationToken ct);
    Task<LoanPayment?> GetNextUnpaidPaymentAsync(int loanId, CancellationToken ct);
}