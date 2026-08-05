using BankApp.Application.DTO;

namespace BankApp.Application.Interfaces.Service;

public interface IAccountService
{
    Task<List<AccountResponseDto>> GetMyAccounts(int userId , CancellationToken ct);
    Task<AccountResponseDto> GetAccountById(int userId,int id , CancellationToken ct);
    Task<AccountResponseDto> CreateAccount(int userId, CreateAccountDto dto, CancellationToken ct);
}