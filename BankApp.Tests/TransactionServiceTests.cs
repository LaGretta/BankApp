using AutoMapper;
using BankApp.Application;
using BankApp.Application.DTO;
using BankApp.Application.Interfaces.Repository;
using BankApp.Application.Interfaces.Service;
using BankApp.Application.Service;
using BankApp.Domain.Entities;
using BankApp.Domain.Enums;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace BankApp.Tests;

public class TransactionServiceTests
{
    private readonly Mock<ITransactionRepository> _txRepo = new();
    private readonly Mock<ICardRepository> _cardRepo = new();
    private readonly Mock<IAccountRepository> _accountRepo = new();
    private readonly Mock<IUnitOfWork> _uow = new();
    private readonly Mock<IMapper> _mapper = new();
    private readonly Mock<ILogger<TransactionService>> _logger = new();
    private readonly Mock<IExchangeRateService> _exchangeRate = new();
    private readonly TransactionService _sut;
    

    public TransactionServiceTests()
    {
        _sut = new TransactionService(
            _txRepo.Object, _mapper.Object, _uow.Object,
            _cardRepo.Object, _logger.Object, _accountRepo.Object, _exchangeRate.Object);
    }

    private static Card MakeCard(int cardId, int accountId, decimal balance,
        Currency currency = Currency.UAH, bool active = true, decimal? limit = null)
    {
        return new Card
        {
            Id = cardId,
            AccountId = accountId,
            IsActive = active,
            DailyLimit = limit,
            Account = new Account { Id = accountId, Balance = balance, Currency = currency }
        };
    }

    [Fact]
    public async Task Transfer_DuplicateIdempotencyKey_Throws()
    {
        _txRepo.Setup(r => r.ExistsByIdempotencyKeyAsync("dup", It.IsAny<CancellationToken>()))
               .ReturnsAsync(true);

        var dto = new TransferDto { FromCardId = 1, ToAccountId = 2, Amount = 100, IdempotencyKey = "dup" };

        var act = () => _sut.Transfer(1, dto, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
                 .WithMessage("Duplicate transaction");
        _uow.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Transfer_InsufficientFunds_ThrowsAndNoSave()
    {
        var fromCard = MakeCard(cardId: 1, accountId: 10, balance: 100);
        _cardRepo.Setup(r => r.GetCardByIdAsync(1, 1, It.IsAny<CancellationToken>()))
                 .ReturnsAsync(fromCard);
        _accountRepo.Setup(r => r.GetByIdAsync(2, It.IsAny<CancellationToken>()))
                    .ReturnsAsync(new Account { Id = 2, Balance = 0, Currency = Currency.UAH });

        var dto = new TransferDto { FromCardId = 1, ToAccountId = 2, Amount = 500, IdempotencyKey = "k1" };

        var act = () => _sut.Transfer(1, dto, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
                 .WithMessage("Insufficient funds");
        _uow.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Transfer_Success_MovesMoneyAndCommits()
    {
        var fromCard = MakeCard(cardId: 1, accountId: 10, balance: 1000);
        var toAccount = new Account { Id = 20, Balance = 200, Currency = Currency.UAH };

        _cardRepo.Setup(r => r.GetCardByIdAsync(1, 1, It.IsAny<CancellationToken>()))
                 .ReturnsAsync(fromCard);
        _accountRepo.Setup(r => r.GetByIdAsync(20, It.IsAny<CancellationToken>()))
                    .ReturnsAsync(toAccount);
        _mapper.Setup(m => m.Map<TransactionResponseDto>(It.IsAny<Transaction>()))
               .Returns(new TransactionResponseDto());

        var dto = new TransferDto { FromCardId = 1, ToAccountId = 20, Amount = 300, IdempotencyKey = "k2" };

        await _sut.Transfer(1, dto, CancellationToken.None);

        fromCard.Account!.Balance.Should().Be(700);  
        toAccount.Balance.Should().Be(500);          
        _txRepo.Verify(r => r.AddAsync(It.IsAny<Transaction>(), It.IsAny<CancellationToken>()), Times.Once);
        _uow.Verify(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Transfer_ExceedsDailyLimit_Throws()
    {
        var fromCard = MakeCard(cardId: 1, accountId: 10, balance: 1000, limit: 100);
        _cardRepo.Setup(r => r.GetCardByIdAsync(1, 1, It.IsAny<CancellationToken>()))
                 .ReturnsAsync(fromCard);
        _accountRepo.Setup(r => r.GetByIdAsync(20, It.IsAny<CancellationToken>()))
                    .ReturnsAsync(new Account { Id = 20, Balance = 0, Currency = Currency.UAH });
        _txRepo.Setup(r => r.GetTodaySpentByCardAsync(1, It.IsAny<CancellationToken>()))
               .ReturnsAsync(80m);

        var dto = new TransferDto { FromCardId = 1, ToAccountId = 20, Amount = 50, IdempotencyKey = "k3" };

        var act = () => _sut.Transfer(1, dto, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
                 .WithMessage("Daily card limit exceeded");
        _uow.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Transfer_CurrencyMismatch_Throws()
    {
        var fromCard = MakeCard(cardId: 1, accountId: 10, balance: 1000, currency: Currency.UAH);
        _cardRepo.Setup(r => r.GetCardByIdAsync(1, 1, It.IsAny<CancellationToken>()))
                 .ReturnsAsync(fromCard);
        _accountRepo.Setup(r => r.GetByIdAsync(20, It.IsAny<CancellationToken>()))
                    .ReturnsAsync(new Account { Id = 20, Balance = 0, Currency = Currency.USD });

        var dto = new TransferDto { FromCardId = 1, ToAccountId = 20, Amount = 50, IdempotencyKey = "k4" };

        var act = () => _sut.Transfer(1, dto, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
                 .WithMessage("Currency mismatch");
    }
}