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

public class AccountServiceTests
{
    private readonly Mock<IAccountRepository> _accountRepo = new();
    private readonly Mock<IUnitOfWork> _uow = new();
    private readonly Mock<IMapper> _mapper = new();
    private readonly Mock<ILogger<AccountService>> _logger = new();
    private readonly AccountService _sut;

    public AccountServiceTests()
    {
        _sut = new AccountService(_mapper.Object, _accountRepo.Object, _uow.Object, _logger.Object);
    }

    [Fact]
    public async Task GetAccountById_WhenNotFound_ThrowsKeyNotFound()
    {
        _accountRepo
            .Setup(r => r.GetMyAccountByIdAsync(1, 99, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Account?)null);

        await Assert.ThrowsAsync<KeyNotFoundException>(
            () => _sut.GetAccountById(1, 99, CancellationToken.None));
    }

    [Fact]
    public async Task CreateAccount_SavesAndReturnsDto()
    {
        var dto = new CreateAccountDto { Currency = Currency.UAH };
        _mapper.Setup(m => m.Map<AccountResponseDto>(It.IsAny<Account>()))
            .Returns(new AccountResponseDto());

        var result = await _sut.CreateAccount(1, dto, CancellationToken.None);

        _accountRepo.Verify(r => r.CreateAccountAsync(
            It.Is<Account>(a => a.UserId == 1 && a.Balance == 0 && a.Currency == Currency.UAH),
            It.IsAny<CancellationToken>()), Times.Once);
        _uow.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        result.Should().NotBeNull();
    }
}