using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using student.data;
using student.models;

namespace student.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class StudentController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        // Constructor
        // ApplicationDbContext is automatically provided by ASP.NET Core
        public StudentController(ApplicationDbContext context)
        {
            _context = context;
        }

        // =====================================================
        // GET: api/Student
        // Used to get all students
        // Allowed Roles: Admin, Manager, Staff, Viewer
        // =====================================================

        [Authorize(Roles = "Admin,Manager,Staff,Viewer")]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Student>>> GetStudents()
        {
            return await _context.Students.ToListAsync();
        }


        // =====================================================
        // POST: api/Student
        // Used to add a new student
        // Allowed Roles: Admin, Manager, Staff
        // =====================================================

        [Authorize(Roles = "Admin,Manager,Staff")]
        [HttpPost]
        public async Task<ActionResult<Student>> AddStudent(Student student)
        {
            _context.Students.Add(student);

            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetStudents),
                new { id = student.Id },
                student
            );
        }


        // =====================================================
        // PUT: api/Student/1
        // Used to update an existing student
        // Allowed Roles: Admin, Manager
        // =====================================================

        [Authorize(Roles = "Admin,Manager")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateStudent(
            int id,
            Student student)
        {
            // Check whether URL ID and student ID are the same
            if (id != student.Id)
            {
                return BadRequest();
            }

            // Find existing student from database
            var existingStudent = await _context.Students.FindAsync(id);

            // If student doesn't exist
            if (existingStudent == null)
            {
                return NotFound();
            }

            // Update student information
            existingStudent.Name = student.Name;
            existingStudent.Place = student.Place;
            existingStudent.Email = student.Email;
            existingStudent.MobileNumber = student.MobileNumber;
            existingStudent.Age = student.Age;
            existingStudent.Gender = student.Gender;
            existingStudent.Course = student.Course;
            existingStudent.College = student.College;
            existingStudent.Address = student.Address;

            // Save changes to SQL Server
            await _context.SaveChangesAsync();

            return NoContent();
        }


        // =====================================================
        // DELETE: api/Student/1
        // Used to delete an existing student
        // Allowed Role: Admin only
        // =====================================================

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteStudent(int id)
        {
            // Find student by ID
            var student = await _context.Students.FindAsync(id);

            // If student doesn't exist
            if (student == null)
            {
                return NotFound();
            }

            // Remove student
            _context.Students.Remove(student);

            // Save deletion to SQL Server
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}