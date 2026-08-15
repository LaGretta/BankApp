using BankApp.Domain.Entities;

namespace BankApp.Application.Interfaces.Security;

public interface IJwtTokenGenerator
{
    string GenerateJwtToken(User user);
    string GenerateRefreshToken();
}