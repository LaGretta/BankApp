using BankApp.Application.DTO;

namespace BankApp.Application.Interfaces.Service;

public interface ICardService
{
    Task<CardCreatedDto> CreateCard(int userId, CreateCardDto dto, CancellationToken ct);
    Task<CardResponseDto> GetCardById(int userId, int id, CancellationToken ct);
    Task<CardResponseDto> BlockCard(int userId, int id, CancellationToken ct);
    Task<string> GetCardCvv(int userId, int cardId, CancellationToken ct);
    Task<CardResponseDto> SetDailyLimit(int userId, int cardId, decimal? dailyLimit, CancellationToken ct);
    Task<decimal> GetSpentToday(int userId, int cardId, CancellationToken ct);
    Task<string> GetCardCurrency(string cardNumber, int userId, CancellationToken ct);
}