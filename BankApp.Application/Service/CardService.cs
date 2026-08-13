using AutoMapper;
using BankApp.Application.DTO;
using BankApp.Application.Interfaces.Repository;
using BankApp.Application.Interfaces.Security;
using BankApp.Application.Interfaces.Service;
using BankApp.Domain.Entities;
using Microsoft.Extensions.Logging;

namespace BankApp.Application.Service;

public class CardService : ICardService
{
    private readonly ICardRepository _cardRepository;
    private readonly IMapper _mapper;
    private readonly ICardNumberGenerator _cardGenerator;
    private readonly ILogger<CardService> _logger;
    private readonly IAccountRepository  _accountRepository;
    private readonly IAuthRepository _authRepository;
    private readonly IUnitOfWork _unitOfWork;

    public CardService(
        ICardRepository cardRepository
        , IMapper mapper
        , ICardNumberGenerator cardGenerator
        , ILogger<CardService> logger
        , IAccountRepository accountRepository
        , IAuthRepository authRepository
        , IUnitOfWork unitOfWork)
    {
        _cardRepository = cardRepository;
        _mapper = mapper;
        _cardGenerator = cardGenerator;
        _logger = logger;
        _accountRepository = accountRepository;
        _authRepository = authRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<CardCreatedDto> CreateCard(int userId, CreateCardDto dto, CancellationToken ct)
    {
        var account = await _accountRepository.GetMyAccountByIdAsync(userId,dto.AccountId, ct);
        if (account == null)
           throw new KeyNotFoundException("Account not found");
        var user = await _authRepository.GetByIdAsync(userId, ct);
        if (user == null)
            throw new KeyNotFoundException("User not found");
        
        var holderName = $"{user.FirstName} {user.LastName}".ToUpper();
        
        string number;
        do
        {
            number = _cardGenerator.Generate();
        }
        while (await _cardRepository.ExistsByNumberAsync(number, ct));
        var cvv = Random.Shared.Next(100, 1000).ToString();
        
        var card = new Card
        {
            AccountId = dto.AccountId,
            CardType = dto.CardType,
            Number = number,
            Cvv = cvv,
            HolderName = holderName,
            ExpiryDate = DateTime.UtcNow.AddYears(4),
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };
        
        await _cardRepository.CreateCardAsync(card, ct);
        await _unitOfWork.SaveChangesAsync(ct);
        _logger.LogInformation("Card created: {CardId} for account {AccountId}", card.Id, dto.AccountId);
        
        return _mapper.Map<CardCreatedDto>(card);
    }

    public async Task<CardResponseDto> GetCardById(int userId, int id, CancellationToken ct)
    {
         var getcard = await _cardRepository.GetCardByIdAsync(userId, id, ct);
         if (getcard == null)
             throw new KeyNotFoundException("Card not found");
         return _mapper.Map<CardResponseDto>(getcard);
    }

    public async Task<CardResponseDto> BlockCard(int userId, int id, CancellationToken ct)
    {
        var getcard = await _cardRepository.GetCardByIdAsync(userId, id, ct);
        if (getcard == null)
            throw new KeyNotFoundException("Card not found");
        if (!getcard.IsActive)
            throw new InvalidOperationException("Card is already blocked");
        
        _cardRepository.UpdateBlockCardAsync(getcard, ct);
        await _unitOfWork.SaveChangesAsync(ct);
        _logger.LogWarning("Card blocked: {CardId}", id);
        return _mapper.Map<CardResponseDto>(getcard);
    }

    public async Task<string> GetCardCvv(int userId, int cardId, CancellationToken ct)
    {
        var getcard = await _cardRepository.GetCardByIdAsync(userId, cardId, ct);
        if (getcard == null)
            throw new KeyNotFoundException("Card not found");
        return getcard.Cvv;
    }
}