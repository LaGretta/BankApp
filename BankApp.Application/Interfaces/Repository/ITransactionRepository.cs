using BankApp.Domain.Entities;

namespace BankApp.Application.Interfaces.Repository;

public interface ITransactionRepository
{
    Task AddAsync(Transaction transaction, CancellationToken ct);
    Task<bool> ExistsByIdempotencyKeyAsync(string key, CancellationToken ct);
    Task<(List<Transaction> items, int totalCount)> GetMyTransactionsAsync(int userId, int page, int pageSize, CancellationToken ct);
    Task<Transaction?> GetTransactionByIdAsync(int userId, int transactionId, CancellationToken ct);
}