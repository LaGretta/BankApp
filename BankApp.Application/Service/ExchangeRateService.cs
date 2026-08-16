using System.Text.Json;
using BankApp.Application.Interfaces.Service;
using BankApp.Domain.Enums;
using Microsoft.Extensions.Caching.Memory;

namespace BankApp.Application.Service;

public class ExchangeRateService : IExchangeRateService
{
    private readonly HttpClient _httpClient;
    private readonly IMemoryCache _cache;

    private const string NbuUrl = "https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json";

    public ExchangeRateService(HttpClient httpClient, IMemoryCache cache)
    {
        _httpClient = httpClient;
        _cache = cache;
    }
    public async Task<decimal> GetRateToUahAsync(Currency currency, CancellationToken ct)
    {
        if (currency == Currency.UAH)
            return 1m;

        var cacheKey = $"rate_{currency}";

        if (_cache.TryGetValue(cacheKey, out decimal cachedRate))
            return cachedRate;
        var rates = await FetchRatesAsync(ct);

        var code = currency.ToString(); 
        var found = rates.FirstOrDefault(r => r.cc == code);
        if (found == null)
            throw new InvalidOperationException($"Rate for {code} not available");
        _cache.Set(cacheKey, found.rate, TimeSpan.FromHours(1));

        return found.rate;
    }

    private async Task<List<NbuRate>> FetchRatesAsync(CancellationToken ct)
    {
        var response = await _httpClient.GetAsync(NbuUrl, ct);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync(ct);
        var rates = JsonSerializer.Deserialize<List<NbuRate>>(json);

        return rates ?? new List<NbuRate>();
    }

    private class NbuRate
    {
        public string cc { get; set; } = string.Empty;  
        public decimal rate { get; set; }                
    }
}