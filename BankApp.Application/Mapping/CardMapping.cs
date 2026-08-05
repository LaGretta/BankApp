using AutoMapper;
using BankApp.Application.DTO;
using BankApp.Domain.Entities;

namespace BankApp.Application.Mapping;

public class CardMapping : Profile
{
    public CardMapping()
    {
        CreateMap<Card, CardResponseDto>();
        CreateMap<Card, CardCreatedDto>();

    }
}