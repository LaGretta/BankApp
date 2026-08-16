using BankApp.Application.DTO;

namespace BankApp.Application.Interfaces.Service;

public interface IAnalyticsService
{
    Task<AnalyticsSummaryDto> GetSummary(int userId, string period, CancellationToken ct);

}