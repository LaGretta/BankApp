using BankApp.Application.DTO;

namespace BankApp.Application.Interfaces.Service;

public interface ITransactionService
{
    Task<TransactionResponseDto> Transfer(int userId, TransferDto dto, CancellationToken ct);
    Task<TransactionResponseDto> TopUp(int userId, TopUpDto dto, CancellationToken ct);
    Task<PagedResponse<TransactionResponseDto>> GetHistory(int userId, int page, int pageSize, CancellationToken ct);
    Task<TransactionResponseDto> GetTransactionById(int userId, int transactionId, CancellationToken ct);
    Task<TransactionResponseDto> TransferByCard(int userId, TransferByCardDto dto, CancellationToken ct);
}