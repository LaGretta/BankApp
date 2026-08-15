using AutoMapper;
using BankApp.Application.DTO;
using BankApp.Application.Interfaces.Repository;
using BankApp.Application.Interfaces.Security;
using BankApp.Application.Interfaces.Service;
using BankApp.Domain.Entities;
using BankApp.Domain.Enums;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace BankApp.Application.Service;

public class AuthService : IAuthService
{
    private readonly IAuthRepository _authRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;
    private readonly ILogger<AuthService> _logger;
    private readonly IRefreshTokenRepository _refreshTokenRepository;
    private readonly IConfiguration _configuration;
    
    public AuthService(
        IAuthRepository authRepository
        , IUnitOfWork unitOfWork
        , IMapper mapper
        , IPasswordHasher passwordHasher
        , IJwtTokenGenerator jwtTokenGenerator
        , ILogger<AuthService> logger
        , IRefreshTokenRepository refreshTokenRepository
        , IConfiguration configuration)
    {
        _authRepository = authRepository;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _passwordHasher = passwordHasher;
        _jwtTokenGenerator = jwtTokenGenerator;
        _logger = logger;
        _refreshTokenRepository = refreshTokenRepository;
        _configuration = configuration;
    }

    public async Task<AuthResponseDto> Register(RegisterDto registerDto, CancellationToken ct)
    {
        if (await _authRepository.ExistUserByEmailAsync(registerDto.Email, ct))
            throw new InvalidOperationException("Email already exists");

        var user = new User
        {
            FirstName = registerDto.FirstName,
            LastName =  registerDto.LastName,
            Email = registerDto.Email,
            PasswordHash = _passwordHasher.Hash(registerDto.Password),
            Role = Role.User,
            CreatedAt = DateTime.UtcNow
        };
        
        await _authRepository.CreateUserAsync(user , ct);
        await _unitOfWork.SaveChangesAsync(ct);
        _logger.LogInformation("New user registered: {Email}", user.Email);
        
        return await BuildAuthResponse(user, ct);
    }
    public async Task<AuthResponseDto> Login(LoginDto loginDto, CancellationToken ct)
    {
        var find = await _authRepository.GetUserByEmailAsync(loginDto.Email, ct);
        if (find == null || !_passwordHasher.Verify(loginDto.Password, find.PasswordHash))
        {
            _logger.LogWarning("Failed login attempt for {Email}", loginDto.Email);
            throw new UnauthorizedAccessException("Email or password is incorrect");
        }
        
        _logger.LogInformation("User logged in: {Email}", find.Email);
        return await BuildAuthResponse(find, ct);
    }
    private async Task<AuthResponseDto> BuildAuthResponse(User user, CancellationToken ct)
    {
        var response = _mapper.Map<AuthResponseDto>(user);
        response.Token = _jwtTokenGenerator.GenerateJwtToken(user);

        var refresh = new RefreshToken
        {
            Token = _jwtTokenGenerator.GenerateRefreshToken(),
            UserId = user.Id,
            ExpiresAt = DateTime.UtcNow.AddDays(
                int.Parse(_configuration["Jwt:RefreshTokenDays"]!)),
            IsRevoked = false,
            CreatedAt = DateTime.UtcNow
        };

        await _refreshTokenRepository.AddAsync(refresh, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        response.RefreshToken = refresh.Token;
        return response;
    }
    public async Task<AuthResponseDto> Refresh(RefreshRequestDto dto, CancellationToken ct)
    {
        var stored = await _refreshTokenRepository.GetByTokenAsync(dto.RefreshToken, ct);

        if (stored == null || stored.IsRevoked || stored.ExpiresAt < DateTime.UtcNow)
            throw new UnauthorizedAccessException("Invalid refresh token");

        var user = await _authRepository.GetByIdAsync(stored.UserId, ct);
        if (user == null)
            throw new UnauthorizedAccessException("Invalid refresh token");

        stored.IsRevoked = true;

        var response = await BuildAuthResponse(user, ct);
        return response;
    }
    public async Task Logout(RefreshRequestDto dto, CancellationToken ct)
    {
        var stored = await _refreshTokenRepository.GetByTokenAsync(dto.RefreshToken, ct);
        if (stored != null && !stored.IsRevoked)
        {
            stored.IsRevoked = true;
            await _unitOfWork.SaveChangesAsync(ct);
        }
    }
}