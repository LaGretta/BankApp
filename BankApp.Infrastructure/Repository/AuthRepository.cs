using BankApp.Application.Interfaces.Repository;
using BankApp.Domain.Entities;
using BankApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BankApp.Infrastructure.Repository;

public class AuthRepository : IAuthRepository
{
    private readonly BankDbContext _context;

    public AuthRepository(BankDbContext context)
    {
        _context = context;
    }

    public async Task<User?> GetUserByEmailAsync(string email, CancellationToken ct)
    {
        return await _context.Users.FirstOrDefaultAsync(u => u.Email == email, ct);
    }
    public async Task<bool> ExistUserByEmailAsync(string email, CancellationToken ct)
    {
        return await _context.Users.AnyAsync(u => u.Email == email, ct);
    }
    public async Task CreateUserAsync(User user, CancellationToken ct)
    {
        await _context.Users.AddAsync(user, ct);
    }
    public async Task<User?> GetByIdAsync(int userId, CancellationToken ct)
    {
        return await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);
    }
}