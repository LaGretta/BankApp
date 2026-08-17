# ---- Build stage: .NET 10 SDK ----
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Restore first (leverages Docker layer cache: csproj/sln only)
COPY BankApp.sln .
COPY BankApp.API/*.csproj ./BankApp.API/
COPY BankApp.Application/*.csproj ./BankApp.Application/
COPY BankApp.Domain/*.csproj ./BankApp.Domain/
COPY BankApp.Infrastructure/*.csproj ./BankApp.Infrastructure/
COPY BankApp.Tests/*.csproj ./BankApp.Tests/
RUN dotnet restore

# Copy the rest of the source and publish the API in Release
COPY . .
RUN dotnet publish BankApp.API/BankApp.API.csproj -c Release -o /app/publish --no-restore

# ---- Runtime stage: ASP.NET 10 ----
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

EXPOSE 8080
ENTRYPOINT ["dotnet", "BankApp.API.dll"]
