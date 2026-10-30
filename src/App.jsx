import { useState, useEffect, useCallback } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  VALID_ROLES,
  isSafeText,
  isValidRole,
  getSafeId,
} from "./validation";
import "./App.css";
import api from "./services/api";
import LoginPage from "./components/LoginPage";
import ChangePassword from "./components/ChangePassword";
import UserManagement from "./components/UserManagement";
import StudentForm from "./components/StudentForm";
import StudentList from "./components/StudentList";
import Header from "./components/Header";
import {
  filterStudents,
} from "./utils/studentHelpers";


import {
  emptyStudent,
  emptyUser,
} from "./constants/constants";

import {
  isValidToken,
  clearStoredAuth,
} from "./utils/authUtils";


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
  const canView = VALID_ROLES.includes(role);
  const canRegister = ["Admin", "Manager", "Staff"].includes(role);
  const canEdit = ["Admin", "Manager"].includes(role);
  const canDelete = role === "Admin";

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
  ...emptyUser,
});

// STUDENTS
const [students, setStudents] = useState([]);

const [editingId, setEditingId] = useState(null);

const [student, setStudent] = useState({
  ...emptyStudent,
});

// SEARCH AND LOADING
const [searchTerm, setSearchTerm] = useState("");

const [loading, setLoading] = useState(false);

const resetPasswordForm = useCallback(() => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
  }, []);

const getAuthConfig = useCallback(() => {
  return {
    headers: authToken
      ? {
          Authorization: `Bearer ${authToken}`,
        }
      : {},
  };
}, [authToken]);

const handleLogout = useCallback(() => {
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

  setStudent({
    ...emptyStudent,
  });

  setSearchTerm("");

  setShowChangePassword(false);

  resetPasswordForm();

  setShowUserManagement(false);

  setUsers([]);

  setNewUser({
    ...emptyUser,
  });

  toast.success(
    "Logged out successfully!"
  );
}, [emptyStudent, emptyUser, resetPasswordForm]);

const handleSessionExpired = useCallback(() => {
  toast.error(
    "Session expired. Please login again."
  );

  handleLogout();
}, [handleLogout]);

 // FETCH STUDENTS
useEffect(() => {
  if (!isLoggedIn || !authToken) {
    return;
  }

  let cancelled = false;

  const fetchStudents = async () => {
    try {
      setLoading(true);

      const response = await api.getStudents(getAuthConfig());

      if (!cancelled) {
        setStudents(
          Array.isArray(response.data) ? response.data : []
        );
      }
    } catch (error) {
      if (cancelled) return;

      console.error("Error fetching students:", error);

      if (error.response?.status === 401) {
  handleSessionExpired();
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
}, [
    isLoggedIn,
    authToken,
    getAuthConfig,
    handleSessionExpired,
  ]);


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

resetPasswordForm();
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
  if (role !== "Admin") {
    return;
  }

  try {
    const response = await api.getUsers(
      getAuthConfig()
    );

    setUsers(
      Array.isArray(response.data)
        ? response.data
        : []
    );
  } catch (error) {
    console.error(
      "Error loading users:",
      error
    );

    if (
      error.response?.status === 401
    ) {
      handleSessionExpired();
    } else if (
      error.response?.status === 403
    ) {
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

// CREATE USER
const handleCreateUser = async (
  e
) => {
  e.preventDefault();

  if (
    !newUser.username.trim()
  ) {
    toast.error(
      "Username is required."
    );
    return;
  }

  if (
    !newUser.email.trim()
  ) {
    toast.error(
      "Email is required."
    );
    return;
  }

  if (
    !newUser.password.trim()
  ) {
    toast.error(
      "Password is required."
    );
    return;
  }

  if (
    newUser.password.length < 6
  ) {
    toast.error(
      "Password must be at least 6 characters."
    );
    return;
  }

  if (
    !isValidRole(newUser.role)
  ) {
    toast.error(
      "Please select a valid role."
    );
    return;
  }

  try {
    await api.createUser(
      {
        ...newUser,
        username:
          newUser.username.trim(),
        email:
          newUser.email.trim(),
      },
      getAuthConfig()
    );

    toast.success(
      "User created successfully!"
    );

    setNewUser({
      ...emptyUser,
    });

    await loadUsers();
  } catch (error) {
    console.error(
      "Create user error:",
      error
    );

    if (
      error.response?.status === 401
    ) {
      handleSessionExpired();
    } else {
      toast.error(
        "Failed to create user."
      );
    }
  }
};

// DELETE USER
const handleDeleteUser =
  async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this user?"
      )
    ) {
      return;
    }

    try {
      await api.deleteUser(
        id,
        getAuthConfig()
      );

      toast.success(
        "User deleted successfully!"
      );

      await loadUsers();
    } catch (error) {
      console.error(
        "Delete user error:",
        error
      );

      if (
        error.response?.status === 401
      ) {
        handleSessionExpired();
      } else {
        toast.error(
          "Failed to delete user."
        );
      }
    }
  };

// EDIT STUDENT
const handleEdit = (item) => {
  try {
    const safeId =
      getSafeId(item.id);

    setStudent({
      name: item.name ?? "",
      place: item.place ?? "",
      age: item.age ?? "",
      mobile:
        item.mobileNumber ?? "",
      email: item.email ?? "",
      gender:
        item.gender ?? "",
      course:
        item.course ?? "",
      college:
        item.college ?? "",
      address:
        item.address ?? "",
    });

    setEditingId(
      Number(safeId)
    );

    toast(
      "Editing student details"
    );
  } catch {
    toast.error(
      "Invalid student ID."
    );
  }
};

// DELETE STUDENT
const handleDelete =
  async (id) => {
    if (!canDelete) {
      toast.error(
        "Only Admin can delete students."
      );
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
      const safeId =
        getSafeId(id);

      await api.deleteStudent(
        safeId,
        getAuthConfig()
      );

      setStudents(
        (current) =>
          current.filter(
            (item) =>
              String(item.id) !==
              String(safeId)
          )
      );

      toast.success(
        "Student deleted successfully!"
      );
    } catch (error) {
      console.error(
        "Delete student error:",
        error
      );

      if (
        error.response?.status === 401
      ) {
        handleSessionExpired();
      } else {
        toast.error(
          "Failed to delete student."
        );
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
        name: (student.name ?? "").trim(),
        place: (student.place ?? "").trim(),
        email: (student.email ?? "").trim(),
        mobileNumber: (student.mobile ?? "").trim(),
        age: Number(student.age),
        gender: student.gender ?? "",
        course: student.course ?? "",
        college: (student.college ?? "").trim(),
        address: (student.address ?? "").trim(),
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
            String(item.id) === String(safeId)
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

  
  // FILTER STUDENTS
const filteredStudents =
  filterStudents(
    students,
    searchTerm
  );


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
    <LoginPage
      username={username}
      password={password}
      setUsername={setUsername}
      setPassword={setPassword}
      handleLogin={handleLogin}
      loginError={loginError}
      toaster={toaster}
    />
  );
}
  // REGISTRATION PAGE
  return (
    <>
      {toaster}

      <div className="main-container">
        <Header
  loggedInUsername={loggedInUsername}
  role={role}
  handleLogout={handleLogout}
  setShowUserManagement={
    setShowUserManagement
  }
  loadUsers={loadUsers}
  setShowChangePassword={
    setShowChangePassword
  }
/>
       {showChangePassword && (
  <ChangePassword
    currentPassword={
      currentPassword
    }
    setCurrentPassword={
      setCurrentPassword
    }
    newPassword={newPassword}
    setNewPassword={
      setNewPassword
    }
    confirmNewPassword={
      confirmNewPassword
    }
    setConfirmNewPassword={
      setConfirmNewPassword
    }
    handleChangePassword={
      handleChangePassword
    }
    setShowChangePassword={
      setShowChangePassword
    }
  />
)}

        {/* USER MANAGEMENT */}
       {role === "Admin" &&
  showUserManagement && (
    <UserManagement
      users={users}
      newUser={newUser}
      setNewUser={setNewUser}
      handleCreateUser={
        handleCreateUser
      }
      handleDeleteUser={
        handleDeleteUser
      }
      setShowUserManagement={
        setShowUserManagement
      }
      emptyUser={emptyUser}
    />
)}
        {canRegister && (
  <StudentForm
    student={student}
    handleChange={handleChange}
    handleSubmit={handleSubmit}
    editingId={editingId}
    setEditingId={setEditingId}
    setStudent={setStudent}
    emptyStudent={emptyStudent}
  />
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



        {canView && (
          <StudentList
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filteredStudents={filteredStudents}
            students={students}
            loading={loading}
            canEdit={canEdit}
            canDelete={canDelete}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
          />
        )}
      </div>
    </>
  );
}


export default App;
