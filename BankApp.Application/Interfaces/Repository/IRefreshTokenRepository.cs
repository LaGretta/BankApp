using BankApp.Domain.Entities;

namespace BankApp.Application.Interfaces.Repository;

public interface IRefreshTokenRepository
{
    Task AddAsync(RefreshToken token, CancellationToken ct);
    Task<RefreshToken?> GetByTokenAsync(string token, CancellationToken ct);
}