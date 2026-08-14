using BankApp.Application.DTO;
using FluentValidation;

namespace BankApp.Application.Validator;

public class CreateJarDtoValidator : AbstractValidator<CreateJarDto>
{
    public CreateJarDtoValidator()
    {
        RuleFor(x => x.AccountId).GreaterThan(0);
        RuleFor(x => x.Name).NotEmpty().MaximumLength(50);
        RuleFor(x => x.IconKey).NotEmpty();
        RuleFor(x => x.TargetAmount).GreaterThan(0).WithMessage("Target must be positive");
    }
}

public class JarOperationDtoValidator : AbstractValidator<JarOperationDto>
{
    public JarOperationDtoValidator()
    {
        RuleFor(x => x.Amount).GreaterThan(0).WithMessage("Amount must be positive");
        RuleFor(x => x.IdempotencyKey).NotEmpty();
    }
}