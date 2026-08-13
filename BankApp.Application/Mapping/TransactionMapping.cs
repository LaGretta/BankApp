using AutoMapper;
using BankApp.Application.DTO;
using BankApp.Domain.Entities;

namespace BankApp.Application.Mapping;

public class TransactionMapping : Profile
{
    public TransactionMapping()
    {
        CreateMap<Transaction, TransactionResponseDto>();
    }
}