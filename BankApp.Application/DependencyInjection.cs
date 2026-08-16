using System.Reflection;
using BankApp.Application.Interfaces.Service;
using BankApp.Application.Service;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;

namespace BankApp.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IAccountService, AccountService>();
        services.AddScoped<ICardService, CardService>();
        services.AddScoped<ITransactionService, TransactionService>();
        services.AddScoped<ISavingsJarService, SavingsJarService>();
        services.AddMemoryCache();
        services.AddHttpClient<IExchangeRateService, ExchangeRateService>();
        services.AddScoped<ILoanService, LoanService>();
        services.AddScoped<IAnalyticsService, AnalyticsService>();


        services.AddAutoMapper(cfg => cfg.AddMaps(Assembly.GetExecutingAssembly()));
        services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());
        return services;
    }
}