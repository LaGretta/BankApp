using BankApp.Application.DTO;

namespace BankApp.Application.Interfaces.Service;

public interface ILoanService
{
    LoanCalculationResultDto Calculate(LoanCalculationDto dto);
    Task<LoanResponseDto> TakeLoan(int userId, CreateLoanDto dto, CancellationToken ct);
    Task<List<LoanResponseDto>> GetMyLoans(int userId, CancellationToken ct);
    Task<LoanResponseDto> GetLoanById(int userId, int loanId, CancellationToken ct);
    Task<List<LoanPaymentResponseDto>> GetLoanSchedule(int userId, int loanId, CancellationToken ct);
    Task<LoanResponseDto> MakePayment(int userId, int loanId, CancellationToken ct);
}