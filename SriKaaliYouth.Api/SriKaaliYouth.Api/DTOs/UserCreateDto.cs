namespace SriKaaliYouth.Api.DTOs
{
    public class UserCreateDto
    {
        public string Name { get; set; } = string.Empty;
        public string? MobileNumber { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Role { get; set; } = "Member";
    }
}