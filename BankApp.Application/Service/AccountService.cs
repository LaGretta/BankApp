using AutoMapper;
using BankApp.Application.DTO;
using BankApp.Application.Interfaces.Repository;
using BankApp.Application.Interfaces.Service;
using BankApp.Domain.Entities;
using Microsoft.Extensions.Logging;

namespace BankApp.Application.Service;

public class AccountService : IAccountService
{
    private readonly IMapper _mapper;
    private readonly IAccountRepository _accountRepository;
    private readonly IUnitOfWork  _unitOfWork;
    private readonly ILogger<AccountService> _logger;


    public AccountService(
          IMapper mapper
        , IAccountRepository accountRepository
        , IUnitOfWork unitOfWork
        , ILogger<AccountService> logger)
    {
        _mapper = mapper;
        _accountRepository = accountRepository;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<List<AccountResponseDto>> GetMyAccounts(int userId, CancellationToken ct)
    {
         var get = await _accountRepository.GetAllMyAccounts(userId, ct);
         return _mapper.Map<List<AccountResponseDto>>(get);
    }
    public async Task<AccountResponseDto> GetAccountById(int userId, int id, CancellationToken ct)
    {
         var getbyId = await _accountRepository.GetMyAccountByIdAsync(userId, id, ct);
         if(getbyId == null)
             throw new KeyNotFoundException("Account not found");
         return _mapper.Map<AccountResponseDto>(getbyId);
    }

    public async Task<AccountResponseDto> CreateAccount(int userId, CreateAccountDto dto, CancellationToken ct)
    {
        var account = new Account
        {
            UserId = userId,
            Currency = dto.Currency,
            Balance = 0,
        };
        await _accountRepository.CreateAccountAsync(account, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        _logger.LogInformation("Account created: {AccountId} ({Currency}) for user {UserId}",
            account.Id, dto.Currency, userId);
        return _mapper.Map<AccountResponseDto>(account);
    }
} 
