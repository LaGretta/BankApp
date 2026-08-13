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


    public TransactionService(
        ITransactionRepository transactionRepository
        , IMapper mapper
        , IUnitOfWork unitOfWork
        , ICardRepository cardRepository
        , ILogger<TransactionService> logger
        , IAccountRepository accountRepository)
    {
        _transactionRepository = transactionRepository;
        _mapper = mapper;
        _unitOfWork = unitOfWork;
        _cardRepository = cardRepository;
        _logger = logger;
        _accountRepository = accountRepository;
    }

    public async Task<TransactionResponseDto> Transfer(int userId, TransferDto dto, CancellationToken ct)
    {
        if (await _transactionRepository.ExistsByIdempotencyKeyAsync(dto.IdempotencyKey, ct))
            throw new InvalidOperationException("Duplicate transaction");
        var fromAccount = await _accountRepository.GetMyAccountByIdAsync(userId,dto.FromAccountId, ct);
        if (fromAccount == null)
            throw new KeyNotFoundException("From account not found");

        var toAccount = await _accountRepository.GetByIdAsync(dto.ToAccountId, ct);
        if (toAccount == null)
            throw new KeyNotFoundException("To account not found");
        if (fromAccount.Currency != toAccount.Currency)
            throw new InvalidOperationException("Currency mismatch");
        if (fromAccount.Balance < dto.Amount)
            throw new InvalidOperationException("Insufficient funds");
        
        await _unitOfWork.BeginTransactionAsync(ct);   
        try
        {
            fromAccount.Balance -= dto.Amount;  
            toAccount.Balance   += dto.Amount;  

            var transaction = new Transaction
            {
                FromAccountId   = dto.FromAccountId,
                ToAccountId     = dto.ToAccountId,
                Amount          = dto.Amount,
                Currency        = fromAccount.Currency,
                Type            = TransactionType.Transfer,
                Status          = TransactionStatus.Completed,
                Description     = dto.Description,
                CreatedAt       = DateTime.UtcNow,
                IdempotencyKey  = dto.IdempotencyKey  
            };
            
            await _transactionRepository.AddAsync(transaction, ct);

            await _unitOfWork.SaveChangesAsync(ct);       
            await _unitOfWork.CommitTransactionAsync(ct);

            _logger.LogInformation("Transfer {Amount} from {From} to {To}",
                dto.Amount, dto.FromAccountId, dto.ToAccountId);

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
        
        var fromAccount = await _accountRepository.GetMyAccountByIdAsync(userId,dto.FromAccountId, ct);
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
        if (fromAccount.Currency != toAccount.Currency)
            throw new InvalidOperationException("Currency mismatch");
        if (fromAccount.Balance < dto.Amount)
            throw new InvalidOperationException("Insufficient funds");
        
        await _unitOfWork.BeginTransactionAsync(ct);   
        try
        {
            fromAccount.Balance -= dto.Amount;  
            toAccount.Balance   += dto.Amount;  

            var transaction = new Transaction
            {
                FromAccountId   = dto.FromAccountId,
                ToAccountId     = toAccount.Id,
                Amount          = dto.Amount,
                Currency        = fromAccount.Currency,
                Type            = TransactionType.Transfer,
                Status          = TransactionStatus.Completed,
                Description     = dto.Description,
                CreatedAt       = DateTime.UtcNow,
                IdempotencyKey  = dto.IdempotencyKey  
            };
            
            await _transactionRepository.AddAsync(transaction, ct);

            await _unitOfWork.SaveChangesAsync(ct);       
            await _unitOfWork.CommitTransactionAsync(ct);
            _logger.LogInformation("TransferByCard {Amount} from account {From} to account {To}",
                dto.Amount, dto.FromAccountId, toAccount.Id);
            return _mapper.Map<TransactionResponseDto>(transaction);
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync(ct);
            throw;
        }
    }
}