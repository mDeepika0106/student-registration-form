import PasswordInput from "./PasswordInput";

function ChangePassword({
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmNewPassword,
  setConfirmNewPassword,
  handleChangePassword,
  setShowChangePassword,
}) {
  return (
    <div className="form-box">
      <h2>Change Password</h2>

      <form onSubmit={handleChangePassword}>
        <div className="form-group">
          <label htmlFor="current-password">
            Current Password
          </label>

          <PasswordInput
            id="current-password"
            value={currentPassword ?? ""}
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
          <label htmlFor="new-password">
            New Password
          </label>

          <PasswordInput
            id="new-password"
            value={newPassword ?? ""}
            onChange={(e) =>
              setNewPassword(
                e.target.value
              )
            }
            placeholder="Enter new password"
            autoComplete="new-password"
            minLength={6}
            required
            aria-describedby="password-hint"
          />

          <small
            id="password-hint"
            className="password-hint"
          >
            Password must contain at least
            6 characters.
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="confirm-new-password">
            Confirm New Password
          </label>

          <PasswordInput
            id="confirm-new-password"
            value={confirmNewPassword ?? ""}
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
          title="Change Password"
        >
          Change Password
        </button>

        <button
          type="button"
          className="logout-button"
          title="Cancel"
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
  );
}

export default ChangePassword;