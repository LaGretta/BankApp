using System.Security.Claims;
using BankApp.Application.Interfaces.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BankApp.API.Controllers;

[ApiController]
[Route("api/analytics")]
[Authorize]
public class AnalyticsController : ControllerBase
{
    private readonly IAnalyticsService _analyticsService;

    public AnalyticsController(IAnalyticsService analyticsService)
    {
        _analyticsService = analyticsService;
    }
    [HttpGet]
    public async Task<IActionResult> GetSummary(
        [FromQuery] string period = "month",
        CancellationToken ct = default)
    {
        var result = await _analyticsService.GetSummary(GetUserId(), period, ct);
        return Ok(result);
    }
    private int GetUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}