using BankApp.Application.Interfaces.Repository;
using BankApp.Domain.Entities;
using BankApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BankApp.Infrastructure.Repository;

public class CardRepository : ICardRepository
{
    private readonly BankDbContext _dbContext;
    public CardRepository(BankDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Card> CreateCardAsync(Card card, CancellationToken ct)
    {
        await _dbContext.Cards.AddAsync(card, ct);
        return card;
    }

    public async Task<Card?> GetCardByIdAsync(int userId, int cardId, CancellationToken ct)
    {
        var find = await _dbContext.Cards.FirstOrDefaultAsync(n => n.Id == cardId, ct);
        return find;
    }

    public void UpdateBlockCardAsync(Card card, CancellationToken ct)
    {
        _dbContext.Cards.Update(card);
    }

    public async Task<bool> ExistsByNumberAsync(string number, CancellationToken ct)
    {
        var find = await _dbContext.Cards.AnyAsync(a => a.Number == number, ct);
        return find;
    }

    public async Task<Card?> GetByNumberAsync(string number, CancellationToken ct)
    {
        var find = await _dbContext.Cards.FirstOrDefaultAsync(a => a.Number == number, ct);
        return find;
    }
}