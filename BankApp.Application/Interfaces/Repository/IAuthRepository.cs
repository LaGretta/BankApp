using BankApp.Domain.Entities;

namespace BankApp.Application.Interfaces.Repository;

public interface IAuthRepository
{
    Task<User?> GetUserByEmailAsync(string email, CancellationToken ct);
    Task<User?> GetByIdAsync(int userId, CancellationToken ct);
    Task<bool> ExistUserByEmailAsync(string email , CancellationToken ct);
    Task CreateUserAsync(User user , CancellationToken ct);
}