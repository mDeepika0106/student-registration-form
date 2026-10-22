
import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import axios from "axios";
import "./App.css";

// ======================================================
// API BASE URL VALIDATION
// ======================================================

const DEFAULT_API_URL =
  "https://studentregistrationform-api-deepika-c8cjcthmcgfjhecg.indiasouthcentral-01.azurewebsites.net/api";

function getSafeApiUrl(value) {
  try {
    const url = new URL(value);

    const allowedHosts = [
      "studentregistrationform-api-deepika-c8cjcthmcgfjhecg.indiasouthcentral-01.azurewebsites.net",
      "localhost",
      "127.0.0.1",
    ];

    if (!allowedHosts.includes(url.hostname)) {
      throw new Error("API host is not allowed");
    }

    if (url.protocol !== "https:" && url.hostname !== "localhost" &&
        url.hostname !== "127.0.0.1") {
      throw new Error("API protocol is not allowed");
    }

    let pathname = url.pathname;

    while (pathname.endsWith("/") && pathname.length > 1) {
      pathname = pathname.slice(0, -1);
    }

    if (pathname !== "/api") {
      throw new Error("API path is not allowed");
    }

    return url.origin + pathname;
  } catch {
    return "https://studentregistrationform-api-deepika-c8cjcthmcgfjhecg.indiasouthcentral-01.azurewebsites.net/api";
  }
}

const API_URL = getSafeApiUrl(
  import.meta.env.VITE_API_URL || DEFAULT_API_URL
);

// Use one Axios client with the validated API base URL.
// API request destinations are defined in the methods below.
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

// ======================================================
// VALIDATION HELPERS
// ======================================================

const VALID_ROLES = ["Admin", "Manager", "Staff", "Viewer"];

function isSafeText(value, maxLength = 200) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= maxLength &&
    !/[\u0000-\u001F\u007F]/.test(value)
  );
}

function isValidRole(value) {
  return VALID_ROLES.includes(value);
}

// Checks JWT structure only.
// The backend must verify the signature, issuer, audience and expiry.
function isValidToken(value) {
  return (
    isSafeText(value, 5000) &&
    /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(
      value
    )
  );
}

// Remove authentication data written by earlier app versions.
// Authentication data is not written to browser storage.
function clearStoredAuth() {
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
  } catch {
    // Browser storage may be unavailable.
  }
}

// ======================================================
// RECORD ID VALIDATION
// ======================================================

// Only positive, safe integer IDs are allowed in API routes.
function getSafeId(id) {
  if (typeof id === "number") {
    if (!Number.isSafeInteger(id) || id <= 0) {
      throw new Error("Invalid record ID");
    }

    return String(id);
  }

  if (typeof id !== "string" || !/^[1-9]\d*$/.test(id)) {
    throw new Error("Invalid record ID");
  }

  const numericId = Number(id);

  if (!Number.isSafeInteger(numericId) || numericId <= 0) {
    throw new Error("Invalid record ID");
  }

  return String(numericId);
}

// ======================================================
// FIXED API ENDPOINTS
// ======================================================

// These methods use fixed API routes.
// Record IDs are validated before being inserted into a route.

const api = {
  getStudents(config = {}) {
    return apiClient.get("/Student", config);
  },

  login(data) {
    return apiClient.post("/Auth/login", data);
  },

  changePassword(data, config = {}) {
    return apiClient.post(
      "/Auth/change-password",
      data,
      config
    );
  },

  getUsers(config = {}) {
    return apiClient.get("/User", config);
  },

  createUser(data, config = {}) {
    return apiClient.post("/User", data, config);
  },

  deleteUser(id, config = {}) {
    const safeId = getSafeId(id);

    return apiClient.delete(`/User/${safeId}`, config);
  },

  createStudent(data, config = {}) {
    return apiClient.post("/Student", data, config);
  },

  updateStudent(id, data, config = {}) {
    const safeId = getSafeId(id);

    return apiClient.put(
      `/Student/${safeId}`,
      data,
      config
    );
  },

  deleteStudent(id, config = {}) {
    const safeId = getSafeId(id);

    return apiClient.delete(
      `/Student/${safeId}`,
      config
    );
  },
};

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
// PASSWORD INPUT
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
        title={showPassword ? "Hide password" : "Show password"}
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
  // LOGIN
  // The token stays in memory rather than localStorage.
  const [authToken, setAuthToken] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [loggedInUsername, setLoggedInUsername] = useState("");
  const [role, setRole] = useState("");

  // CHANGE PASSWORD
  const [showChangePassword, setShowChangePassword] =
    useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] =
    useState("");

  // USER MANAGEMENT
  const [showUserManagement, setShowUserManagement] =
    useState(false);
  const [users, setUsers] = useState([]);

  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    role: "Viewer",
  });

  // STUDENT FORM
  const emptyStudent = {
    name: "",
    place: "",
    age: "",
    mobile: "",
    email: "",
    gender: "",
    course: "",
    college: "",
    address: "",
  };

  const [student, setStudent] = useState({
    ...emptyStudent,
  });

  // STUDENTS
  const [students, setStudents] = useState([]);
  const [editingId, setEditingId] = useState(null);

  // SEARCH AND LOADING
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // ROLE PERMISSIONS
  // The API must independently enforce all permissions.
  const canView = VALID_ROLES.includes(role);
  const canRegister = ["Admin", "Manager", "Staff"].includes(role);
  const canEdit = ["Admin", "Manager"].includes(role);
  const canDelete = role === "Admin";

  // AUTHENTICATION TOKEN
  const getToken = () => authToken;

  // AUTHORIZATION HEADER
  const getAuthConfig = () => {
    const token = getToken();

    return {
      headers: token
        ? { Authorization: `Bearer ${token}` }
        : {},
    };
  };

  // LOGOUT
  const handleLogout = () => {
    setAuthToken(null);
    setIsLoggedIn(false);

    clearStoredAuth();

    setRole("");
    setLoggedInUsername("");
    setUsername("");
    setPassword("");
    setLoginError("");

    setStudents([]);
    setEditingId(null);
    setStudent({ ...emptyStudent });
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

    toast.success("Logged out successfully!");
  };

  // FETCH STUDENTS
  useEffect(() => {
    if (!isLoggedIn || !authToken) {
      setStudents([]);
      return;
    }

    let cancelled = false;

    const fetchStudents = async () => {
      try {
        setLoading(true);

        const response = await api.getStudents(
          getAuthConfig()
        );

        if (!cancelled) {
          setStudents(
            Array.isArray(response.data) ? response.data : []
          );
        }
      } catch (error) {
        if (cancelled) return;

        console.error("Error fetching students:", error);

        if (error.response?.status === 401) {
          toast.error("Session expired. Please login again.");
          handleLogout();
        } else if (error.response?.status === 403) {
          toast.error(
            "You do not have permission to view students."
          );
        } else {
          toast.error("Failed to fetch student data.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

   void fetchStudents();

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, authToken]);

  // LOGIN
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");

    if (!username.trim()) {
      setLoginError("Username is required.");
      toast.error("Username is required.");
      return;
    }

    if (!password.trim()) {
      setLoginError("Password is required.");
      toast.error("Password is required.");
      return;
    }

    try {
      const response = await api.login({
        username: username.trim(),
        password,
      });

      const {
        token,
        username: responseUsername,
        role: responseRole,
      } = response.data ?? {};

      if (
        !isValidToken(token) ||
        !isSafeText(responseUsername, 200) ||
        !isValidRole(responseRole)
      ) {
        setLoginError(
          "The server returned invalid login information."
        );

        toast.error(
          "Invalid login response. Please try again."
        );

        return;
      }

      // Never persist the authentication token in browser storage.
      setAuthToken(token);
      setLoggedInUsername(responseUsername);
      setRole(responseRole);
      setIsLoggedIn(true);
      setLoginError("");
      setUsername("");
      setPassword("");

      toast.success(
        `Login successful! Welcome ${responseUsername}`
      );
    } catch (error) {
      console.error("Login error:", error);

      if (error.response?.status === 401) {
        setLoginError("Invalid username or password.");
        toast.error("Invalid username or password.");
      } else if (error.response?.data?.message) {
        setLoginError(
          "Unable to log in. Please check your details."
        );
        toast.error(
          "Unable to log in. Please check your details."
        );
      } else {
        setLoginError("Unable to connect to the server.");
        toast.error("Unable to connect to the server.");
      }
    }
  };

  // STUDENT INPUT CHANGES
  const handleChange = (e) => {
    const { name, value } = e.target;

    const allowedFields = [
      "name",
      "place",
      "age",
      "mobile",
      "email",
      "gender",
      "course",
      "college",
      "address",
    ];

    if (!allowedFields.includes(name)) return;

    setStudent((current) => ({
      ...current,
      [name]: value,
    }));
  };

  // CHANGE PASSWORD
  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!currentPassword.trim()) {
      toast.error("Enter your current password.");
      return;
    }

    if (!newPassword.trim()) {
      toast.error("Enter your new password.");
      return;
    }

    if (newPassword.length < 6) {
      toast.error(
        "New password must be at least 6 characters."
      );
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    try {
      await api.changePassword(
        {
          currentPassword,
          newPassword,
          confirmNewPassword,
        },
        getAuthConfig()
      );

      toast.success("Password changed successfully!");

      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setShowChangePassword(false);
    } catch (error) {
      console.error("Change password error:", error);

      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        handleLogout();
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to change password.");
      }
    }
  };

  // LOAD USERS
  const loadUsers = async () => {
    if (role !== "Admin") return;

    try {
      const response = await api.getUsers(
        getAuthConfig()
      );

      setUsers(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (error) {
      console.error("Error loading users:", error);

      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        handleLogout();
      } else if (error.response?.status === 403) {
        toast.error("Only Admin can view users.");
      } else {
        toast.error("Failed to load users.");
      }
    }
  };

  // CREATE USER
  const handleCreateUser = async (e) => {
    e.preventDefault();

    if (!newUser.username.trim()) {
      toast.error("Username is required.");
      return;
    }

    if (!newUser.email.trim()) {
      toast.error("Email is required.");
      return;
    }

    if (!newUser.password.trim()) {
      toast.error("Password is required.");
      return;
    }

    if (newUser.password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    if (!isValidRole(newUser.role)) {
      toast.error("Please select a valid role.");
      return;
    }

    try {
      await api.createUser(
        {
          ...newUser,
          username: newUser.username.trim(),
          email: newUser.email.trim(),
        },
        getAuthConfig()
      );

      toast.success("User created successfully!");

      setNewUser({
        username: "",
        email: "",
        password: "",
        role: "Viewer",
      });

      await loadUsers();
    } catch (error) {
      console.error("Create user error:", error);

      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        handleLogout();
      } else if (error.response?.status === 403) {
        toast.error("Only Admin can create users.");
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to create user.");
      }
    }
  };

  // DELETE USER
  const handleDeleteUser = async (id) => {
    if (role !== "Admin") {
      toast.error("Only Admin can delete users.");
      return;
    }

    if (
      !window.confirm(
        "Are you sure you want to delete this user?"
      )
    ) {
      return;
    }

    try {
      await api.deleteUser(id, getAuthConfig());

      toast.success("User deleted successfully!");
      await loadUsers();
    } catch (error) {
      console.error("Delete user error:", error);

      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        handleLogout();
      } else if (error.response?.status === 403) {
        toast.error("Only Admin can delete users.");
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.message === "Invalid record ID") {
        toast.error("Invalid user ID.");
      } else {
        toast.error("Failed to delete user.");
      }
    }
  };

  // ADD / UPDATE STUDENT
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
        name: student.name.trim(),
        place: student.place.trim(),
        email: student.email.trim(),
        mobileNumber: student.mobile.trim(),
        age: Number(student.age),
        gender: student.gender,
        course: student.course,
        college: student.college.trim(),
        address: student.address.trim(),
      };

      if (editingId !== null) {
        if (!canEdit) {
          toast.error(
            "You do not have permission to edit students."
          );
          return;
        }

        const safeId = getSafeId(editingId);

        await api.updateStudent(
          safeId,
          {
            id: Number(safeId),
            ...studentData,
          },
          getAuthConfig()
        );

        setStudents((current) =>
          current.map((item) =>
            String(item.id) === safeId
              ? {
                  ...item,
                  ...studentData,
                  id: Number(safeId),
                }
              : item
          )
        );

        toast.success("Student updated successfully!");
        setEditingId(null);
      } else {
        const response = await api.createStudent(
          studentData,
          getAuthConfig()
        );

        setStudents((current) => [
          ...current,
          response.data,
        ]);

        toast.success("Student added successfully!");
      }

      setStudent({ ...emptyStudent });
    } catch (error) {
      console.error("Error saving student:", error);

      if (error.response?.status === 403) {
        toast.error(
          "You do not have permission to perform this action."
        );
      } else if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        handleLogout();
      } else if (error.message === "Invalid record ID") {
        toast.error("Invalid student ID.");
      } else {
        toast.error("Failed to save student.");
      }
    }
  };

  // DELETE STUDENT
  const handleDelete = async (id) => {
    if (!canDelete) {
      toast.error("Only Admin can delete students.");
      return;
    }

    if (
      !window.confirm(
        "Are you sure you want to delete this student?"
      )
    ) {
      return;
    }

    try {
      const safeId = getSafeId(id);

      await api.deleteStudent(safeId, getAuthConfig());

      setStudents((current) =>
        current.filter(
          (studentItem) =>
            String(studentItem.id) !== safeId
        )
      );

      toast.success("Student deleted successfully!");
    } catch (error) {
      console.error("Error deleting student:", error);

      if (error.response?.status === 403) {
        toast.error("Only Admin can delete students.");
      } else if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        handleLogout();
      } else if (error.message === "Invalid record ID") {
        toast.error("Invalid student ID.");
      } else {
        toast.error("Failed to delete student.");
      }
    }
  };

  // EDIT STUDENT
  const handleEdit = (item) => {
    if (!canEdit) {
      toast.error(
        "You do not have permission to edit students."
      );
      return;
    }

    try {
      const safeId = getSafeId(item.id);

      setStudent({
        name: item.name ?? "",
        place: item.place ?? "",
        age: item.age ?? "",
        mobile: item.mobileNumber ?? "",
        email: item.email ?? "",
        gender: item.gender ?? "",
        course: item.course ?? "",
        college: item.college ?? "",
        address: item.address ?? "",
      });

      setEditingId(Number(safeId));
      toast("Editing student details");
    } catch {
      toast.error("Invalid student ID.");
    }
  };

  // FILTER STUDENTS
  const filteredStudents = students.filter((item) => {
    const search = searchTerm.toLowerCase().trim();

    if (!search) return true;

    return (
      item.name?.toLowerCase().includes(search) ||
      item.place?.toLowerCase().includes(search) ||
      item.email?.toLowerCase().includes(search) ||
      item.course?.toLowerCase().includes(search) ||
      item.college?.toLowerCase().includes(search) ||
      item.gender?.toLowerCase().includes(search) ||
      item.mobileNumber?.toString().includes(search) ||
      item.age?.toString().includes(search)
    );
  });

  // TOASTER
  const toaster = (
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
        success: { duration: 3000 },
        error: { duration: 4000 },
      }}
    />
  );

  // LOGIN PAGE
  if (!isLoggedIn) {
    return (
      <>
        {toaster}

        <div className="login-container">
          <div className="login-box">
            <h1>Student Management</h1>
            <h2>Login</h2>

            <form onSubmit={handleLogin}>
           <label htmlFor="username">Username</label>

<input
  id="username"
  type="text"
  placeholder="Enter username"
  value={username}
  onChange={(e) => setUsername(e.target.value)}
  autoComplete="username"
  required
/>

<label htmlFor="login-password">Password</label>

<PasswordInput
  id="login-password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  placeholder="Enter password"
  autoComplete="current-password"
  required
/>
              {loginError && (
                <p className="error">{loginError}</p>
              )}

              <button type="submit">Login</button>
            </form>

            <div className="credentials">
              <p>
                Login using your registered username and
                password.
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // REGISTRATION PAGE
  return (
    <>
      {toaster}

      <div className="main-container">
        <div className="header">
          <div>
            <h1>Student Registration</h1>
            <p>
              Logged in as: <strong>{loggedInUsername}</strong>
              {" | "}
              Role: <strong>{role}</strong>
            </p>
          </div>

          <div className="header-buttons">
            {role === "Admin" && (
              <button
                className="manage-users-button"
                onClick={() => {
                  setShowUserManagement(true);
                  void loadUsers();
                }}
              >
                Manage Users
              </button>
            )}

            <button
              className="change-password-button"
              onClick={() => setShowChangePassword(true)}
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

        {/* CHANGE PASSWORD */}
        {showChangePassword && (
          <div className="form-box">
            <h2>Change Password</h2>

            <form onSubmit={handleChangePassword}>
              <div className="form-group">
               <label htmlFor="current-password">Current Password </label>

<PasswordInput
  id="current-password"
  value={currentPassword}
  onChange={(e) => setCurrentPassword(e.target.value)}
  placeholder="Enter current password"
  autoComplete="current-password"
  required
/>              </div>

              <div className="form-group">
                <label htmlFor="new-password">New Password</label>
                <PasswordInput
                  value={newPassword}
                  onChange={(e) =>
                    setNewPassword(e.target.value)
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
                <label htmlFor="confirm-new-password">
  Confirm New Password
</label>
                <PasswordInput
                  value={confirmNewPassword}
                  onChange={(e) =>
                    setConfirmNewPassword(e.target.value)
                  }
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  required
                />
              </div>

              <button type="submit" className="add-button">
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

        {/* USER MANAGEMENT */}
        {role === "Admin" && showUserManagement && (
          <div className="form-box">
            <h2>Manage Users</h2>
            <h3>Create New User</h3>

            <form onSubmit={handleCreateUser}>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="user-management-username">Username *</label>
                  <input
                    type="text"
                    value={newUser.username}
                    onChange={(e) =>
                      setNewUser({
                        ...newUser,
                        username: e.target.value,
                      })
                    }
                    placeholder="Enter username"
                    autoComplete="off"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="user-management-email">Email *</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser({
                        ...newUser,
                        email: e.target.value,
                      })
                    }
                    placeholder="Enter email"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="user-management-password">Password *</label>
                  <PasswordInput
                    value={newUser.password}
                    onChange={(e) =>
                      setNewUser({
                        ...newUser,
                        password: e.target.value,
                      })
                    }
                    placeholder="Enter password"
                    autoComplete="new-password"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="user-management-role">Role *</label>
                  <select
                    value={newUser.role}
                    onChange={(e) =>
                      setNewUser({
                        ...newUser,
                        role: e.target.value,
                      })
                    }
                    required
                  >
                    <option value="">Select Role</option>
                    <option value="Admin">Admin</option>
                    <option value="Manager">Manager</option>
                    <option value="Staff">Staff</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="add-button">
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

            <h3>Existing Users</h3>

            {users.length === 0 ? (
              <p className="no-data">No users found.</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>{user.id}</td>
                        <td>{user.username}</td>
                        <td>{user.email}</td>
                        <td>{user.role}</td>
                        <td>
                          {user.username !== "admin" && (
                            <button
                              onClick={() =>
                                handleDeleteUser(user.id)
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

        {/* STUDENT REGISTRATION FORM */}
        {canRegister && (
          <div className="form-box">
            <h2>
              {editingId !== null
                ? "Edit Student Details"
                : "Enter Student Details"}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="student-name">Student Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={student.name}
                    onChange={handleChange}
                    placeholder="Enter student name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="student-place">Place *</label>
                  <input
                    type="text"
                    name="place"
                    value={student.place}
                    onChange={handleChange}
                    placeholder="Enter place"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="student-age">Age *</label>
                  <input
                    type="number"
                    name="age"
                    value={student.age}
                    onChange={handleChange}
                    placeholder="Enter age"
                    min="1"
                    max="120"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="student-mobile">Mobile Number *</label>
                  <input
                    type="tel"
                    name="mobile"
                    value={student.mobile}
                    onChange={handleChange}
                    placeholder="Enter mobile number"
                    maxLength="10"
                    required
                  />
                </div>

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

                <div className="form-group">
                  <label>Gender *</label>
                  <select
                    name="gender"
                    value={student.gender}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Course *</label>
                  <select
                    name="course"
                    value={student.course}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Course</option>
                    <option value="B.Tech">B.Tech</option>
                    <option value="B.Sc">B.Sc</option>
                    <option value="B.Com">B.Com</option>
                    <option value="BCA">BCA</option>
                    <option value="MCA">MCA</option>
                    <option value="MBA">MBA</option>
                  </select>
                </div>

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

                <div className="form-group full-width">
                  <label>Address *</label>
                  <textarea
                    name="address"
                    value={student.address}
                    onChange={handleChange}
                    placeholder="Enter complete address"
                    rows="4"
                    required
                  />
                </div>
              </div>

              <button type="submit" className="add-button">
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
                    setStudent({ ...emptyStudent });
                  }}
                >
                  Cancel Edit
                </button>
              )}
            </form>
          </div>
        )}

        {/* VIEWER MESSAGE */}
        {!canRegister && (
          <div className="form-box">
            <h2>View Only</h2>
            <p>
              You are logged in as <strong>{role}</strong>. You
              can view student information, but you cannot
              register or edit students.
            </p>
          </div>
        )}

        {/* STUDENT LIST */}
        {canView && (
          <div className="student-list">
            <div className="student-list-header">
              <div>
                <h2>Registered Students</h2>
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
                  onChange={(e) =>
                    setSearchTerm(e.target.value)
                  }
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
                <p>No students found for "{searchTerm}"</p>
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                >
                  Clear Search
                </button>
              </div>
            ) : (
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
                      {(canEdit || canDelete) && (
                        <th>Action</th>
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    {filteredStudents.map((item, index) => (
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

                        {(canEdit || canDelete) && (
                          <td>
                            {canEdit && (
                              <button
                                onClick={() => handleEdit(item)}
                              >
                                Edit
                              </button>
                            )}

                            {canDelete && (
                              <button
                                onClick={() =>
                                  handleDelete(item.id)
                                }
                              >
                                Delete
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
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
