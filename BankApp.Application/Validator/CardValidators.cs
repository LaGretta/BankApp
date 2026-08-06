using BankApp.Application.DTO;
using FluentValidation;

namespace BankApp.Application.Validator;

public class CreateCardDtoValidator : AbstractValidator<CreateCardDto>
{
    public CreateCardDtoValidator()
    {
        RuleFor(x => x.AccountId).GreaterThan(0);
        RuleFor(x => x.CardType).IsInEnum().WithMessage("Invalid card type");
    }
}