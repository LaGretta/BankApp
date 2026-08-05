using BankApp.Application.DTO;

namespace BankApp.Application.Interfaces.Service;

public interface ICardService
{
    Task<CardResponseDto> CreateCard(int userId , CreateCardDto dto, CancellationToken ct);
    Task<CardResponseDto> GetCardById(int userId, int id, CancellationToken ct);
    Task<CardResponseDto> BlockCard(int userId, int id, CancellationToken ct);
}