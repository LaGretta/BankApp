using BankApp.Application.Interfaces.Service;
using BankApp.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BankApp.API.Controllers;

[ApiController]
[Route("api/rates")]
[Authorize]
public class RatesController : ControllerBase
{
    private readonly IExchangeRateService _exchangeRateService;

    public RatesController(IExchangeRateService exchangeRateService)
    {
        _exchangeRateService = exchangeRateService;
    }

    [HttpGet("{currency}")]
    public async Task<IActionResult> GetRate(Currency currency, CancellationToken ct)
    {
        var rate = await _exchangeRateService.GetRateToUahAsync(currency, ct);
        return Ok(new { currency = currency.ToString(), rateToUah = rate });
    }
}