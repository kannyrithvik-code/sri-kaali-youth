namespace SriKaaliYouth.Api.DTOs
{
    public class UserUpdateDto
    {
        public string Name { get; set; } = string.Empty;

        public string? MobileNumber { get; set; }

        public string Username { get; set; } = string.Empty;

        public string? Password { get; set; }

        public string Role { get; set; } = "Member";

        public bool IsActive { get; set; } = true;
    }
}