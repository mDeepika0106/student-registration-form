import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import axios from "axios";
import "./App.css";

// ---------------- SKELETON LOADER ----------------
function StudentSkeleton() {
  return (
    <div className="skeleton-container">

      <div className="skeleton-line skeleton-small"></div>
      <div className="skeleton-line"></div>
      <div className="skeleton-line"></div>
      <div className="skeleton-line"></div>
      <div className="skeleton-line"></div>

    </div>
  );
}

function App() {

  // ---------------- LOGIN ----------------
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Hard-coded credentials
  const correctUsername = "admin";
  const correctPassword = "12345";

  const [loginError, setLoginError] = useState("");

  // ---------------- STUDENT FORM ----------------
  const [student, setStudent] = useState({
    name: "",
    place: "",
    age: "",
    mobile: "",
    email: "",
    gender: "",
    course: "",
    college: "",
    address: "",
  });

  // Store all students
  const [students, setStudents] = useState([]);

  // Track which student is being edited
  const [editingId, setEditingId] = useState(null);

  // ---------------- LOADING STATE ----------------
  const [loading, setLoading] = useState(true);

  // ---------------- GET STUDENTS FROM C# API ----------------
  useEffect(() => {

    const fetchStudents = async () => {

      try {

        setLoading(true);

        const response = await axios.get(
          "https://localhost:7240/api/Student"
        );

        setStudents(response.data);

      } catch (error) {

        console.log("Error fetching students:", error);

      } finally {

        // Whether API succeeds or fails,
        // loading should stop
        setLoading(false);

      }
    };

    fetchStudents();

  }, []);


  // ---------------- HANDLE LOGIN ----------------
  const handleLogin = (e) => {

    e.preventDefault();

    if (
      username === correctUsername &&
      password === correctPassword
    ) {

      setIsLoggedIn(true);
      setLoginError("");

    } else {

      setLoginError("Invalid username or password");

    }
  };


  // ---------------- HANDLE INPUT CHANGES ----------------
  const handleChange = (e) => {

    setStudent({
      ...student,
      [e.target.name]: e.target.value,
    });

  };


  // ---------------- ADD / UPDATE STUDENT ----------------
  const handleSubmit = async (e) => {

    e.preventDefault();

    try {

      const studentData = {
        name: student.name,
        place: student.place,
        email: student.email,
        mobileNumber: student.mobile,
        age: Number(student.age),
        gender: student.gender,
        course: student.course,
        college: student.college,
        address: student.address,
      };


      // ---------------- EDIT / UPDATE ----------------
      if (editingId !== null) {

        await axios.put(
          `https://localhost:7240/api/Student/${editingId}`,
          {
            id: editingId,
            ...studentData,
          }
        );

        // Update the student in React table
        setStudents((currentStudents) =>
          currentStudents.map((item) =>
            item.id === editingId
              ? { id: editingId, ...studentData }
              : item
          )
        );

        alert("Student updated successfully!");

        // Exit edit mode
        setEditingId(null);

      }

      // ---------------- ADD NEW STUDENT ----------------
      else {

        const response = await axios.post(
          "https://localhost:7240/api/Student",
          studentData
        );

        // Add new student to React table
        setStudents((currentStudents) => [
          ...currentStudents,
          response.data,
        ]);

        alert("Student added successfully!");

      }


      // ---------------- CLEAR FORM ----------------
      setStudent({
        name: "",
        place: "",
        age: "",
        mobile: "",
        email: "",
        gender: "",
        course: "",
        college: "",
        address: "",
      });

    } catch (error) {

      console.log("Error saving student:", error);
      alert("Failed to save student");

    }
  };


  // ---------------- DELETE STUDENT ----------------
  const handleDelete = async (id) => {

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this student?"
    );

    if (!confirmDelete) {
      return;
    }

    try {

      await axios.delete(
        `https://localhost:7240/api/Student/${id}`
      );

      // Remove student from React table
      setStudents((currentStudents) =>
        currentStudents.filter(
          (student) => student.id !== id
        )
      );

      alert("Student deleted successfully!");

    } catch (error) {

      console.log("Error deleting student:", error);
      alert("Failed to delete student");

    }
  };


  // ---------------- HANDLE EDIT ----------------
  const handleEdit = (item) => {

    setStudent({
      name: item.name,
      place: item.place,
      age: item.age,
      mobile: item.mobileNumber,
      email: item.email,
      gender: item.gender,
      course: item.course,
      college: item.college,
      address: item.address,
    });

    setEditingId(item.id);

  };


  // ---------------- LOGOUT ----------------
  const handleLogout = () => {

    setIsLoggedIn(false);
    setUsername("");
    setPassword("");

  };


  // ---------------- LOGIN PAGE ----------------
  if (!isLoggedIn) {

    return (
      <div className="login-container">

        <div className="login-box">

          <h1>Student Management</h1>

          <h2>Login</h2>

          <form onSubmit={handleLogin}>

            <label>Username</label>

            <input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <label>Password</label>

            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {loginError && (
              <p className="error">
                {loginError}
              </p>
            )}

            <button type="submit">
              Login
            </button>

          </form>

          <div className="credentials">

            <p>
              <b>Username:</b> admin
            </p>

            <p>
              <b>Password:</b> 12345
            </p>

          </div>

        </div>

      </div>
    );
  }


  // ---------------- REGISTRATION PAGE ----------------
  return (

    <div className="main-container">

      {/* Header */}
      <div className="header">

        <h1>Student Registration</h1>

        <button
          className="logout-button"
          onClick={handleLogout}
        >
          Logout
        </button>

      </div>


      {/* ---------------- REGISTRATION FORM ---------------- */}
      <div className="form-box">

        <h2>Enter Student Details</h2>

        <form onSubmit={handleSubmit}>

          <div className="form-grid">

            {/* Name */}
            <div className="form-group">

              <label>Student Name *</label>

              <input
                type="text"
                name="name"
                value={student.name}
                onChange={handleChange}
                placeholder="Enter student name"
                required
              />

            </div>


            {/* Place */}
            <div className="form-group">

              <label>Place *</label>

              <input
                type="text"
                name="place"
                value={student.place}
                onChange={handleChange}
                placeholder="Enter place"
                required
              />

            </div>


            {/* Age */}
            <div className="form-group">

              <label>Age *</label>

              <input
                type="number"
                name="age"
                value={student.age}
                onChange={handleChange}
                placeholder="Enter age"
                required
              />

            </div>


            {/* Mobile */}
            <div className="form-group">

              <label>Mobile Number *</label>

              <input
                type="tel"
                name="mobile"
                value={student.mobile}
                onChange={handleChange}
                placeholder="Enter mobile number"
                required
              />

            </div>


            {/* Email */}
            <div className="form-group">

              <label>Email *</label>

              <input
                type="email"
                name="email"
                value={student.email}
                onChange={handleChange}
                placeholder="Enter email"
                required
              />

            </div>


            {/* Gender */}
            <div className="form-group">

              <label>Gender *</label>

              <select
                name="gender"
                value={student.gender}
                onChange={handleChange}
                required
              >

                <option value="">
                  Select Gender
                </option>

                <option value="Male">
                  Male
                </option>

                <option value="Female">
                  Female
                </option>

                <option value="Other">
                  Other
                </option>

              </select>

            </div>


            {/* Course */}
            <div className="form-group">

              <label>Course *</label>

              <select
                name="course"
                value={student.course}
                onChange={handleChange}
                required
              >

                <option value="">
                  Select Course
                </option>

                <option value="B.Tech">
                  B.Tech
                </option>

                <option value="B.Sc">
                  B.Sc
                </option>

                <option value="B.Com">
                  B.Com
                </option>

                <option value="BCA">
                  BCA
                </option>

                <option value="MCA">
                  MCA
                </option>

                <option value="MBA">
                  MBA
                </option>

              </select>

            </div>


            {/* College */}
            <div className="form-group">

              <label>College Name *</label>

              <input
                type="text"
                name="college"
                value={student.college}
                onChange={handleChange}
                placeholder="Enter college name"
                required
              />

            </div>


            {/* Address */}
            <div className="form-group full-width">

              <label>Address *</label>

              <textarea
                name="address"
                value={student.address}
                onChange={handleChange}
                placeholder="Enter complete address"
                rows="4"
                required
              ></textarea>

            </div>

          </div>


          <button
            type="submit"
            className="add-button"
          >
            {editingId !== null
              ? "Update Student"
              : "Add Student"}
          </button>

        </form>

      </div>


      {/* ---------------- STUDENT DATA ---------------- */}
      <div className="student-list">

        <h2>Registered Students</h2>


        {/* SKELETON LOADING */}
        {loading ? (

          <>

            <StudentSkeleton />
            <StudentSkeleton />
            <StudentSkeleton />

          </>

        ) : students.length === 0 ? (

          /* NO DATA */
          <p className="no-data">
            No student data available.
          </p>

        ) : (

          /* STUDENT TABLE */
          <div className="table-container">

            <table>

              <thead>

                <tr>

                  <th>S.No</th>
                  <th>Name</th>
                  <th>Place</th>
                  <th>Age</th>
                  <th>Mobile</th>
                  <th>Email</th>
                  <th>Gender</th>
                  <th>Course</th>
                  <th>College</th>
                  <th>Address</th>
                  <th>Action</th>

                </tr>

              </thead>


              <tbody>

                {students.map((item, index) => (

                  <tr key={item.id}>

                    <td>{index + 1}</td>
                    <td>{item.name}</td>
                    <td>{item.place}</td>
                    <td>{item.age}</td>
                    <td>{item.mobileNumber}</td>
                    <td>{item.email}</td>
                    <td>{item.gender}</td>
                    <td>{item.course}</td>
                    <td>{item.college}</td>
                    <td>{item.address}</td>

                    <td>

                      <button
                        onClick={() => handleEdit(item)}
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDelete(item.id)}
                      >
                        Delete
                      </button>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>

  );
}

export default App;