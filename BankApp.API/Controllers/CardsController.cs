using System.Security.Claims;
using BankApp.Application.DTO;
using BankApp.Application.Interfaces.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BankApp.API.Controllers;

[ApiController]
[Route("api/cards")]
[Authorize]
public class CardsController : ControllerBase
{
    private readonly ICardService _cardService;

    public CardsController(ICardService cardService)
    {
        _cardService = cardService;
    }
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCardDto dto, CancellationToken ct)
    {
        var card = await _cardService.CreateCard(GetUserId(), dto, ct);
        return CreatedAtAction(nameof(GetById), new { id = card.Id }, card);
    }
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var card = await _cardService.GetCardById(GetUserId(), id, ct);
        return Ok(card);
    }
    [HttpPatch("{id:int}/block")]
    public async Task<IActionResult> Block(int id, CancellationToken ct)
    {
        var card = await _cardService.BlockCard(GetUserId(), id, ct);
        return Ok(card);
    }
    [HttpPatch("{id:int}/limit")]
    public async Task<IActionResult> SetLimit(int id, [FromBody] SetLimitDto dto, CancellationToken ct)
    {
        var card = await _cardService.SetDailyLimit(GetUserId(), id, dto.DailyLimit, ct);
        return Ok(card);
    }
    [HttpGet("{id:int}/cvv")]
    public async Task<IActionResult> GetCvv(int id, CancellationToken ct)
    {
        var cvv = await _cardService.GetCardCvv(GetUserId(), id, ct);
        return Ok(new { cvv });
    }
    [HttpGet("{id:int}/spent-today")]
    public async Task<IActionResult> GetSpentToday(int id, CancellationToken ct)
    {
        var spent = await _cardService.GetSpentToday(GetUserId(), id, ct);
        return Ok(new { spentToday = spent });
    }

    private int GetUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}