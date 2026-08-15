using BankApp.Application.DTO;

namespace BankApp.Application.Interfaces.Service;

public interface IAuthService
{
    Task<AuthResponseDto> Register(RegisterDto registerDto, CancellationToken ct);
    Task<AuthResponseDto> Login(LoginDto loginDto, CancellationToken ct);
    Task<AuthResponseDto> Refresh(RefreshRequestDto dto, CancellationToken ct);
    Task Logout(RefreshRequestDto dto, CancellationToken ct);
}