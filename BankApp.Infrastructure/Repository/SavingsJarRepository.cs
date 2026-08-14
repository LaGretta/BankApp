using BankApp.Application.Interfaces.Repository;
using BankApp.Domain.Entities;
using BankApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BankApp.Infrastructure.Repository;

public class SavingsJarRepository : ISavingsJarRepository
{
    private readonly BankDbContext _dbContext;
    public SavingsJarRepository(BankDbContext dbContext)
    {
        _dbContext = dbContext;
    }
    public async Task CreateJarAsync(SavingsJar jar, CancellationToken ct)
    {
        await _dbContext.SavingsJars.AddAsync(jar, ct);
    }
    public async Task<List<SavingsJar>> GetMyJarsAsync(int userId, CancellationToken ct)
    {
        return await _dbContext.SavingsJars
            .Where(j => j.UserId == userId)
            .ToListAsync(ct);
    }
    public async Task<SavingsJar?> GetMyJarByIdAsync(int userId, int jarId, CancellationToken ct)
    {
        return await _dbContext.SavingsJars
            .FirstOrDefaultAsync(j => j.Id == jarId && j.UserId == userId, ct);
    }
    public async Task AddJarTransactionAsync(JarTransaction jarTransaction, CancellationToken ct)
    {
        await _dbContext.JarTransactions.AddAsync(jarTransaction, ct);
    }
    
    public async Task<List<JarTransaction>> GetJarTransactionsAsync(int jarId, CancellationToken ct)
    {
        return await _dbContext.JarTransactions
            .Where(t => t.JarId == jarId)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync(ct);
    }
    public async Task<bool> ExistsByIdempotencyKeyAsync(string key, CancellationToken ct)
    {
        return await _dbContext.JarTransactions.AnyAsync(t => t.IdempotencyKey == key, ct);
    }
}