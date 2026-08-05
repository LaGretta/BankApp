using AutoMapper;
using BankApp.Application.DTO;
using BankApp.Domain.Entities;

namespace BankApp.Application.Mapping;

public class AccountMapping : Profile
{
    public AccountMapping()
    {
        CreateMap<CreateAccountDto, Account>();
        CreateMap<Account, AccountResponseDto>();  
    }
}