using System.Security.Claims;
using BankApp.Application.DTO;
using BankApp.Application.Interfaces.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BankApp.API.Controllers;

[Authorize]
[ApiController]
[Route("api/accounts")]
public class AccountController : ControllerBase
{
    private readonly IAccountService _accountService;
    public AccountController(IAccountService accountService)
    {
        _accountService = accountService;
    }
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAccountDto dto, CancellationToken ct)
    {
        var account = await _accountService.CreateAccount(GetUserId(), dto, ct);
        return CreatedAtAction(nameof(GetById), new { id = account.Id }, account);
    }
    [HttpGet]
    public async Task<IActionResult> GetMy(CancellationToken ct)
    {
        var accounts = await _accountService.GetMyAccounts(GetUserId(), ct);
        return Ok(accounts);
    }
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var account = await _accountService.GetAccountById(GetUserId(), id, ct);
        return Ok(account);
    }

    private int GetUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}