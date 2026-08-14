using BankApp.Domain.Entities;

namespace BankApp.Application.Interfaces.Repository;

public interface ISavingsJarRepository
{
    Task CreateJarAsync(SavingsJar jar, CancellationToken ct);
    Task<List<SavingsJar>> GetMyJarsAsync(int userId, CancellationToken ct);
    Task<SavingsJar?> GetMyJarByIdAsync(int userId, int jarId, CancellationToken ct);
    Task AddJarTransactionAsync(JarTransaction jarTransaction, CancellationToken ct);
    Task<List<JarTransaction>> GetJarTransactionsAsync(int jarId, CancellationToken ct);
    Task<bool> ExistsByIdempotencyKeyAsync(string key, CancellationToken ct);
}