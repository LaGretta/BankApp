using BankApp.Application.Interfaces.Service;
using Microsoft.AspNetCore.Mvc;

namespace BankApp.API.Controllers;


[ApiController]
[Route("api/accounts")]
public class AccountController : ControllerBase
{
    private readonly IAccountService _accountService;
    public AccountController(IAccountService accountService)
    {
        _accountService = accountService;
    }
    
    
    
    
    
    
    
    
}