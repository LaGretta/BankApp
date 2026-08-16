using AutoMapper;
using BankApp.Application;
using BankApp.Application.DTO;
using BankApp.Application.Interfaces.Repository;
using BankApp.Application.Service;
using BankApp.Domain.Entities;
using BankApp.Domain.Enums;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace BankApp.Tests;

public class LoanServiceTests
{
    private readonly Mock<ILoanRepository> _loanRepo = new();
    private readonly Mock<IAccountRepository> _accountRepo = new();
    private readonly Mock<IUnitOfWork> _uow = new();
    private readonly Mock<IMapper> _mapper = new();
    private readonly Mock<ILogger<LoanService>> _logger = new();
    private readonly LoanService _sut;

    public LoanServiceTests()
    {
        _sut = new LoanService(
            _loanRepo.Object, _accountRepo.Object, _uow.Object, _mapper.Object, _logger.Object);
        _mapper.Setup(m => m.Map<LoanResponseDto>(It.IsAny<Loan>()))
               .Returns(new LoanResponseDto());
    }

    [Fact]
    public void Calculate_ReturnsPositivePayment_AndInterest()
    {
        var result = _sut.Calculate(new LoanCalculationDto { Principal = 12000, TermMonths = 12 });

        result.MonthlyPayment.Should().BeGreaterThan(0);
        result.MonthlyPayment.Should().BeInRange(1100, 1125);
        result.TotalToRepay.Should().BeApproximately(result.MonthlyPayment * 12, 0.01m);
        result.TotalInterest.Should().Be(Math.Round(result.TotalToRepay - 12000, 2));
        result.TotalInterest.Should().BeGreaterThan(0);
        result.AnnualRate.Should().Be(20);
    }

    [Fact]
    public void Calculate_InvalidParams_Throws()
    {
        var act = () => _sut.Calculate(new LoanCalculationDto { Principal = 0, TermMonths = 12 });
        act.Should().Throw<InvalidOperationException>();
    }

    [Fact]
    public async Task TakeLoan_CreditsAccount_AndGeneratesSchedule()
    {
        var account = new Account { Id = 10, Balance = 0, Currency = Currency.UAH };
        _accountRepo.Setup(r => r.GetMyAccountByIdAsync(1, 10, It.IsAny<CancellationToken>()))
                    .ReturnsAsync(account);

        Loan? captured = null;
        _loanRepo.Setup(r => r.CreateLoanAsync(It.IsAny<Loan>(), It.IsAny<CancellationToken>()))
                 .Callback<Loan, CancellationToken>((l, _) => captured = l);

        var dto = new CreateLoanDto { AccountId = 10, Principal = 12000, TermMonths = 12 };

        await _sut.TakeLoan(1, dto, CancellationToken.None);

        account.Balance.Should().Be(12000);
        captured.Should().NotBeNull();
        captured!.Payments.Should().HaveCount(12);
        _uow.Verify(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task TakeLoan_ScheduleSumsToTotal_AndLastPaymentClearsBalance()
    {
        var account = new Account { Id = 10, Balance = 0, Currency = Currency.UAH };
        _accountRepo.Setup(r => r.GetMyAccountByIdAsync(1, 10, It.IsAny<CancellationToken>()))
                    .ReturnsAsync(account);

        Loan? captured = null;
        _loanRepo.Setup(r => r.CreateLoanAsync(It.IsAny<Loan>(), It.IsAny<CancellationToken>()))
                 .Callback<Loan, CancellationToken>((l, _) => captured = l);

        await _sut.TakeLoan(1, new CreateLoanDto { AccountId = 10, Principal = 12000, TermMonths = 12 },
                            CancellationToken.None);

        var totalPrincipal = captured!.Payments.Sum(p => p.PrincipalPart);
        totalPrincipal.Should().Be(12000);

        foreach (var p in captured.Payments)
            p.Amount.Should().Be(Math.Round(p.PrincipalPart + p.InterestPart, 2));
    }

    [Fact]
    public async Task MakePayment_ReducesBalance_AndMarksPaid()
    {
        var payment = new LoanPayment { Id = 5, Amount = 1112, PrincipalPart = 912, InterestPart = 200, IsPaid = false, DueDate = DateTime.UtcNow };
        var loan = new Loan
        {
            Id = 1, AccountId = 10, Status = LoanStatus.Active,
            RemainingBalance = 13344,
            Payments = new List<LoanPayment> { payment }
        };
        var account = new Account { Id = 10, Balance = 5000, Currency = Currency.UAH };

        _loanRepo.Setup(r => r.GetMyLoanByIdAsync(1, 1, It.IsAny<CancellationToken>()))
                 .ReturnsAsync(loan);
        _loanRepo.Setup(r => r.GetNextUnpaidPaymentAsync(1, It.IsAny<CancellationToken>()))
                 .ReturnsAsync(payment);
        _accountRepo.Setup(r => r.GetMyAccountByIdAsync(1, 10, It.IsAny<CancellationToken>()))
                    .ReturnsAsync(account);

        await _sut.MakePayment(1, 1, CancellationToken.None);

        account.Balance.Should().Be(3888);      
        payment.IsPaid.Should().BeTrue();
        loan.RemainingBalance.Should().Be(0);       
        loan.Status.Should().Be(LoanStatus.Paid);
    }

    [Fact]
    public async Task MakePayment_InsufficientFunds_Throws()
    {
        var payment = new LoanPayment { Id = 5, Amount = 1112, IsPaid = false, DueDate = DateTime.UtcNow };
        var loan = new Loan { Id = 1, AccountId = 10, Status = LoanStatus.Active, RemainingBalance = 13344, Payments = new List<LoanPayment> { payment } };
        var account = new Account { Id = 10, Balance = 100, Currency = Currency.UAH }; 

        _loanRepo.Setup(r => r.GetMyLoanByIdAsync(1, 1, It.IsAny<CancellationToken>()))
                 .ReturnsAsync(loan);
        _loanRepo.Setup(r => r.GetNextUnpaidPaymentAsync(1, It.IsAny<CancellationToken>()))
                 .ReturnsAsync(payment);
        _accountRepo.Setup(r => r.GetMyAccountByIdAsync(1, 10, It.IsAny<CancellationToken>()))
                    .ReturnsAsync(account);

        var act = () => _sut.MakePayment(1, 1, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("Insufficient funds");
    }
}