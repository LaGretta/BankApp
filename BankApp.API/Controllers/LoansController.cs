using System.Security.Claims;
using BankApp.Application.DTO;
using BankApp.Application.Interfaces.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BankApp.API.Controllers;

[ApiController]
[Route("api/loans")]
[Authorize]
public class LoansController : ControllerBase
{
    private readonly ILoanService _loanService;

    public LoansController(ILoanService loanService)
    {
        _loanService = loanService;
    }

    [HttpPost("calculate")]
    public IActionResult Calculate([FromBody] LoanCalculationDto dto)
    {
        var result = _loanService.Calculate(dto);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Take([FromBody] CreateLoanDto dto, CancellationToken ct)
    {
        var loan = await _loanService.TakeLoan(GetUserId(), dto, ct);
        return CreatedAtAction(nameof(GetById), new { id = loan.Id }, loan);
    }

    [HttpGet]
    public async Task<IActionResult> GetMy(CancellationToken ct)
    {
        var loans = await _loanService.GetMyLoans(GetUserId(), ct);
        return Ok(loans);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var loan = await _loanService.GetLoanById(GetUserId(), id, ct);
        return Ok(loan);
    }

    [HttpGet("{id:int}/schedule")]
    public async Task<IActionResult> GetSchedule(int id, CancellationToken ct)
    {
        var schedule = await _loanService.GetLoanSchedule(GetUserId(), id, ct);
        return Ok(schedule);
    }

    [HttpPost("{id:int}/pay")]
    public async Task<IActionResult> Pay(int id, CancellationToken ct)
    {
        var loan = await _loanService.MakePayment(GetUserId(), id, ct);
        return Ok(loan);
    }

    private int GetUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}