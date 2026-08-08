using BankApp.Application;
using BankApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Storage;

namespace BankApp.Infrastructure;

public class UnitOfWork : IUnitOfWork
{
    private readonly BankDbContext _dbContext;
    private IDbContextTransaction? _transaction;
    public UnitOfWork(BankDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public Task<int> SaveChangesAsync(CancellationToken ct)
        => _dbContext.SaveChangesAsync(ct);
    
    public async Task BeginTransactionAsync(CancellationToken ct)
    {
        _transaction = await _dbContext.Database.BeginTransactionAsync(ct);
    }
    public async Task CommitTransactionAsync(CancellationToken ct)
    {
        if (_transaction != null)
        {
            await _transaction.CommitAsync(ct);
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }
    public async Task RollbackTransactionAsync(CancellationToken ct)
    {
        if (_transaction != null)
        {
            await _transaction.RollbackAsync(ct);
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }
}