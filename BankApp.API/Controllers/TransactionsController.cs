using System.Security.Claims;
using BankApp.Application.DTO;
using BankApp.Application.Interfaces.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BankApp.API.Controllers;

[ApiController]
[Route("api/transactions")]
[Authorize]
public class TransactionsController : ControllerBase
{
    private readonly ITransactionService _transactionService;

    public TransactionsController(ITransactionService transactionService)
    {
        _transactionService = transactionService;
    }
    [HttpPost("transfer")]
    public async Task<IActionResult> Transfer([FromBody] TransferDto dto, CancellationToken ct)
    {
        var result = await _transactionService.Transfer(GetUserId(), dto, ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }
    [HttpPost("topup")]
    public async Task<IActionResult> TopUp([FromBody] TopUpDto dto, CancellationToken ct)
    {
        var result = await _transactionService.TopUp(GetUserId(), dto, ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }
    [HttpGet]
    public async Task<IActionResult> GetHistory(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var result = await _transactionService.GetHistory(GetUserId(), page, pageSize, ct);
        return Ok(result);
    }
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var result = await _transactionService.GetTransactionById(GetUserId(), id, ct);
        return Ok(result);
    }
    [HttpPost("transfer-by-card")]
    public async Task<IActionResult> TransferByCard([FromBody] TransferByCardDto dto, CancellationToken ct)
    {
        var result = await _transactionService.TransferByCard(GetUserId(), dto, ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    
    
    

    private int GetUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}