using BankApp.Application.DTO;
using FluentValidation;

namespace BankApp.Application.Validator;

public class TransferDtoValidator : AbstractValidator<TransferDto>
{
    public TransferDtoValidator()
    {
        RuleFor(x => x.FromAccountId).GreaterThan(0);
        RuleFor(x => x.ToAccountId).GreaterThan(0);
        RuleFor(x => x.Amount).GreaterThan(0).WithMessage("Amount must be positive");
        RuleFor(x => x.IdempotencyKey).NotEmpty();
        RuleFor(x => x)
            .Must(x => x.FromAccountId != x.ToAccountId)
            .WithMessage("Cannot transfer to the same account");
    }
}
public class TopUpDtoValidator : AbstractValidator<TopUpDto>
{
    public TopUpDtoValidator()
    {
        RuleFor(x => x.ToAccountId).GreaterThan(0);
        RuleFor(x => x.Amount).GreaterThan(0).WithMessage("Amount must be positive");
        RuleFor(x => x.IdempotencyKey).NotEmpty();
    }
}