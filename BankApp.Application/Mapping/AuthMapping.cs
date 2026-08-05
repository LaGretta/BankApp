using AutoMapper;
using BankApp.Application.DTO;
using BankApp.Domain.Entities;

namespace BankApp.Application.Mapping;

public class AuthMapping : Profile
{
    public AuthMapping()
    {
        CreateMap<RegisterDto, User>();
        CreateMap<User, AuthResponseDto>();
    }
}