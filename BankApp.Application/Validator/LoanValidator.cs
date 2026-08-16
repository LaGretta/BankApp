using BankApp.Application.DTO;
using FluentValidation;

namespace BankApp.Application.Validator;

public class CreateLoanDtoValidator : AbstractValidator<CreateLoanDto>
{
    public CreateLoanDtoValidator()
    {
        RuleFor(x => x.AccountId).GreaterThan(0);
        RuleFor(x => x.Principal).GreaterThan(0).LessThanOrEqualTo(1_000_000)
            .WithMessage("Loan amount out of range");
        RuleFor(x => x.TermMonths).GreaterThan(0).LessThanOrEqualTo(60)
            .WithMessage("Term must be 1-60 months");
    }
}

public class LoanCalculationDtoValidator : AbstractValidator<LoanCalculationDto>
{
    public LoanCalculationDtoValidator()
    {
        RuleFor(x => x.Principal).GreaterThan(0).LessThanOrEqualTo(1_000_000);
        RuleFor(x => x.TermMonths).GreaterThan(0).LessThanOrEqualTo(60);
    }
}