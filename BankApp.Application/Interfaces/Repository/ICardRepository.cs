using BankApp.Domain.Entities;

namespace BankApp.Application.Interfaces.Repository;

public interface ICardRepository
{
    Task<Card> CreateCardAsync(Card card , CancellationToken ct);
    Task<Card?> GetCardByIdAsync(int userId , int cardId, CancellationToken ct);
    void UpdateBlockCardAsync(Card card , CancellationToken ct); 
    Task<bool> ExistsByNumberAsync(string number, CancellationToken ct); 

}