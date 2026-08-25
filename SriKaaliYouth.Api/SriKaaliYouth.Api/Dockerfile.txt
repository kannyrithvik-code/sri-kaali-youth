FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["SriKaaliYouth.Api.csproj", "./"]
RUN dotnet restore "SriKaaliYouth.Api.csproj"

COPY . .
RUN dotnet publish "SriKaaliYouth.Api.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://0.0.0.0:10000

EXPOSE 10000

ENTRYPOINT ["dotnet", "SriKaaliYouth.Api.dll"]