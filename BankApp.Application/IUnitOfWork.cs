namespace BankApp.Application;

public interface IUnitOfWork
{
    Task<int> SaveChangesAsync(CancellationToken ct);
}