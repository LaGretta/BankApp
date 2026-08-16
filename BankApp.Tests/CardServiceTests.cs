using AutoMapper;
using BankApp.Application;
using BankApp.Application.DTO;
using BankApp.Application.Interfaces.Repository;
using BankApp.Application.Interfaces.Security;
using BankApp.Application.Service;
using BankApp.Domain.Entities;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace BankApp.Tests;

public class CardServiceTests
{
    private readonly Mock<ICardRepository> _cardRepo = new();
    private readonly Mock<IMapper> _mapper = new();
    private readonly Mock<ICardNumberGenerator> _cardGen = new();
    private readonly Mock<ILogger<CardService>> _logger = new();
    private readonly Mock<IAccountRepository> _accountRepo = new();
    private readonly Mock<IAuthRepository> _authRepo = new();
    private readonly Mock<IUnitOfWork> _uow = new();
    private readonly Mock<ITransactionRepository> _txRepo = new();
    private readonly CardService _sut;

    public CardServiceTests()
    {
        _sut = new CardService(
            _cardRepo.Object, _mapper.Object, _cardGen.Object, _logger.Object,
            _accountRepo.Object, _authRepo.Object, _uow.Object, _txRepo.Object);
        _mapper.Setup(m => m.Map<CardResponseDto>(It.IsAny<Card>()))
               .Returns(new CardResponseDto());
    }

    [Fact]
    public async Task GetCardCvv_WhenNotMyCard_ThrowsKeyNotFound()
    {
        _cardRepo.Setup(r => r.GetCardByIdAsync(1, 99, It.IsAny<CancellationToken>()))
                 .ReturnsAsync((Card?)null);

        var act = () => _sut.GetCardCvv(1, 99, CancellationToken.None);

        await act.Should().ThrowAsync<KeyNotFoundException>()
                 .WithMessage("Card not found");
    }

    [Fact]
    public async Task SetDailyLimit_Negative_Throws()
    {
        var card = new Card { Id = 1, IsActive = true };
        _cardRepo.Setup(r => r.GetCardByIdAsync(1, 1, It.IsAny<CancellationToken>()))
                 .ReturnsAsync(card);

        var act = () => _sut.SetDailyLimit(1, 1, -50, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
                 .WithMessage("Limit cannot be negative");
    }

    [Fact]
    public async Task SetDailyLimit_ValidValue_SavesLimit()
    {
        var card = new Card { Id = 1, IsActive = true, DailyLimit = null };
        _cardRepo.Setup(r => r.GetCardByIdAsync(1, 1, It.IsAny<CancellationToken>()))
                 .ReturnsAsync(card);

        await _sut.SetDailyLimit(1, 1, 1000, CancellationToken.None);

        card.DailyLimit.Should().Be(1000);
        _uow.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task BlockCard_AlreadyBlocked_Throws()
    {
        var card = new Card { Id = 1, IsActive = false };
        _cardRepo.Setup(r => r.GetCardByIdAsync(1, 1, It.IsAny<CancellationToken>()))
                 .ReturnsAsync(card);

        var act = () => _sut.BlockCard(1, 1, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
                 .WithMessage("Card is already blocked");
    }
}