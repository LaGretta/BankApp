using System.Transactions;
using AutoMapper;
using BankApp.Application.DTO;

namespace BankApp.Application.Mapping;

public class TransactionMapping : Profile
{
    public TransactionMapping()
    {
        CreateMap<Transaction, TransactionResponseDto>();
    }
}