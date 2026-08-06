using BankApp.Application.DTO;
using FluentValidation;

namespace BankApp.Application.Validator;

public class CreateAccountDtoValidator : AbstractValidator<CreateAccountDto>
{
    public CreateAccountDtoValidator()
    {
        RuleFor(x => x.Currency).IsInEnum().WithMessage("Invalid currency");
    }
}