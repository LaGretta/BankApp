using BankApp.Application.Interfaces.Security;
using BankApp.Application.Security;

namespace BankApp.Infrastructure.Security;

public class CardNumberGenerator : ICardNumberGenerator
{
    private static readonly Random _random = new();

    public string Generate()
    {
        var digits = new int[16];

        digits[0] = 4;
        for (int i = 1; i < 15; i++)
            digits[i] = _random.Next(0, 10);

        digits[15] = CalculateCheckDigit(digits);

        return string.Concat(digits);
    }

    private static int CalculateCheckDigit(int[] digits)
    {
        int sum = 0;
        for (int i = 0; i < 15; i++)
        {
            int d = digits[i];
            if ((15 - i) % 2 == 1)   
            {
                d *= 2;
                if (d > 9) d -= 9;
            }
            sum += d;
        }
        int mod = sum % 10;
        return mod == 0 ? 0 : 10 - mod;
    }
}