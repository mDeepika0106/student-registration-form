using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Identity;
using student.data;
using student.DTOs;
using student.models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;

namespace student.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly PasswordHasher<User> _passwordHasher;

        // =====================================================
        // Constructor
        // =====================================================

        public AuthController(
            ApplicationDbContext context,
            IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
            _passwordHasher = new PasswordHasher<User>();
        }

        // =====================================================
        // POST: api/Auth/login
        // =====================================================

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginRequest request)
        {
            // -------------------------------------------------
            // Check whether username was provided
            // -------------------------------------------------

            if (string.IsNullOrWhiteSpace(request.Username))
            {
                return BadRequest(new
                {
                    message = "Username is required."
                });
            }

            // -------------------------------------------------
            // Check whether password was provided
            // -------------------------------------------------

            if (string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new
                {
                    message = "Password is required."
                });
            }

            // -------------------------------------------------
            // Find user in Users table
            // -------------------------------------------------

            var user = await _context.Users
                .FirstOrDefaultAsync(u =>
                    u.Username == request.Username);

            // -------------------------------------------------
            // User doesn't exist
            // -------------------------------------------------

            if (user == null)
            {
                return Unauthorized(new
                {
                    message = "Invalid username or password."
                });
            }

            // -------------------------------------------------
            // Verify password
            // -------------------------------------------------

            var passwordResult = _passwordHasher.VerifyHashedPassword(
                user,
                user.PasswordHash,
                request.Password
            );

            if (passwordResult == PasswordVerificationResult.Failed)
            {
                return Unauthorized(new
                {
                    message = "Invalid username or password."
                });
            }

            // -------------------------------------------------
            // Create JWT token
            // -------------------------------------------------

            var token = GenerateJwtToken(user);

            // -------------------------------------------------
            // Return login response
            // -------------------------------------------------

            return Ok(new LoginResponse
            {
                Token = token,
                Username = user.Username,
                Role = user.Role
            });
        }

        // =====================================================
        // Generate JWT Token
        // =====================================================

        private string GenerateJwtToken(User user)
        {
            var claims = new List<Claim>
            {
                // Username
                new Claim(
                    ClaimTypes.Name,
                    user.Username
                ),

                // User ID
                new Claim(
                    ClaimTypes.NameIdentifier,
                    user.Id.ToString()
                ),

                // Role
                new Claim(
                    ClaimTypes.Role,
                    user.Role
                )
            };

            // -------------------------------------------------
            // Get JWT settings from appsettings.json
            // -------------------------------------------------

            var key = _configuration["Jwt:Key"];

            var issuer = _configuration["Jwt:Issuer"];

            var audience = _configuration["Jwt:Audience"];

            var expiresInMinutes =
                _configuration.GetValue<int>(
                    "Jwt:ExpiresInMinutes"
                );

            // -------------------------------------------------
            // Create security key
            // -------------------------------------------------

            var securityKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(key!)
            );

            // -------------------------------------------------
            // Create signing credentials
            // -------------------------------------------------

            var credentials = new SigningCredentials(
                securityKey,
                SecurityAlgorithms.HmacSha256
            );

            // -------------------------------------------------
            // Create JWT token
            // -------------------------------------------------

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(
                    expiresInMinutes
                ),
                signingCredentials: credentials
            );

            // -------------------------------------------------
            // Convert token to string
            // -------------------------------------------------

            return new JwtSecurityTokenHandler()
                .WriteToken(token);
        }

        [Authorize]
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword(
           ChangePasswordRequest request)
        {
            var username = User.Identity?.Name;

            if (string.IsNullOrEmpty(username))
            {
                return Unauthorized(new
                {
                    message = "User is not logged in."
                });
            }

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Username == username);

            if (user == null)
            {
                return NotFound(new
                {
                    message = "User not found."
                });
            }

            var passwordResult =
                _passwordHasher.VerifyHashedPassword(
                    user,
                    user.PasswordHash,
                    request.CurrentPassword
                );

            if (passwordResult ==
                PasswordVerificationResult.Failed)
            {
                return BadRequest(new
                {
                    message = "Current password is incorrect."
                });
            }

            if (string.IsNullOrWhiteSpace(request.NewPassword))
            {
                return BadRequest(new
                {
                    message = "New password is required."
                });
            }

            if (request.NewPassword.Length < 6)
            {
                return BadRequest(new
                {
                    message = "New password must be at least 6 characters."
                });
            }

            if (request.NewPassword !=
                request.ConfirmNewPassword)
            {
                return BadRequest(new
                {
                    message = "New passwords do not match."
                });
            }

            user.PasswordHash =
                _passwordHasher.HashPassword(
                    user,
                    request.NewPassword
                );

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Password changed successfully."
            });
        }
    }
}