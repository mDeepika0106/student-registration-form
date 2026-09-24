namespace student.models
{
    public class Student
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public string Place { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string MobileNumber { get; set; } = string.Empty;

        public int Age { get; set; }

        public string Gender { get; set; } = string.Empty;          

        public string Course { get; set; } = string.Empty;

        public string College { get; set; } = string.Empty;

        public string Address { get; set; } = string.Empty;
    }
}