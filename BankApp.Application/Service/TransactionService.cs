using AutoMapper;
using BankApp.Application.DTO;
using BankApp.Application.Interfaces.Repository;
using BankApp.Application.Interfaces.Service;
using BankApp.Domain.Enums;
using Microsoft.Extensions.Logging;
using BankApp.Domain.Entities;



namespace BankApp.Application.Service;

public class TransactionService : ITransactionService
{
    private readonly ITransactionRepository _transactionRepository;
    private readonly IMapper _mapper;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICardRepository _cardRepository;
    private readonly ILogger<TransactionService> _logger;
    private readonly IAccountRepository _accountRepository;
    private readonly IExchangeRateService _exchangeRateService;


    public TransactionService(
        ITransactionRepository transactionRepository
        , IMapper mapper
        , IUnitOfWork unitOfWork
        , ICardRepository cardRepository
        , ILogger<TransactionService> logger
        , IAccountRepository accountRepository
        , IExchangeRateService exchangeRateService)
    {
        _transactionRepository = transactionRepository;
        _mapper = mapper;
        _unitOfWork = unitOfWork;
        _cardRepository = cardRepository;
        _logger = logger;
        _accountRepository = accountRepository;
        _exchangeRateService = exchangeRateService;
    }

public async Task<TransactionResponseDto> Transfer(int userId, TransferDto dto, CancellationToken ct)
{
    if (await _transactionRepository.ExistsByIdempotencyKeyAsync(dto.IdempotencyKey, ct))
        throw new InvalidOperationException("Duplicate transaction");

    var fromCard = await _cardRepository.GetCardByIdAsync(userId, dto.FromCardId, ct);
    if (fromCard == null)
        throw new KeyNotFoundException("Card not found");
    if (!fromCard.IsActive)
        throw new InvalidOperationException("Card is blocked");

    var fromAccount = fromCard.Account;
    if (fromAccount == null)
        throw new KeyNotFoundException("From account not found");

    var toAccount = await _accountRepository.GetByIdAsync(dto.ToAccountId, ct);
    if (toAccount == null)
        throw new KeyNotFoundException("To account not found");

    if (fromAccount.Id == toAccount.Id)
        throw new InvalidOperationException("Cannot transfer to the same account");
    if (fromAccount.Balance < dto.Amount)
        throw new InvalidOperationException("Insufficient funds");

    if (fromCard.DailyLimit.HasValue)
    {
        var spentToday = await _transactionRepository.GetTodaySpentByCardAsync(fromCard.Id, ct);
        if (spentToday + dto.Amount > fromCard.DailyLimit.Value)
            throw new InvalidOperationException("Daily card limit exceeded");
    }

    var debitAmount = dto.Amount;
    decimal creditAmount;
    if (fromAccount.Currency == toAccount.Currency)
    {
        creditAmount = debitAmount;
    }
    else
    {
        var fromRate = await _exchangeRateService.GetRateToUahAsync(fromAccount.Currency, ct);
        var toRate   = await _exchangeRateService.GetRateToUahAsync(toAccount.Currency, ct);
        creditAmount = debitAmount * fromRate / toRate;
    }

    await _unitOfWork.BeginTransactionAsync(ct);
    try
    {
        fromAccount.Balance -= debitAmount;
        toAccount.Balance   += creditAmount;

        var transaction = new Transaction
        {
            FromAccountId  = fromAccount.Id,
            ToAccountId    = dto.ToAccountId,
            CardId         = fromCard.Id,
            Amount         = debitAmount,
            Currency       = fromAccount.Currency,
            Type           = TransactionType.Transfer,
            Status         = TransactionStatus.Completed,
            Description    = dto.Description,
            CreatedAt      = DateTime.UtcNow,
            IdempotencyKey = dto.IdempotencyKey
        };

        await _transactionRepository.AddAsync(transaction, ct);

        await _unitOfWork.SaveChangesAsync(ct);
        await _unitOfWork.CommitTransactionAsync(ct);

        _logger.LogInformation("Transfer {Debit} {FromCur} -> {Credit} {ToCur}, card {Card}",
            debitAmount, fromAccount.Currency, creditAmount, toAccount.Currency, fromCard.Id);

        return _mapper.Map<TransactionResponseDto>(transaction);
    }
    catch
    {
        await _unitOfWork.RollbackTransactionAsync(ct);
        throw;
    }
}
    public async Task<TransactionResponseDto> TopUp(int userId, TopUpDto dto, CancellationToken ct)
    {
        if (await _transactionRepository.ExistsByIdempotencyKeyAsync(dto.IdempotencyKey, ct))
            throw new InvalidOperationException("Duplicate transaction");

        var card = await _cardRepository.GetByNumberAsync(dto.CardNumber, ct);
        if (card == null)
            throw new KeyNotFoundException("Card not found");
        
        if (!card.IsActive)
            throw new InvalidOperationException("Card is blocked");
        
        var account = card.Account;   
        if (account == null)
            throw new KeyNotFoundException("Account not found");
        
        await _unitOfWork.BeginTransactionAsync(ct);
        try
        {
            account.Balance += dto.Amount;  

            var transaction = new Transaction
            {
                FromAccountId  = null,             
                ToAccountId    = account.Id,       
                Amount         = dto.Amount,
                Currency       = account.Currency,
                Type           = TransactionType.TopUp,
                Status         = TransactionStatus.Completed,
                Description    = "Top up",
                CreatedAt      = DateTime.UtcNow,
                IdempotencyKey = dto.IdempotencyKey
            };
            await _transactionRepository.AddAsync(transaction, ct);

            await _unitOfWork.SaveChangesAsync(ct);
            await _unitOfWork.CommitTransactionAsync(ct);

            _logger.LogInformation("TopUp {Amount} to card {Card}", dto.Amount, dto.CardNumber);

            return _mapper.Map<TransactionResponseDto>(transaction);
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync(ct);
            throw;
        }
    }

    public async Task<PagedResponse<TransactionResponseDto>> GetHistory(int userId, int page, int pageSize, CancellationToken ct)
    {
        var (items, totalCount) = await _transactionRepository.GetMyTransactionsAsync(userId, page, pageSize, ct);
        var dtos = _mapper.Map<List<TransactionResponseDto>>(items);

        return new PagedResponse<TransactionResponseDto>
        {
            Items = dtos,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }
    public async Task<TransactionResponseDto> GetTransactionById(int userId, int transactionId, CancellationToken ct)
    {
        var get = await _transactionRepository.GetTransactionByIdAsync(userId, transactionId, ct);
        if (get == null)
            throw new KeyNotFoundException("Not found");
        return _mapper.Map<TransactionResponseDto>(get);
    }

public async Task<TransactionResponseDto> TransferByCard(int userId, TransferByCardDto dto, CancellationToken ct)
{
    if (await _transactionRepository.ExistsByIdempotencyKeyAsync(dto.IdempotencyKey, ct))
        throw new InvalidOperationException("Duplicate transaction");

    var fromCard = await _cardRepository.GetCardByIdAsync(userId, dto.FromCardId, ct);
    if (fromCard == null)
        throw new KeyNotFoundException("Card not found");
    if (!fromCard.IsActive)
        throw new InvalidOperationException("Card is blocked");

    var fromAccount = fromCard.Account;
    if (fromAccount == null)
        throw new KeyNotFoundException("From account not found");

    var toCard = await _cardRepository.GetByNumberAsync(dto.CardNumber, ct);
    if (toCard == null)
        throw new KeyNotFoundException("Card not found");
    if (!toCard.IsActive)
        throw new InvalidOperationException("Recipient card is blocked");

    var toAccount = toCard.Account;
    if (toAccount == null)
        throw new KeyNotFoundException("Account not found");

    if (fromAccount.Id == toAccount.Id)
        throw new InvalidOperationException("Cannot transfer to the same account");
    if (fromAccount.Balance < dto.Amount)
        throw new InvalidOperationException("Insufficient funds");

    if (fromCard.DailyLimit.HasValue)
    {
        var spentToday = await _transactionRepository.GetTodaySpentByCardAsync(fromCard.Id, ct);
        if (spentToday + dto.Amount > fromCard.DailyLimit.Value)
            throw new InvalidOperationException("Daily card limit exceeded");
    }

    var debitAmount = dto.Amount;
    decimal creditAmount;
    if (fromAccount.Currency == toAccount.Currency)
    {
        creditAmount = debitAmount;
    }
    else
    {
        var fromRate = await _exchangeRateService.GetRateToUahAsync(fromAccount.Currency, ct);
        var toRate   = await _exchangeRateService.GetRateToUahAsync(toAccount.Currency, ct);
        creditAmount = debitAmount * fromRate / toRate;
    }

    await _unitOfWork.BeginTransactionAsync(ct);
    try
    {
        fromAccount.Balance -= debitAmount;
        toAccount.Balance   += creditAmount;

        var transaction = new Transaction
        {
            FromAccountId  = fromAccount.Id,
            ToAccountId    = toAccount.Id,
            CardId         = fromCard.Id,
            Amount         = debitAmount,
            Currency       = fromAccount.Currency,
            Type           = TransactionType.Transfer,
            Status         = TransactionStatus.Completed,
            Description    = dto.Description,
            CreatedAt      = DateTime.UtcNow,
            IdempotencyKey = dto.IdempotencyKey
        };

        await _transactionRepository.AddAsync(transaction, ct);

        await _unitOfWork.SaveChangesAsync(ct);
        await _unitOfWork.CommitTransactionAsync(ct);

        _logger.LogInformation("TransferByCard {Debit} {FromCur} -> {Credit} {ToCur}, card {Card}",
            debitAmount, fromAccount.Currency, creditAmount, toAccount.Currency, fromCard.Id);

        return _mapper.Map<TransactionResponseDto>(transaction);
    }
    catch
    {
        await _unitOfWork.RollbackTransactionAsync(ct);
        throw;
    }
}
}