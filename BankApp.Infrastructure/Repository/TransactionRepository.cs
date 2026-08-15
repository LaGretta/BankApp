using BankApp.Application.Interfaces.Repository;
using BankApp.Domain.Entities;
using BankApp.Domain.Enums;
using BankApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BankApp.Infrastructure.Repository;

public class TransactionRepository : ITransactionRepository
{
    private readonly BankDbContext _dbContext;
    public TransactionRepository(BankDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task AddAsync(Transaction transaction, CancellationToken ct)
    {
         await  _dbContext.Transactions.AddAsync(transaction, ct);
    }

    public async Task<bool> ExistsByIdempotencyKeyAsync(string key, CancellationToken ct)
    {
        var find = await _dbContext.Transactions.AnyAsync(x => x.IdempotencyKey == key, ct);
        return find;
    }

    public async Task<(List<Transaction> items, int totalCount)> GetMyTransactionsAsync(int userId, int page, int pageSize, CancellationToken ct)
    {
        var query = _dbContext.Transactions
            .Where(t => (t.FromAccount != null && t.FromAccount.UserId == userId)
                        || (t.ToAccount != null && t.ToAccount.UserId == userId));
        
        var totalCount = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(t => t.CreatedAt)  
            .Skip((page - 1) * pageSize)         
            .Take(pageSize)                      
            .ToListAsync(ct);

        return (items, totalCount);
    }

    public async Task<Transaction?> GetTransactionByIdAsync(int userId, int transactionId, CancellationToken ct)
    {
        return await _dbContext.Transactions
            .FirstOrDefaultAsync(t => t.Id == transactionId
                                      && ((t.FromAccount != null && t.FromAccount.UserId == userId)
                                          || (t.ToAccount != null && t.ToAccount.UserId == userId)), ct);
    }
    
    public async Task<decimal> GetTodaySpentByCardAsync(int cardId, CancellationToken ct)
    {
        var today = DateTime.UtcNow.Date;
        return await _dbContext.Transactions
            .Where(t => t.CardId == cardId
                        && t.Type == TransactionType.Transfer
                        && t.CreatedAt >= today)
            .SumAsync(t => t.Amount, ct);
    }
    
    
    
}