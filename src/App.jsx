import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import axios from "axios";
import "./App.css";

// ======================================================
// API BASE URL
// ======================================================

const API_URL = "https://localhost:7240/api";

// ======================================================
// SKELETON LOADER
// ======================================================

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

// ======================================================
// PASSWORD INPUT WITH SHOW / HIDE BUTTON
// ======================================================

function PasswordInput({
  value,
  onChange,
  placeholder,
  name,
  autoComplete,
  required = false,
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="password-input-wrapper">
      <input
        type={showPassword ? "text" : "password"}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
      />

      <button
        type="button"
        className="password-toggle-button"
        onClick={() =>
          setShowPassword((current) => !current)
        }
        aria-label={
          showPassword ? "Hide password" : "Show password"
        }
        title={
          showPassword ? "Hide password" : "Show password"
        }
      >
        {showPassword ? "🙈" : "👁️"}
      </button>
    </div>
  );
}

// ======================================================
// APP
// ======================================================

function App() {

  // ====================================================
  // LOGIN
  // ====================================================

  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem("token")
  );

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loginError, setLoginError] = useState("");

  // Store logged-in user's role
  const [role, setRole] = useState(
    localStorage.getItem("role") || ""
  );

  // ====================================================
  // CHANGE PASSWORD
  // ====================================================

  const [showChangePassword, setShowChangePassword] =
    useState(false);

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmNewPassword, setConfirmNewPassword] =
    useState("");

  // ====================================================
  // USER MANAGEMENT - ADMIN ONLY
  // ====================================================

  const [showUserManagement, setShowUserManagement] =
    useState(false);

  const [users, setUsers] = useState([]);

  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    role: "Viewer",
  });

  // ====================================================
  // STUDENT FORM
  // ====================================================

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

  // ====================================================
  // STUDENTS
  // ====================================================

  const [students, setStudents] = useState([]);

  const [editingId, setEditingId] = useState(null);

  // ====================================================
  // SEARCH
  // ====================================================

  const [searchTerm, setSearchTerm] = useState("");

  // ====================================================
  // LOADING
  // ====================================================

  const [loading, setLoading] = useState(false);

  // ====================================================
  // ROLE PERMISSIONS
  // ====================================================

  const canView = [
    "Admin",
    "Manager",
    "Staff",
    "Viewer",
  ].includes(role);

  const canRegister = [
    "Admin",
    "Manager",
    "Staff",
  ].includes(role);

  const canEdit = [
    "Admin",
    "Manager",
  ].includes(role);

  const canDelete = role === "Admin";

  // ====================================================
  // GET JWT TOKEN
  // ====================================================

  const getToken = () => {
    return localStorage.getItem("token");
  };

  // ====================================================
  // AXIOS CONFIGURATION
  // ====================================================

  const getAuthConfig = () => {
    const token = getToken();

    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  // ====================================================
  // FETCH STUDENTS
  // ====================================================

  useEffect(() => {

    if (!isLoggedIn) {
      return;
    }

    const fetchStudents = async () => {

      try {

        setLoading(true);

        const response = await axios.get(
          `${API_URL}/Student`,
          getAuthConfig()
        );

        setStudents(response.data);

      } catch (error) {

        console.log(
          "Error fetching students:",
          error
        );

        if (error.response?.status === 401) {

          toast.error(
            "Session expired. Please login again."
          );

          handleLogout();

        } else if (error.response?.status === 403) {

          toast.error(
            "You do not have permission to view students."
          );

        } else {

          toast.error(
            "Failed to fetch student data"
          );
        }

      } finally {

        setLoading(false);
      }
    };

    fetchStudents();

  }, [isLoggedIn]);

  // ====================================================
  // HANDLE LOGIN
  // ====================================================

  const handleLogin = async (e) => {

    e.preventDefault();

    setLoginError("");

    if (!username.trim()) {

      setLoginError(
        "Username is required."
      );

      toast.error(
        "Username is required."
      );

      return;
    }

    if (!password.trim()) {

      setLoginError(
        "Password is required."
      );

      toast.error(
        "Password is required."
      );

      return;
    }

    try {

      const response = await axios.post(
        `${API_URL}/Auth/login`,
        {
          username: username,
          password: password,
        }
      );

      const token = response.data.token;

      const loggedInUsername =
        response.data.username;

      const loggedInRole =
        response.data.role;

      localStorage.setItem(
        "token",
        token
      );

      localStorage.setItem(
        "username",
        loggedInUsername
      );

      localStorage.setItem(
        "role",
        loggedInRole
      );

      setRole(loggedInRole);

      setIsLoggedIn(true);

      setLoginError("");

      setUsername("");

      setPassword("");

      toast.success(
        `Login successful! Welcome ${loggedInUsername}`
      );

    } catch (error) {

      console.log(
        "Login error:",
        error
      );

      if (error.response?.status === 401) {

        setLoginError(
          "Invalid username or password."
        );

        toast.error(
          "Invalid username or password."
        );

      } else if (
        error.response?.data?.message
      ) {

        setLoginError(
          error.response.data.message
        );

        toast.error(
          error.response.data.message
        );

      } else {

        setLoginError(
          "Unable to connect to the server."
        );

        toast.error(
          "Unable to connect to the server."
        );
      }
    }
  };

  // ====================================================
  // HANDLE INPUT CHANGES
  // ====================================================

  const handleChange = (e) => {

    setStudent({
      ...student,
      [e.target.name]: e.target.value,
    });
  };

  // ====================================================
  // CHANGE PASSWORD
  // ====================================================

  const handleChangePassword = async (e) => {

    e.preventDefault();

    if (!currentPassword.trim()) {

      toast.error(
        "Enter your current password."
      );

      return;
    }

    if (!newPassword.trim()) {

      toast.error(
        "Enter your new password."
      );

      return;
    }

    if (newPassword.length < 6) {

      toast.error(
        "New password must be at least 6 characters."
      );

      return;
    }

    if (
      newPassword !==
      confirmNewPassword
    ) {

      toast.error(
        "New passwords do not match."
      );

      return;
    }

    try {

      await axios.post(
        `${API_URL}/Auth/change-password`,
        {
          currentPassword:
            currentPassword,

          newPassword:
            newPassword,

          confirmNewPassword:
            confirmNewPassword,
        },
        getAuthConfig()
      );

      toast.success(
        "Password changed successfully!"
      );

      setCurrentPassword("");

      setNewPassword("");

      setConfirmNewPassword("");

      setShowChangePassword(false);

    } catch (error) {

      console.log(
        "Change password error:",
        error
      );

      if (error.response?.status === 401) {

        toast.error(
          "Session expired. Please login again."
        );

        handleLogout();

      } else if (
        error.response?.data?.message
      ) {

        toast.error(
          error.response.data.message
        );

      } else {

        toast.error(
          "Failed to change password."
        );
      }
    }
  };

  // ====================================================
  // USER MANAGEMENT - LOAD USERS
  // ====================================================

  const loadUsers = async () => {

    if (role !== "Admin") {
      return;
    }

    try {

      const response = await axios.get(
        `${API_URL}/User`,
        getAuthConfig()
      );

      setUsers(response.data);

    } catch (error) {

      console.log(
        "Error loading users:",
        error
      );

      if (error.response?.status === 401) {

        toast.error(
          "Session expired. Please login again."
        );

        handleLogout();

      } else if (error.response?.status === 403) {

        toast.error(
          "Only Admin can view users."
        );

      } else {

        toast.error(
          "Failed to load users."
        );
      }
    }
  };

  // ====================================================
  // USER MANAGEMENT - CREATE USER
  // ====================================================

  const handleCreateUser = async (e) => {

    e.preventDefault();

    if (!newUser.username.trim()) {

      toast.error(
        "Username is required."
      );

      return;
    }

    if (!newUser.email.trim()) {

      toast.error(
        "Email is required."
      );

      return;
    }

    if (!newUser.password.trim()) {

      toast.error(
        "Password is required."
      );

      return;
    }

    if (newUser.password.length < 6) {

      toast.error(
        "Password must be at least 6 characters."
      );

      return;
    }

    if (
      !newUser.role ||
      newUser.role === "select"
    ) {

      toast.error(
        "Please select a role."
      );

      return;
    }

    try {

      await axios.post(
        `${API_URL}/User`,
        newUser,
        getAuthConfig()
      );

      toast.success(
        "User created successfully!"
      );

      setNewUser({
        username: "",
        email: "",
        password: "",
        role: "Viewer",
      });

      loadUsers();

    } catch (error) {

      console.log(
        "Create user error:",
        error
      );

      if (error.response?.status === 401) {

        toast.error(
          "Session expired. Please login again."
        );

        handleLogout();

      } else if (error.response?.status === 403) {

        toast.error(
          "Only Admin can create users."
        );

      } else if (
        error.response?.data?.message
      ) {

        toast.error(
          error.response.data.message
        );

      } else {

        toast.error(
          "Failed to create user."
        );
      }
    }
  };

  // ====================================================
  // USER MANAGEMENT - DELETE USER
  // ====================================================

  const handleDeleteUser = async (id) => {

    const confirmDelete =
      window.confirm(
        "Are you sure you want to delete this user?"
      );

    if (!confirmDelete) {
      return;
    }

    try {

      await axios.delete(
        `${API_URL}/User/${id}`,
        getAuthConfig()
      );

      toast.success(
        "User deleted successfully!"
      );

      loadUsers();

    } catch (error) {

      console.log(
        "Delete user error:",
        error
      );

      if (error.response?.status === 401) {

        toast.error(
          "Session expired. Please login again."
        );

        handleLogout();

      } else if (error.response?.status === 403) {

        toast.error(
          "Only Admin can delete users."
        );

      } else if (
        error.response?.data?.message
      ) {

        toast.error(
          error.response.data.message
        );

      } else {

        toast.error(
          "Failed to delete user."
        );
      }
    }
  };

  // ====================================================
  // ADD / UPDATE STUDENT
  // ====================================================

  const handleSubmit = async (e) => {

    e.preventDefault();

    if (!canRegister) {

      toast.error(
        "You do not have permission to register students."
      );

      return;
    }

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

      // =================================================
      // EDIT / UPDATE
      // =================================================

      if (editingId !== null) {

        if (!canEdit) {

          toast.error(
            "You do not have permission to edit students."
          );

          return;
        }

        await axios.put(
          `${API_URL}/Student/${editingId}`,
          {
            id: editingId,
            ...studentData,
          },
          getAuthConfig()
        );

        setStudents(
          (currentStudents) =>
            currentStudents.map(
              (item) =>
                item.id === editingId
                  ? {
                      id: editingId,
                      ...studentData,
                    }
                  : item
            )
        );

        toast.success(
          "Student updated successfully!"
        );

        setEditingId(null);

      }

      // =================================================
      // ADD NEW STUDENT
      // =================================================

      else {

        const response = await axios.post(
          `${API_URL}/Student`,
          studentData,
          getAuthConfig()
        );

        setStudents(
          (currentStudents) => [
            ...currentStudents,
            response.data,
          ]
        );

        toast.success(
          "Student added successfully!"
        );
      }

      // =================================================
      // CLEAR FORM
      // =================================================

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

      console.log(
        "Error saving student:",
        error
      );

      if (
        error.response?.status === 403
      ) {

        toast.error(
          "You do not have permission to perform this action."
        );

      } else if (
        error.response?.status === 401
      ) {

        toast.error(
          "Session expired. Please login again."
        );

        handleLogout();

      } else {

        toast.error(
          "Failed to save student."
        );
      }
    }
  };

  // ====================================================
  // DELETE STUDENT
  // ====================================================

  const handleDelete = async (id) => {

    if (!canDelete) {

      toast.error(
        "Only Admin can delete students."
      );

      return;
    }

    const confirmDelete =
      window.confirm(
        "Are you sure you want to delete this student?"
      );

    if (!confirmDelete) {
      return;
    }

    try {

      await axios.delete(
        `${API_URL}/Student/${id}`,
        getAuthConfig()
      );

      setStudents(
        (currentStudents) =>
          currentStudents.filter(
            (student) =>
              student.id !== id
          )
      );

      toast.success(
        "Student deleted successfully!"
      );

    } catch (error) {

      console.log(
        "Error deleting student:",
        error
      );

      if (
        error.response?.status === 403
      ) {

        toast.error(
          "Only Admin can delete students."
        );

      } else if (
        error.response?.status === 401
      ) {

        toast.error(
          "Session expired. Please login again."
        );

        handleLogout();

      } else {

        toast.error(
          "Failed to delete student."
        );
      }
    }
  };

  // ====================================================
  // HANDLE EDIT
  // ====================================================

  const handleEdit = (item) => {

    if (!canEdit) {

      toast.error(
        "You do not have permission to edit students."
      );

      return;
    }

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

    toast(
      "Editing student details"
    );
  };

  // ====================================================
  // LOGOUT
  // ====================================================

  const handleLogout = () => {

    localStorage.removeItem("token");

    localStorage.removeItem("username");

    localStorage.removeItem("role");

    setIsLoggedIn(false);

    setRole("");

    setUsername("");

    setPassword("");

    setStudents([]);

    setEditingId(null);

    setSearchTerm("");

    setShowChangePassword(false);

    setCurrentPassword("");

    setNewPassword("");

    setConfirmNewPassword("");

    setShowUserManagement(false);

    setUsers([]);

    setNewUser({
      username: "",
      email: "",
      password: "",
      role: "Viewer",
    });

    toast.success(
      "Logged out successfully!"
    );
  };

  // ====================================================
  // FILTER STUDENTS FOR SEARCH
  // ====================================================

  const filteredStudents = students.filter((item) => {

    const search = searchTerm
      .toLowerCase()
      .trim();

    if (!search) {
      return true;
    }

    return (
      item.name
        ?.toLowerCase()
        .includes(search) ||

      item.place
        ?.toLowerCase()
        .includes(search) ||

      item.email
        ?.toLowerCase()
        .includes(search) ||

      item.course
        ?.toLowerCase()
        .includes(search) ||

      item.college
        ?.toLowerCase()
        .includes(search) ||

      item.gender
        ?.toLowerCase()
        .includes(search) ||

      item.mobileNumber
        ?.toString()
        .includes(search) ||

      item.age
        ?.toString()
        .includes(search)
    );
  });

  // ====================================================
  // LOGIN PAGE
  // ====================================================

  if (!isLoggedIn) {

    return (
      <>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,

            style: {
              background: "#333",
              color: "#fff",
              borderRadius: "10px",
              padding: "14px 18px",
              fontSize: "15px",
            },

            success: {
              duration: 3000,
            },

            error: {
              duration: 4000,
            },
          }}
        />

        <div className="login-container">

          <div className="login-box">

            <h1>
              Student Management
            </h1>

            <h2>
              Login
            </h2>

            <form
              onSubmit={handleLogin}
            >

              <label>
                Username
              </label>

              <input
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) =>
                  setUsername(
                    e.target.value
                  )
                }
                autoComplete="username"
              />

              <label>
                Password
              </label>

              <PasswordInput
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="Enter password"
                autoComplete="current-password"
                required
              />

              {loginError && (
                <p className="error">
                  {loginError}
                </p>
              )}

              <button
                type="submit"
              >
                Login
              </button>

            </form>

            <div className="credentials">

              <p>
                Login using your
                registered username
                and password.
              </p>

            </div>

          </div>

        </div>
      </>
    );
  }

  // ====================================================
  // REGISTRATION PAGE
  // ====================================================

  return (

    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,

          style: {
            background: "#333",
            color: "#fff",
            borderRadius: "10px",
            padding: "14px 18px",
            fontSize: "15px",
          },

          success: {
            duration: 3000,
          },

          error: {
            duration: 4000,
          },
        }}
      />

      <div className="main-container">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="header">

          <div>

            <h1>
              Student Registration
            </h1>

            <p>

              Logged in as:{" "}

              <strong>
                {localStorage.getItem(
                  "username"
                )}
              </strong>

              {" | "}

              Role:{" "}

              <strong>
                {role}
              </strong>

            </p>

          </div>

          <div className="header-buttons">

            {role === "Admin" && (
              <button
                className="manage-users-button"
                onClick={() => {
                  setShowUserManagement(true);
                  loadUsers();
                }}
              >
                Manage Users
              </button>
            )}

            <button
              className="change-password-button"
              onClick={() =>
                setShowChangePassword(true)
              }
            >
              Change Password
            </button>

            <button
              className="logout-button"
              onClick={handleLogout}
            >
              Logout
            </button>

          </div>

        </div>

        {/* =================================================
            CHANGE PASSWORD FORM
        ================================================= */}

        {showChangePassword && (

          <div className="form-box">

            <h2>
              Change Password
            </h2>

            <form
              onSubmit={
                handleChangePassword
              }
            >

              <div className="form-group">

                <label>
                  Current Password
                </label>

                <PasswordInput
                  value={currentPassword}
                  onChange={(e) =>
                    setCurrentPassword(
                      e.target.value
                    )
                  }
                  placeholder="Enter current password"
                  autoComplete="current-password"
                  required
                />

              </div>

              <div className="form-group">

                <label>
                  New Password
                </label>

                <PasswordInput
                  value={newPassword}
                  onChange={(e) =>
                    setNewPassword(
                      e.target.value
                    )
                  }
                  placeholder="Enter new password"
                  autoComplete="new-password"
                  required
                />

                <small className="password-hint">
                  Password must contain at least 6 characters.
                </small>

              </div>

              <div className="form-group">

                <label>
                  Confirm New Password
                </label>

                <PasswordInput
                  value={confirmNewPassword}
                  onChange={(e) =>
                    setConfirmNewPassword(
                      e.target.value
                    )
                  }
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  required
                />

              </div>

              <button
                type="submit"
                className="add-button"
              >
                Change Password
              </button>

              <button
                type="button"
                className="logout-button"
                onClick={() => {

                  setShowChangePassword(false);

                  setCurrentPassword("");

                  setNewPassword("");

                  setConfirmNewPassword("");

                }}
              >
                Cancel
              </button>

            </form>

          </div>

        )}

        {/* =================================================
            USER MANAGEMENT - ADMIN ONLY
        ================================================= */}

        {role === "Admin" &&
          showUserManagement && (

          <div className="form-box">

            <h2>
              Manage Users
            </h2>

            <h3>
              Create New User
            </h3>

            <form
              onSubmit={handleCreateUser}
            >

              <div className="form-grid">

                <div className="form-group">

                  <label>
                    Username *
                  </label>

                  <input
                    type="text"
                    value={newUser.username}
                    onChange={(e) =>
                      setNewUser({
                        ...newUser,
                        username:
                          e.target.value,
                      })
                    }
                    placeholder="Enter username"
                    autoComplete="off"
                    required
                  />

                </div>

                <div className="form-group">

                  <label>
                    Email *
                  </label>

                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser({
                        ...newUser,
                        email:
                          e.target.value,
                      })
                    }
                    placeholder="Enter email"
                    required
                  />

                </div>

                <div className="form-group">

                  <label>
                    Password *
                  </label>

                  <PasswordInput
                    value={newUser.password}
                    onChange={(e) =>
                      setNewUser({
                        ...newUser,
                        password:
                          e.target.value,
                      })
                    }
                    placeholder="Enter password"
                    autoComplete="new-password"
                    required
                  />

                </div>

                <div className="form-group">

                  <label>
                    Role *
                  </label>

                  <select
                    value={newUser.role}
                    onChange={(e) =>
                      setNewUser({
                        ...newUser,
                        role:
                          e.target.value,
                      })
                    }
                    required
                  >

                    <option value="">
                      Select Role
                    </option>

                    <option value="Admin">
                      Admin
                    </option>

                    <option value="Manager">
                      Manager
                    </option>

                    <option value="Staff">
                      Staff
                    </option>

                    <option value="Viewer">
                      Viewer
                    </option>

                  </select>

                </div>

              </div>

              <button
                type="submit"
                className="add-button"
              >
                Create User
              </button>

              <button
                type="button"
                className="logout-button"
                onClick={() => {

                  setShowUserManagement(false);

                  setNewUser({
                    username: "",
                    email: "",
                    password: "",
                    role: "Viewer",
                  });

                }}
              >
                Close
              </button>

            </form>

            <h3>
              Existing Users
            </h3>

            {users.length === 0 ? (

              <p className="no-data">
                No users found.
              </p>

            ) : (

              <div className="table-container">

                <table>

                  <thead>

                    <tr>

                      <th>
                        ID
                      </th>

                      <th>
                        Username
                      </th>

                      <th>
                        Email
                      </th>

                      <th>
                        Role
                      </th>

                      <th>
                        Action
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {users.map((user) => (

                      <tr key={user.id}>

                        <td>
                          {user.id}
                        </td>

                        <td>
                          {user.username}
                        </td>

                        <td>
                          {user.email}
                        </td>

                        <td>
                          {user.role}
                        </td>

                        <td>

                          {user.username !== "admin" && (

                            <button
                              onClick={() =>
                                handleDeleteUser(
                                  user.id
                                )
                              }
                            >
                              Delete
                            </button>

                          )}

                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

            )}

          </div>

        )}

        {/* =================================================
            REGISTRATION FORM
        ================================================= */}

        {canRegister && (

          <div className="form-box">

            <h2>

              {editingId !== null
                ? "Edit Student Details"
                : "Enter Student Details"}

            </h2>

            <form
              onSubmit={
                handleSubmit
              }
            >

              <div className="form-grid">

                <div className="form-group">

                  <label>
                    Student Name *
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={
                      student.name
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Enter student name"
                    required
                  />

                </div>

                <div className="form-group">

                  <label>
                    Place *
                  </label>

                  <input
                    type="text"
                    name="place"
                    value={
                      student.place
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Enter place"
                    required
                  />

                </div>

                <div className="form-group">

                  <label>
                    Age *
                  </label>

                  <input
                    type="number"
                    name="age"
                    value={
                      student.age
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Enter age"
                    min="1"
                    max="120"
                    required
                  />

                </div>

                <div className="form-group">

                  <label>
                    Mobile Number *
                  </label>

                  <input
                    type="tel"
                    name="mobile"
                    value={
                      student.mobile
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Enter mobile number"
                    maxLength="10"
                    required
                  />

                </div>

                <div className="form-group">

                  <label>
                    Email *
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={
                      student.email
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Enter email"
                    required
                  />

                </div>

                <div className="form-group">

                  <label>
                    Gender *
                  </label>

                  <select
                    name="gender"
                    value={
                      student.gender
                    }
                    onChange={
                      handleChange
                    }
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

                <div className="form-group">

                  <label>
                    Course *
                  </label>

                  <select
                    name="course"
                    value={
                      student.course
                    }
                    onChange={
                      handleChange
                    }
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

                <div className="form-group">

                  <label>
                    College Name *
                  </label>

                  <input
                    type="text"
                    name="college"
                    value={
                      student.college
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Enter college name"
                    required
                  />

                </div>

                <div className="form-group full-width">

                  <label>
                    Address *
                  </label>

                  <textarea
                    name="address"
                    value={
                      student.address
                    }
                    onChange={
                      handleChange
                    }
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

              {editingId !== null && (

                <button
                  type="button"
                  className="logout-button"
                  onClick={() => {

                    setEditingId(null);

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

                  }}
                >
                  Cancel Edit
                </button>

              )}

            </form>

          </div>

        )}

        {/* =================================================
            VIEWER MESSAGE
        ================================================= */}

        {!canRegister && (

          <div className="form-box">

            <h2>
              View Only
            </h2>

            <p>

              You are logged in as{" "}

              <strong>
                {role}
              </strong>.

              {" "}You can view student
              information, but you cannot
              register or edit students.

            </p>

          </div>

        )}

        {/* =================================================
            STUDENT DATA
        ================================================= */}

        {canView && (

          <div className="student-list">

            {/* =================================================
                STUDENT LIST HEADER + SEARCH
            ================================================= */}

            <div className="student-list-header">

              <div>

                <h2>
                  Registered Students
                </h2>

                <p className="student-count">
                  {searchTerm
                    ? `${filteredStudents.length} student(s) found`
                    : `${students.length} student(s) registered`}
                </p>

              </div>
<div className="student-search">
  <span className="search-icon">⌕</span>

              <input
               type="text"
               placeholder="Search students..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
              />

               {searchTerm && (
              <button
                type="button"
                className="clear-search-button"
                onClick={() => setSearchTerm("")}
                 title="Clear search"
                     >
                  ✕
                </button>
                 )}
          </div>

            </div>

            {/* =================================================
                STUDENT DATA
            ================================================= */}

            {loading ? (

              <>

                <StudentSkeleton />

                <StudentSkeleton />

                <StudentSkeleton />

              </>

            ) : students.length === 0 ? (

              <p className="no-data">
                No student data available.
              </p>

            ) : filteredStudents.length === 0 ? (

              <div className="no-search-results">

                <p>
                  No students found for "{searchTerm}"
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setSearchTerm("")
                  }
                >
                  Clear Search
                </button>

              </div>

            ) : (

              <div className="table-container">

                <table>

                  <thead>

                    <tr>

                      <th>
                        S.No
                      </th>

                      <th>
                        Name
                      </th>

                      <th>
                        Place
                      </th>

                      <th>
                        Age
                      </th>

                      <th>
                        Mobile
                      </th>

                      <th>
                        Email
                      </th>

                      <th>
                        Gender
                      </th>

                      <th>
                        Course
                      </th>

                      <th>
                        College
                      </th>

                      <th>
                        Address
                      </th>

                      {(canEdit ||
                        canDelete) && (

                        <th>
                          Action
                        </th>

                      )}

                    </tr>

                  </thead>

                  <tbody>

                    {filteredStudents.map(
                      (item, index) => (

                        <tr
                          key={item.id}
                        >

                          <td>
                            {index + 1}
                          </td>

                          <td>
                            {item.name}
                          </td>

                          <td>
                            {item.place}
                          </td>

                          <td>
                            {item.age}
                          </td>

                          <td>
                            {item.mobileNumber}
                          </td>

                          <td>
                            {item.email}
                          </td>

                          <td>
                            {item.gender}
                          </td>

                          <td>
                            {item.course}
                          </td>

                          <td>
                            {item.college}
                          </td>

                          <td>
                            {item.address}
                          </td>

                          {(canEdit ||
                            canDelete) && (

                            <td>

                              {canEdit && (

                                <button
                                  onClick={() =>
                                    handleEdit(
                                      item
                                    )
                                  }
                                >
                                  Edit
                                </button>

                              )}

                              {canDelete && (

                                <button
                                  onClick={() =>
                                    handleDelete(
                                      item.id
                                    )
                                  }
                                >
                                  Delete
                                </button>

                              )}

                            </td>

                          )}

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            )}

          </div>

        )}

      </div>
    </>
  );
}

export default App;