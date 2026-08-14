using BankApp.Application.DTO;

namespace BankApp.Application.Interfaces.Service;

public interface ISavingsJarService
{
    Task<JarResponseDto> CreateJar(int userId, CreateJarDto dto, CancellationToken ct);
    Task<List<JarResponseDto>> GetMyJars(int userId, CancellationToken ct);
    Task<JarResponseDto> GetJarById(int userId, int jarId, CancellationToken ct);
    Task<JarResponseDto> Deposit(int userId, int jarId, JarOperationDto dto, CancellationToken ct);
    Task<JarResponseDto> Withdraw(int userId, int jarId, JarOperationDto dto, CancellationToken ct);
    Task<JarResponseDto> CloseJar(int userId, int jarId, CancellationToken ct);
    Task<List<JarTransactionResponseDto>> GetJarHistory(int userId, int jarId, CancellationToken ct);
}