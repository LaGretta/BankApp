using BankApp.Application.DTO;
using FluentValidation;

namespace BankApp.Application.Validator;

public class SetLimitDtoValidator : AbstractValidator<SetLimitDto>
{
    public SetLimitDtoValidator()
    {
        RuleFor(x => x.DailyLimit)
            .GreaterThan(0).When(x => x.DailyLimit.HasValue)
            .WithMessage("Limit must be positive");
    }
}