namespace BankApp.Application.DTO;

public class AnalyticsSummaryDto
{
    public decimal TotalSpent { get; set; }
    public decimal TotalReceived { get; set; }
    public decimal Net { get; set; }                      
    public string Currency { get; set; } = string.Empty;  
    public List<AnalyticsBreakdownDto> Breakdown { get; set; } = new();
    public List<AnalyticsPointDto> Chart { get; set; } = new();
}

public class AnalyticsBreakdownDto
{
    public string Type { get; set; } = string.Empty; 
    public decimal Amount { get; set; }
}

public class AnalyticsPointDto
{
    public string Label { get; set; } = string.Empty; 
    public decimal Spent { get; set; }
    public decimal Received { get; set; }
}