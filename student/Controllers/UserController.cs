using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using student.data;
using student.DTOs;
using student.models;

namespace student.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class UserController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly PasswordHasher<User> _passwordHasher;

        public UserController(ApplicationDbContext context)
        {
            _context = context;
            _passwordHasher = new PasswordHasher<User>();
        }

        // ============================================
        // CREATE NEW USER
        // ============================================

        [HttpPost]
        public async Task<IActionResult> CreateUser(
            CreateUserRequest request)
        {
            // Username validation
            if (string.IsNullOrWhiteSpace(request.Username))
            {
                return BadRequest(new
                {
                    message = "Username is required."
                });
            }

            // Email validation
            if (string.IsNullOrWhiteSpace(request.Email))
            {
                return BadRequest(new
                {
                    message = "Email is required."
                });
            }

            // Password validation
            if (string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new
                {
                    message = "Password is required."
                });
            }

            if (request.Password.Length < 6)
            {
                return BadRequest(new
                {
                    message = "Password must be at least 6 characters."
                });
            }

            // Role validation
            var allowedRoles = new[]
            {
                "Admin",
                "Manager",
                "Staff",
                "Viewer"
            };

            if (!allowedRoles.Contains(request.Role))
            {
                return BadRequest(new
                {
                    message = "Invalid role."
                });
            }

            // Check duplicate username
            var usernameExists = await _context.Users
                .AnyAsync(u => u.Username == request.Username);

            if (usernameExists)
            {
                return BadRequest(new
                {
                    message = "Username already exists."
                });
            }

            // Check duplicate email
            var emailExists = await _context.Users
                .AnyAsync(u => u.Email == request.Email);

            if (emailExists)
            {
                return BadRequest(new
                {
                    message = "Email already exists."
                });
            }

            // Create user
            var user = new User
            {
                Username = request.Username,
                Email = request.Email,
                Role = request.Role
            };

            // Hash password
            user.PasswordHash = _passwordHasher.HashPassword(
                user,
                request.Password
            );

            // Save user
            _context.Users.Add(user);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "User created successfully.",
                user = new
                {
                    id = user.Id,
                    username = user.Username,
                    email = user.Email,
                    role = user.Role
                }
            });
        }


        // ============================================
        // GET ALL USERS
        // ============================================

        [HttpGet]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _context.Users
                .Select(u => new
                {
                    u.Id,
                    u.Username,
                    u.Email,
                    u.Role
                })
                .ToListAsync();

            return Ok(users);
        }


        // ============================================
        // DELETE USER
        // ============================================

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null)
            {
                return NotFound(new
                {
                    message = "User not found."
                });
            }

            // Prevent deleting the main admin
            if (user.Username == "admin")
            {
                return BadRequest(new
                {
                    message = "Main admin user cannot be deleted."
                });
            }

            _context.Users.Remove(user);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "User deleted successfully."
            });
        }
    }
}