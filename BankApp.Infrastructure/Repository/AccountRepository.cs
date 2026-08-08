using BankApp.Application.Interfaces.Repository;
using BankApp.Domain.Entities;
using BankApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BankApp.Infrastructure.Repository;

public class AccountRepository : IAccountRepository
{
    private readonly BankDbContext _dbContext;
    public AccountRepository(BankDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<Account>> GetAllMyAccounts(int userId, CancellationToken ct)
    {
        return await _dbContext.Accounts
            .Include(a => a.Cards)             
            .Where(a => a.UserId == userId)
            .ToListAsync(ct);
    }

    public async Task<Account> CreateAccountAsync(Account account, CancellationToken ct)
    {
         await  _dbContext.Accounts.AddAsync(account, ct);
         return account;
    }

    public async Task<Account?> GetMyAccountByIdAsync(int userId, int id, CancellationToken ct)
    {
        return await _dbContext.Accounts
            .Include(a => a.Cards)           
            .FirstOrDefaultAsync(a => a.UserId == userId && a.Id == id, ct);
    }

    public async Task<Account?> GetByIdAsync(int accountId, CancellationToken ct)
    {
        var get = await _dbContext.Accounts.FirstOrDefaultAsync(n => n.Id == accountId, ct);
        return get;
    }
}