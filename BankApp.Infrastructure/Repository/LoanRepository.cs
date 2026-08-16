using BankApp.Application.Interfaces.Repository;
using BankApp.Domain.Entities;
using BankApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BankApp.Infrastructure.Repository;

public class LoanRepository : ILoanRepository
{
    private readonly BankDbContext _dbContext;
    public LoanRepository(BankDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task CreateLoanAsync(Loan loan, CancellationToken ct)
    {
        await _dbContext.Loans.AddAsync(loan, ct);
    }

    public async Task<List<Loan>> GetMyLoansAsync(int userId, CancellationToken ct)
    {
        return await _dbContext.Loans
            .Where(l => l.UserId == userId)
            .OrderByDescending(l => l.CreatedAt)
            .ToListAsync(ct);
    }

    public async Task<Loan?> GetMyLoanByIdAsync(int userId, int loanId, CancellationToken ct)
    {
        return await _dbContext.Loans
            .Include(l => l.Payments)
            .FirstOrDefaultAsync(l => l.Id == loanId && l.UserId == userId, ct);
    }

    public async Task<LoanPayment?> GetNextUnpaidPaymentAsync(int loanId, CancellationToken ct)
    {
        return await _dbContext.LoanPayments
            .Where(p => p.LoanId == loanId && !p.IsPaid)
            .OrderBy(p => p.DueDate)
            .FirstOrDefaultAsync(ct);
    }
}