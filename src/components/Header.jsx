function Header({
  loggedInUsername,
  role,
  handleLogout,
  setShowUserManagement,
  loadUsers,
  setShowChangePassword,
}) {
  return (
    <div className="header">
      <div>
        <h1>Student Registration</h1>

        <p>
          Logged in as:{" "}
          <strong>{loggedInUsername}</strong>
          {" | "}
          Role: <strong>{role}</strong>
        </p>
      </div>

      <div className="header-buttons">
        {role === "Admin" && (
          <button
            type="button"
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
          type="button"
          className="change-password-button"
          onClick={() =>
            setShowChangePassword(true)
          }
        >
          Change Password
        </button>

        <button
          type="button"
          className="logout-button"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default Header;