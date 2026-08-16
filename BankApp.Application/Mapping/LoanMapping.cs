using AutoMapper;
using BankApp.Application.DTO;
using BankApp.Domain.Entities;

namespace BankApp.Application.Mapping;

public class LoanMapping : Profile
{
    public LoanMapping()
    {
        CreateMap<Loan, LoanResponseDto>();
        CreateMap<LoanPayment, LoanPaymentResponseDto>();
    }
}