using AutoMapper;
using BankApp.Application;
using BankApp.Application.DTO;
using BankApp.Application.Interfaces.Repository;
using BankApp.Application.Service;
using BankApp.Domain.Entities;
using BankApp.Domain.Enums;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace BankApp.Tests;

public class SavingsJarServiceTests
{
    private readonly Mock<ISavingsJarRepository> _jarRepo = new();
    private readonly Mock<IAccountRepository> _accountRepo = new();
    private readonly Mock<IUnitOfWork> _uow = new();
    private readonly Mock<IMapper> _mapper = new();
    private readonly Mock<ILogger<SavingsJarService>> _logger = new();
    private readonly SavingsJarService _sut;

    public SavingsJarServiceTests()
    {
        _sut = new SavingsJarService(
            _jarRepo.Object, _accountRepo.Object, _uow.Object, _mapper.Object, _logger.Object);
        _mapper.Setup(m => m.Map<JarResponseDto>(It.IsAny<SavingsJar>()))
               .Returns(new JarResponseDto());
    }

    [Fact]
    public async Task Deposit_Success_MovesMoneyFromAccountToJar()
    {
        var jar = new SavingsJar { Id = 1, AccountId = 10, CurrentAmount = 0, IsClosed = false };
        var account = new Account { Id = 10, Balance = 1000, Currency = Currency.UAH };

        _jarRepo.Setup(r => r.ExistsByIdempotencyKeyAsync("d1", It.IsAny<CancellationToken>()))
                .ReturnsAsync(false);
        _jarRepo.Setup(r => r.GetMyJarByIdAsync(1, 1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(jar);
        _accountRepo.Setup(r => r.GetMyAccountByIdAsync(1, 10, It.IsAny<CancellationToken>()))
                    .ReturnsAsync(account);

        var dto = new JarOperationDto { Amount = 300, IdempotencyKey = "d1" };

        await _sut.Deposit(1, 1, dto, CancellationToken.None);

        account.Balance.Should().Be(700);        // 1000 - 300
        jar.CurrentAmount.Should().Be(300);      // 0 + 300
        _uow.Verify(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Deposit_InsufficientAccountFunds_Throws()
    {
        var jar = new SavingsJar { Id = 1, AccountId = 10, CurrentAmount = 0, IsClosed = false };
        var account = new Account { Id = 10, Balance = 100, Currency = Currency.UAH };

        _jarRepo.Setup(r => r.ExistsByIdempotencyKeyAsync("d2", It.IsAny<CancellationToken>()))
                .ReturnsAsync(false);
        _jarRepo.Setup(r => r.GetMyJarByIdAsync(1, 1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(jar);
        _accountRepo.Setup(r => r.GetMyAccountByIdAsync(1, 10, It.IsAny<CancellationToken>()))
                    .ReturnsAsync(account);

        var dto = new JarOperationDto { Amount = 500, IdempotencyKey = "d2" };

        var act = () => _sut.Deposit(1, 1, dto, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
                 .WithMessage("Insufficient funds");
    }

    [Fact]
    public async Task Withdraw_MoreThanInJar_Throws()
    {
        var jar = new SavingsJar { Id = 1, AccountId = 10, CurrentAmount = 200, IsClosed = false };
        var account = new Account { Id = 10, Balance = 1000, Currency = Currency.UAH };

        _jarRepo.Setup(r => r.ExistsByIdempotencyKeyAsync("w1", It.IsAny<CancellationToken>()))
                .ReturnsAsync(false);
        _jarRepo.Setup(r => r.GetMyJarByIdAsync(1, 1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(jar);
        _accountRepo.Setup(r => r.GetMyAccountByIdAsync(1, 10, It.IsAny<CancellationToken>()))
                    .ReturnsAsync(account);

        var dto = new JarOperationDto { Amount = 500, IdempotencyKey = "w1" };

        var act = () => _sut.Withdraw(1, 1, dto, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
                 .WithMessage("Insufficient funds in jar");
    }

    [Fact]
    public async Task Deposit_ClosedJar_Throws()
    {
        var jar = new SavingsJar { Id = 1, AccountId = 10, CurrentAmount = 0, IsClosed = true };

        _jarRepo.Setup(r => r.ExistsByIdempotencyKeyAsync("d3", It.IsAny<CancellationToken>()))
                .ReturnsAsync(false);
        _jarRepo.Setup(r => r.GetMyJarByIdAsync(1, 1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(jar);

        var dto = new JarOperationDto { Amount = 100, IdempotencyKey = "d3" };

        var act = () => _sut.Deposit(1, 1, dto, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
                 .WithMessage("Jar is closed");
    }

    [Fact]
    public async Task CloseJar_ReturnsAllMoneyToAccount()
    {
        var jar = new SavingsJar { Id = 1, AccountId = 10, CurrentAmount = 400, IsClosed = false };
        var account = new Account { Id = 10, Balance = 600, Currency = Currency.UAH };

        _jarRepo.Setup(r => r.GetMyJarByIdAsync(1, 1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(jar);
        _accountRepo.Setup(r => r.GetMyAccountByIdAsync(1, 10, It.IsAny<CancellationToken>()))
                    .ReturnsAsync(account);

        await _sut.CloseJar(1, 1, CancellationToken.None);

        account.Balance.Should().Be(1000);   // 600 + 400
        jar.CurrentAmount.Should().Be(0);
        jar.IsClosed.Should().BeTrue();
        _uow.Verify(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}