namespace BankApp.Application.DTO;

public class CreateJarDto
{
    public int AccountId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string IconKey { get; set; } = string.Empty;
    public decimal TargetAmount { get; set; }
    public DateTime? TargetDate { get; set; }
}
public class JarOperationDto
{
    public decimal Amount { get; set; }
    public string IdempotencyKey { get; set; } = string.Empty;
}
public class JarResponseDto
{
    public int Id { get; set; }
    public int AccountId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string IconKey { get; set; } = string.Empty;
    public decimal TargetAmount { get; set; }
    public decimal CurrentAmount { get; set; }
    public string Currency { get; set; } = string.Empty;  
    public DateTime? TargetDate { get; set; }
    public bool IsClosed { get; set; }
    public DateTime CreatedAt { get; set; }
}
public class JarTransactionResponseDto
{
    public int Id { get; set; }
    public decimal Amount { get; set; }
    public string Type { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}