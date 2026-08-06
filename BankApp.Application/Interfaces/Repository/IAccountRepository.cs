using BankApp.Domain.Entities;

namespace BankApp.Application.Interfaces.Repository;

public interface IAccountRepository
{
    Task<List<Account>> GetAllMyAccounts(int userId ,CancellationToken ct);     
    Task<Account> CreateAccountAsync(Account account , CancellationToken ct);
    Task<Account?> GetMyAccountByIdAsync(int userId, int id, CancellationToken ct);
    Task<Account?> GetByIdAsync(int accountId, CancellationToken ct);
}