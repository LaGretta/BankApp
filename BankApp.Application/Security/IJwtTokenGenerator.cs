using BankApp.Domain.Entities;

namespace BankApp.Application.Security;

public interface IJwtTokenGenerator
{
    string GenerateJwtToken(User user);
}