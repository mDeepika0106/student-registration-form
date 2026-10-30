import PasswordInput from "./PasswordInput";

function UserManagement({
  users,
  newUser,
  setNewUser,
  handleCreateUser,
  handleDeleteUser,
  setShowUserManagement,
  emptyUser,
}) {
  return (
    <div className="form-box">
      <h2>Manage Users</h2>

      <h3>Create New User</h3>

      <form onSubmit={handleCreateUser}>
        <div className="form-grid">

          <div className="form-group">
            <label htmlFor="user-management-username">
              Username *
            </label>

            <input
              id="user-management-username"
              type="text"
              value={newUser.username}
              onChange={(e) =>
                setNewUser({
                  ...newUser,
                  username: e.target.value,
                })
              }
              placeholder="Enter username"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="user-management-email">
              Email *
            </label>

            <input
              id="user-management-email"
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
            <label htmlFor="user-management-password">
              Password *
            </label>

            <PasswordInput
              id="user-management-password"
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
            <label htmlFor="user-management-role">
              Role *
            </label>

            <select
              id="user-management-role"
              value={newUser.role}
              onChange={(e) =>
                setNewUser({
                  ...newUser,
                  role: e.target.value,
                })
              }
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
              ...emptyUser,
            });
          }}
        >
          Close
        </button>

      </form>

      <h3>Existing Users</h3>

      {users.length === 0 ? (
        <p className="no-data">
          No users found.
        </p>
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
                    {user.username !==
                      "admin" && (
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
  );
}

export default UserManagement;