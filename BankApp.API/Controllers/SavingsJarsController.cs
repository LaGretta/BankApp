using System.Security.Claims;
using BankApp.Application.DTO;
using BankApp.Application.Interfaces.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BankApp.API.Controllers;

[ApiController]
[Route("api/jars")]
[Authorize]
public class SavingsJarsController : ControllerBase
{
    private readonly ISavingsJarService _jarService;

    public SavingsJarsController(ISavingsJarService jarService)
    {
        _jarService = jarService;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateJarDto dto, CancellationToken ct)
    {
        var jar = await _jarService.CreateJar(GetUserId(), dto, ct);
        return CreatedAtAction(nameof(GetById), new { id = jar.Id }, jar);
    }

    [HttpGet]
    public async Task<IActionResult> GetMy(CancellationToken ct)
    {
        var jars = await _jarService.GetMyJars(GetUserId(), ct);
        return Ok(jars);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var jar = await _jarService.GetJarById(GetUserId(), id, ct);
        return Ok(jar);
    }

    [HttpPost("{id:int}/deposit")]
    public async Task<IActionResult> Deposit(int id, [FromBody] JarOperationDto dto, CancellationToken ct)
    {
        var jar = await _jarService.Deposit(GetUserId(), id, dto, ct);
        return Ok(jar);
    }

    [HttpPost("{id:int}/withdraw")]
    public async Task<IActionResult> Withdraw(int id, [FromBody] JarOperationDto dto, CancellationToken ct)
    {
        var jar = await _jarService.Withdraw(GetUserId(), id, dto, ct);
        return Ok(jar);
    }
    [HttpPost("{id:int}/close")]
    public async Task<IActionResult> Close(int id, CancellationToken ct)
    {
        var jar = await _jarService.CloseJar(GetUserId(), id, ct);
        return Ok(jar);
    }
    [HttpGet("{id:int}/history")]
    public async Task<IActionResult> GetHistory(int id, CancellationToken ct)
    {
        var history = await _jarService.GetJarHistory(GetUserId(), id, ct);
        return Ok(history);
    }
    private int GetUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}