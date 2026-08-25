namespace SriKaaliYouth.Api.DTOs
{
    public class RegisterRequestDto
    {
        public string Name { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public string? MobileNumber { get; set; }
        public string Password { get; set; } = string.Empty;
    }
}
