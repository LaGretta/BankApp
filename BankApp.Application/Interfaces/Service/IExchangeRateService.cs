using BankApp.Domain.Enums;

namespace BankApp.Application.Interfaces.Service;

public interface IExchangeRateService
{
    Task<decimal> GetRateToUahAsync(Currency currency, CancellationToken ct);
}