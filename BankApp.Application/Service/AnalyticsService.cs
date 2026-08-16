using BankApp.Application.DTO;
using BankApp.Application.Interfaces.Repository;
using BankApp.Application.Interfaces.Service;
using BankApp.Domain.Entities;
using BankApp.Domain.Enums;

namespace BankApp.Application.Service;

public class AnalyticsService : IAnalyticsService
{
    private readonly ITransactionRepository _transactionRepository;
    private readonly IExchangeRateService _exchangeRateService;

    public AnalyticsService(
        ITransactionRepository transactionRepository,
        IExchangeRateService exchangeRateService)
    {
        _transactionRepository = transactionRepository;
        _exchangeRateService = exchangeRateService;
    }

    public async Task<AnalyticsSummaryDto> GetSummary(int userId, string period, CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        DateTime from = period switch
        {
            "month" => new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc),
            "year"  => new DateTime(now.Year, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            "all"   => DateTime.UnixEpoch,
            _       => new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc)
        };
        var to = now.AddSeconds(1);

        var txs = await _transactionRepository
            .GetUserTransactionsInPeriodAsync(userId, from, to, ct);

        var usdRate = await _exchangeRateService.GetRateToUahAsync(Currency.USD, ct);
        var eurRate = await _exchangeRateService.GetRateToUahAsync(Currency.EUR, ct);

        decimal ToUah(decimal amount, Currency cur) => cur switch
        {
            Currency.USD => amount * usdRate,
            Currency.EUR => amount * eurRate,
            _            => amount   
        };

        decimal totalSpent = 0, totalReceived = 0;
        var breakdown = new Dictionary<string, decimal>();
        var chart = new Dictionary<string, (decimal spent, decimal received)>();

        foreach (var t in txs)
        {
            var isSpent = t.FromAccount != null && t.FromAccount.UserId == userId;
            var isReceived = t.ToAccount != null && t.ToAccount.UserId == userId;

            var amountUah = ToUah(t.Amount, t.Currency);

            var label = period == "month"
                ? t.CreatedAt.ToString("dd")
                : t.CreatedAt.ToString("yyyy-MM");

            if (!chart.ContainsKey(label))
                chart[label] = (0, 0);

            if (isSpent && !isReceived)
            {
                totalSpent += amountUah;
                var type = t.Type.ToString();
                breakdown[type] = breakdown.GetValueOrDefault(type) + amountUah;
                chart[label] = (chart[label].spent + amountUah, chart[label].received);
            }
            else if (isReceived && !isSpent)
            {
                totalReceived += amountUah;
                chart[label] = (chart[label].spent, chart[label].received + amountUah);
            }
        }

        return new AnalyticsSummaryDto
        {
            TotalSpent = Math.Round(totalSpent, 2),
            TotalReceived = Math.Round(totalReceived, 2),
            Net = Math.Round(totalReceived - totalSpent, 2),
            Currency = "UAH",
            Breakdown = breakdown
                .Select(kv => new AnalyticsBreakdownDto { Type = kv.Key, Amount = Math.Round(kv.Value, 2) })
                .OrderByDescending(b => b.Amount)
                .ToList(),
            Chart = chart
                .OrderBy(kv => kv.Key)
                .Select(kv => new AnalyticsPointDto
                {
                    Label = kv.Key,
                    Spent = Math.Round(kv.Value.spent, 2),
                    Received = Math.Round(kv.Value.received, 2)
                })
                .ToList()
        };
    }
}