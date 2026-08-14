using AutoMapper;
using BankApp.Application.DTO;
using BankApp.Application.Interfaces.Repository;
using BankApp.Application.Interfaces.Service;
using BankApp.Domain.Entities;
using BankApp.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace BankApp.Application.Service;

public class SavingsJarService : ISavingsJarService
{
    private readonly ISavingsJarRepository _savingsJarRepository;
    private readonly IAccountRepository  _accountRepository;
    private readonly IUnitOfWork  _unitOfWork;
    private readonly IMapper  _mapper;
    private readonly ILogger<SavingsJarService> _logger;


    public SavingsJarService(
        ISavingsJarRepository savingsJarRepository
        , IAccountRepository accountRepository
        , IUnitOfWork unitOfWork
        , IMapper mapper
        , ILogger<SavingsJarService> logger)
    {
        _savingsJarRepository = savingsJarRepository;
        _accountRepository = accountRepository;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<JarResponseDto> CreateJar(int userId, CreateJarDto dto, CancellationToken ct)
    {   
        var account = await _accountRepository.GetMyAccountByIdAsync(userId,dto.AccountId, ct);
        if (account == null)
            throw new KeyNotFoundException("Account not found");
        var jar = new SavingsJar
        {
            UserId       = userId,
            AccountId    = dto.AccountId,
            Name         = dto.Name,
            IconKey      = dto.IconKey,
            TargetAmount = dto.TargetAmount,
            TargetDate   = dto.TargetDate,
            Currency     = account.Currency,
            CurrentAmount = 0,
            CreatedAt    = DateTime.UtcNow,
        };
        await _savingsJarRepository.CreateJarAsync(jar, ct);
        await _unitOfWork.SaveChangesAsync(ct);
        _logger.LogInformation("Jar created: {JarId} '{Name}' for user {UserId}", jar.Id, jar.Name, userId);
        return _mapper.Map<JarResponseDto>(jar);
    }

    public async Task<List<JarResponseDto>> GetMyJars(int userId, CancellationToken ct)
    {
        var get = await _savingsJarRepository.GetMyJarsAsync(userId, ct);
        return _mapper.Map<List<JarResponseDto>>(get);
    }

    public async Task<JarResponseDto> GetJarById(int userId, int jarId, CancellationToken ct)
    {
        var get = await _savingsJarRepository.GetMyJarByIdAsync(userId, jarId, ct);
        if(get == null)
            throw new KeyNotFoundException("Jar not found");
        return _mapper.Map<JarResponseDto>(get);
    }
    public async Task<JarResponseDto> Deposit(int userId, int jarId, JarOperationDto dto, CancellationToken ct)
    {
        if (await _savingsJarRepository.ExistsByIdempotencyKeyAsync(dto.IdempotencyKey, ct))
            throw new InvalidOperationException("Duplicate transaction");
        
        var get = await _savingsJarRepository.GetMyJarByIdAsync(userId, jarId, ct);
        
        if(get == null)
            throw new KeyNotFoundException("Jar not found");
        if(get.IsClosed)
            throw new InvalidOperationException("Jar is closed");

        var getaccount = await _accountRepository.GetMyAccountByIdAsync(userId, get.AccountId, ct);
        
        if(getaccount == null)
            throw new KeyNotFoundException("Account not found");
        if (dto.Amount <= 0)
            throw new InvalidOperationException("Amount must be greater than zero");
        if (getaccount.Balance < dto.Amount)
            throw new InvalidOperationException("Insufficient funds");

        await _unitOfWork.BeginTransactionAsync(ct);
        try
        {
            getaccount.Balance -= dto.Amount;
            get.CurrentAmount += dto.Amount;

            var create = new JarTransaction
            {
                JarId = get.Id,
                Amount = dto.Amount,
                Type = JarTransactionType.Deposit,
                IdempotencyKey = dto.IdempotencyKey,
                CreatedAt = DateTime.UtcNow
            };

            await _savingsJarRepository.AddJarTransactionAsync(create, ct);
            await _unitOfWork.SaveChangesAsync(ct);
            await _unitOfWork.CommitTransactionAsync(ct);

            _logger.LogInformation("Jar deposit {Amount} to jar {JarId}", dto.Amount, jarId);

            return _mapper.Map<JarResponseDto>(get);
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync(ct);
            throw;
        }
    }

    public async Task<JarResponseDto> Withdraw(int userId, int jarId, JarOperationDto dto, CancellationToken ct)
    {
        if (await _savingsJarRepository.ExistsByIdempotencyKeyAsync(dto.IdempotencyKey, ct))
            throw new InvalidOperationException("Duplicate transaction");
        
        var get = await _savingsJarRepository.GetMyJarByIdAsync(userId, jarId, ct);
        
        if(get == null)
            throw new KeyNotFoundException("Jar not found");
        if(get.IsClosed)
            throw new InvalidOperationException("Jar is closed");
        

        var getaccount = await _accountRepository.GetMyAccountByIdAsync(userId, get.AccountId, ct);
        
        if(getaccount == null)
            throw new KeyNotFoundException("Account not found");
        if (dto.Amount <= 0)
            throw new InvalidOperationException("Amount must be greater than zero");
        if (get.CurrentAmount < dto.Amount)
            throw new InvalidOperationException("Insufficient funds in jar");

        await _unitOfWork.BeginTransactionAsync(ct);
        try
        {
            
            get.CurrentAmount -= dto.Amount;
            getaccount.Balance += dto.Amount;

            var create = new JarTransaction
            {
                JarId = get.Id,
                Amount = dto.Amount,
                Type = JarTransactionType.Withdraw,
                IdempotencyKey = dto.IdempotencyKey,
                CreatedAt = DateTime.UtcNow
            };

            await _savingsJarRepository.AddJarTransactionAsync(create, ct);
            await _unitOfWork.SaveChangesAsync(ct);
            await _unitOfWork.CommitTransactionAsync(ct);

            _logger.LogInformation("Jar withdraw {Amount} from jar {JarId}", dto.Amount, jarId);

            return _mapper.Map<JarResponseDto>(get);
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync(ct);
            throw;
        }
    }
    public async Task<JarResponseDto> CloseJar(int userId, int jarId, CancellationToken ct)
    {
        var get = await _savingsJarRepository.GetMyJarByIdAsync(userId, jarId, ct);
        if(get == null)
            throw new KeyNotFoundException("Jar not found");
        if(get.IsClosed)
            throw new InvalidOperationException("Jar is closed");
        
        var getaccount = await _accountRepository.GetMyAccountByIdAsync(userId, get.AccountId, ct);
        if(getaccount == null)
            throw new KeyNotFoundException("Account not found");
        
        var amount = get.CurrentAmount;

        await _unitOfWork.BeginTransactionAsync(ct);
        try
        {
            getaccount.Balance += amount;
            get.CurrentAmount = 0;        
            get.IsClosed = true;

            if (amount > 0)
            {
                var create = new JarTransaction
                {
                    JarId = get.Id,
                    Amount = amount,
                    Type = JarTransactionType.Withdraw,
                    IdempotencyKey = Guid.NewGuid().ToString(),
                    CreatedAt = DateTime.UtcNow
                };
                await _savingsJarRepository.AddJarTransactionAsync(create, ct);
            }
            await _unitOfWork.SaveChangesAsync(ct);
            await _unitOfWork.CommitTransactionAsync(ct);
            _logger.LogInformation("Jar closed {JarId}, returned {Amount}", jarId, amount);
            return _mapper.Map<JarResponseDto>(get);
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync(ct);
            throw;
        }
    }
    public async Task<List<JarTransactionResponseDto>> GetJarHistory(int userId, int jarId, CancellationToken ct)
    {
        var get = await _savingsJarRepository.GetMyJarByIdAsync(userId, jarId, ct);
        if(get == null)
            throw new KeyNotFoundException("Jar not found");
        var operation = await _savingsJarRepository.GetJarTransactionsAsync(jarId, ct);
        return _mapper.Map<List<JarTransactionResponseDto>>(operation);
    }
}