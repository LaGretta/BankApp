using AutoMapper;
using BankApp.Application.DTO;
using BankApp.Domain.Entities;

namespace BankApp.Application.Mapping;

public class SavingsJarMapping : Profile
{
    public SavingsJarMapping()
    {
        CreateMap<SavingsJar, JarResponseDto>();
        CreateMap<JarTransaction, JarTransactionResponseDto>();
    }
}