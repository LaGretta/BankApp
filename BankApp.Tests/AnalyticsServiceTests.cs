using BankApp.Application.Interfaces.Repository;
using BankApp.Application.Interfaces.Service;
using BankApp.Application.Service;
using BankApp.Domain.Entities;
using BankApp.Domain.Enums;
using FluentAssertions;
using Moq;
using Xunit;

namespace BankApp.Tests;

public class AnalyticsServiceTests
{
    private readonly Mock<ITransactionRepository> _txRepo = new();
    private readonly Mock<IExchangeRateService> _exchangeRate = new();
    private readonly AnalyticsService _sut;

    public AnalyticsServiceTests()
    {
        _exchangeRate.Setup(r => r.GetRateToUahAsync(Currency.USD, It.IsAny<CancellationToken>()))
                     .ReturnsAsync(40m);
        _exchangeRate.Setup(r => r.GetRateToUahAsync(Currency.EUR, It.IsAny<CancellationToken>()))
                     .ReturnsAsync(44m);
        _sut = new AnalyticsService(_txRepo.Object, _exchangeRate.Object);
    }

    private static Transaction Tx(int? fromUserId, int? toUserId, decimal amount, Currency cur)
    {
        return new Transaction
        {
            Amount = amount,
            Currency = cur,
            Type = TransactionType.Transfer,
            CreatedAt = DateTime.UtcNow,
            FromAccount = fromUserId.HasValue ? new Account { UserId = fromUserId.Value } : null,
            ToAccount = toUserId.HasValue ? new Account { UserId = toUserId.Value } : null
        };
    }

    [Fact]
    public async Task Summary_SpentAndReceived_CountedCorrectly()
    {
        var txs = new List<Transaction>
        {
            Tx(fromUserId: 1, toUserId: 2, amount: 100, cur: Currency.UAH),  
            Tx(fromUserId: 3, toUserId: 1, amount: 50,  cur: Currency.UAH),  
        };
        _txRepo.Setup(r => r.GetUserTransactionsInPeriodAsync(
                1, It.IsAny<DateTime>(), It.IsAny<DateTime>(), It.IsAny<CancellationToken>()))
               .ReturnsAsync(txs);

        var result = await _sut.GetSummary(1, "all", CancellationToken.None);

        result.TotalSpent.Should().Be(100);
        result.TotalReceived.Should().Be(50);
        result.Net.Should().Be(-50);
    }

    [Fact]
    public async Task Summary_ConvertsForeignCurrencyToUah()
    {
        var txs = new List<Transaction>
        {
            Tx(fromUserId: 1, toUserId: 2, amount: 10, cur: Currency.USD),
        };
        _txRepo.Setup(r => r.GetUserTransactionsInPeriodAsync(
                1, It.IsAny<DateTime>(), It.IsAny<DateTime>(), It.IsAny<CancellationToken>()))
               .ReturnsAsync(txs);

        var result = await _sut.GetSummary(1, "all", CancellationToken.None);

        result.TotalSpent.Should().Be(400);   
        result.Currency.Should().Be("UAH");
    }

    [Fact]
    public async Task Summary_TransferBetweenOwnAccounts_NotCountedAsSpending()
    {
        var txs = new List<Transaction>
        {
            Tx(fromUserId: 1, toUserId: 1, amount: 500, cur: Currency.UAH),
        };
        _txRepo.Setup(r => r.GetUserTransactionsInPeriodAsync(
                1, It.IsAny<DateTime>(), It.IsAny<DateTime>(), It.IsAny<CancellationToken>()))
               .ReturnsAsync(txs);

        var result = await _sut.GetSummary(1, "all", CancellationToken.None);

        result.TotalSpent.Should().Be(0);
        result.TotalReceived.Should().Be(0);
    }

    [Fact]
    public async Task Summary_NoTransactions_ReturnsZeros()
    {
        _txRepo.Setup(r => r.GetUserTransactionsInPeriodAsync(
                1, It.IsAny<DateTime>(), It.IsAny<DateTime>(), It.IsAny<CancellationToken>()))
               .ReturnsAsync(new List<Transaction>());

        var result = await _sut.GetSummary(1, "all", CancellationToken.None);

        result.TotalSpent.Should().Be(0);
        result.TotalReceived.Should().Be(0);
        result.Net.Should().Be(0);
        result.Breakdown.Should().BeEmpty();
    }
}