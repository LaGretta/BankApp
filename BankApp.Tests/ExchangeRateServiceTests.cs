using System.Net;
using System.Text;
using BankApp.Application.Service;
using BankApp.Domain.Enums;
using FluentAssertions;
using Microsoft.Extensions.Caching.Memory;
using Xunit;

namespace BankApp.Tests;

public class ExchangeRateServiceTests
{
    private class FakeHandler : HttpMessageHandler
    {
        public int Calls { get; private set; }
        private readonly string _json;
        public FakeHandler(string json) => _json = json;

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Calls++;
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(_json, Encoding.UTF8, "application/json")
            });
        }
    }

    private const string NbuJson =
        "[{\"cc\":\"USD\",\"rate\":41.5},{\"cc\":\"EUR\",\"rate\":44.8}]";

    private static ExchangeRateService MakeSut(FakeHandler handler)
    {
        var httpClient = new HttpClient(handler);
        var cache = new MemoryCache(new MemoryCacheOptions());
        return new ExchangeRateService(httpClient, cache);
    }

    [Fact]
    public async Task GetRate_Uah_ReturnsOne_WithoutHttpCall()
    {
        var handler = new FakeHandler(NbuJson);
        var sut = MakeSut(handler);

        var rate = await sut.GetRateToUahAsync(Currency.UAH, CancellationToken.None);

        rate.Should().Be(1m);
        handler.Calls.Should().Be(0);
    }

    [Fact]
    public async Task GetRate_Usd_ReturnsRateFromNbu()
    {
        var handler = new FakeHandler(NbuJson);
        var sut = MakeSut(handler);

        var rate = await sut.GetRateToUahAsync(Currency.USD, CancellationToken.None);

        rate.Should().Be(41.5m);
    }

    [Fact]
    public async Task GetRate_Cached_SecondCall_DoesNotHitHttpAgain()
    {
        var handler = new FakeHandler(NbuJson);
        var sut = MakeSut(handler);

        await sut.GetRateToUahAsync(Currency.USD, CancellationToken.None);
        await sut.GetRateToUahAsync(Currency.USD, CancellationToken.None);

        handler.Calls.Should().Be(1);  
    }
}