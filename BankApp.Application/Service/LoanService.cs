using AutoMapper;
using BankApp.Application.DTO;
using BankApp.Application.Interfaces.Repository;
using BankApp.Application.Interfaces.Service;
using BankApp.Domain.Entities;
using BankApp.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace BankApp.Application.Service;

public class LoanService : ILoanService
{
    private const decimal AnnualRatePercent = 20m; 

    private readonly ILoanRepository _loanRepository;
    private readonly IAccountRepository _accountRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly ILogger<LoanService> _logger;

    public LoanService(
        ILoanRepository loanRepository,
        IAccountRepository accountRepository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        ILogger<LoanService> logger)
    {
        _loanRepository = loanRepository;
        _accountRepository = accountRepository;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _logger = logger;
    }

    private static decimal MonthlyRate() => AnnualRatePercent / 12m / 100m;
    private static decimal CalcMonthlyPayment(decimal principal, int months)
    {
        var i = MonthlyRate();
        if (i == 0) return Math.Round(principal / months, 2);

        var pow = (decimal)Math.Pow(1 + (double)i, months);
        var payment = principal * i * pow / (pow - 1);
        return Math.Round(payment, 2);
    }

    public LoanCalculationResultDto Calculate(LoanCalculationDto dto)
    {
        if (dto.Principal <= 0 || dto.TermMonths <= 0)
            throw new InvalidOperationException("Invalid loan parameters");

        var monthly = CalcMonthlyPayment(dto.Principal, dto.TermMonths);
        var total = Math.Round(monthly * dto.TermMonths, 2);

        return new LoanCalculationResultDto
        {
            MonthlyPayment = monthly,
            TotalToRepay = total,
            TotalInterest = Math.Round(total - dto.Principal, 2),
            AnnualRate = AnnualRatePercent
        };
    }

    public async Task<LoanResponseDto> TakeLoan(int userId, CreateLoanDto dto, CancellationToken ct)
    {
        if (dto.Principal <= 0 || dto.TermMonths <= 0)
            throw new InvalidOperationException("Invalid loan parameters");

        var account = await _accountRepository.GetMyAccountByIdAsync(userId, dto.AccountId, ct);
        if (account == null)
            throw new KeyNotFoundException("Account not found");

        var monthly = CalcMonthlyPayment(dto.Principal, dto.TermMonths);
        var now = DateTime.UtcNow;

        var loan = new Loan
        {
            UserId = userId,
            AccountId = dto.AccountId,
            Principal = dto.Principal,
            AnnualRate = AnnualRatePercent,
            TermMonths = dto.TermMonths,
            MonthlyPayment = monthly,
            RemainingBalance = Math.Round(monthly * dto.TermMonths, 2),
            Currency = account.Currency,
            Status = LoanStatus.Active,
            CreatedAt = now,
            NextPaymentDate = now.AddMonths(1)
        };

        var balance = dto.Principal;
        var i = MonthlyRate();
        for (var month = 1; month <= dto.TermMonths; month++)
        {
            var interestPart = Math.Round(balance * i, 2);
            var principalPart = Math.Round(monthly - interestPart, 2);

            if (month == dto.TermMonths)
            {
                principalPart = balance;
            }

            balance = Math.Round(balance - principalPart, 2);

            loan.Payments.Add(new LoanPayment
            {
                DueDate = now.AddMonths(month),
                Amount = Math.Round(principalPart + interestPart, 2),
                PrincipalPart = principalPart,
                InterestPart = interestPart,
                IsPaid = false
            });
        }

        await _unitOfWork.BeginTransactionAsync(ct);
        try
        {
            account.Balance += dto.Principal;

            await _loanRepository.CreateLoanAsync(loan, ct);
            await _unitOfWork.SaveChangesAsync(ct);
            await _unitOfWork.CommitTransactionAsync(ct);

            _logger.LogInformation("Loan issued: {Principal} for {Months}m to user {UserId}",
                dto.Principal, dto.TermMonths, userId);

            return _mapper.Map<LoanResponseDto>(loan);
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync(ct);
            throw;
        }
    }

    public async Task<List<LoanResponseDto>> GetMyLoans(int userId, CancellationToken ct)
    {
        var loans = await _loanRepository.GetMyLoansAsync(userId, ct);
        return _mapper.Map<List<LoanResponseDto>>(loans);
    }

    public async Task<LoanResponseDto> GetLoanById(int userId, int loanId, CancellationToken ct)
    {
        var loan = await _loanRepository.GetMyLoanByIdAsync(userId, loanId, ct);
        if (loan == null)
            throw new KeyNotFoundException("Loan not found");
        return _mapper.Map<LoanResponseDto>(loan);
    }

    public async Task<List<LoanPaymentResponseDto>> GetLoanSchedule(int userId, int loanId, CancellationToken ct)
    {
        var loan = await _loanRepository.GetMyLoanByIdAsync(userId, loanId, ct);
        if (loan == null)
            throw new KeyNotFoundException("Loan not found");
        return _mapper.Map<List<LoanPaymentResponseDto>>(
            loan.Payments.OrderBy(p => p.DueDate).ToList());
    }

    public async Task<LoanResponseDto> MakePayment(int userId, int loanId, CancellationToken ct)
    {
        var loan = await _loanRepository.GetMyLoanByIdAsync(userId, loanId, ct);
        if (loan == null)
            throw new KeyNotFoundException("Loan not found");
        if (loan.Status == LoanStatus.Paid)
            throw new InvalidOperationException("Loan is already paid off");

        var payment = await _loanRepository.GetNextUnpaidPaymentAsync(loanId, ct);
        if (payment == null)
            throw new InvalidOperationException("No pending payments");

        var account = await _accountRepository.GetMyAccountByIdAsync(userId, loan.AccountId, ct);
        if (account == null)
            throw new KeyNotFoundException("Account not found");
        if (account.Balance < payment.Amount)
            throw new InvalidOperationException("Insufficient funds");

        await _unitOfWork.BeginTransactionAsync(ct);
        try
        {
            account.Balance -= payment.Amount;
            payment.IsPaid = true;
            payment.PaidAt = DateTime.UtcNow;

            loan.RemainingBalance = Math.Round(loan.RemainingBalance - payment.Amount, 2);

            var next = loan.Payments
                .Where(p => !p.IsPaid && p.Id != payment.Id)
                .OrderBy(p => p.DueDate)
                .FirstOrDefault();

            if (next == null)
            {
                loan.Status = LoanStatus.Paid;
                loan.RemainingBalance = 0;
            }
            else
            {
                loan.NextPaymentDate = next.DueDate;
                loan.Status = LoanStatus.Active;
            }

            await _unitOfWork.SaveChangesAsync(ct);
            await _unitOfWork.CommitTransactionAsync(ct);

            _logger.LogInformation("Loan payment {Amount} on loan {LoanId} by user {UserId}",
                payment.Amount, loanId, userId);

            return _mapper.Map<LoanResponseDto>(loan);
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync(ct);
            throw;
        }
    }
}