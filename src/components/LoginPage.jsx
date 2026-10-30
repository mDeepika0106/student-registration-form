import PasswordInput from "./PasswordInput";

function LoginPage({
  username,
  password,
  setUsername,
  setPassword,
  handleLogin,
  loginError,
  toaster,
}) {
  return (
    <>
      {toaster}

      <div className="login-container">
        <div className="login-box">
          <h1>Student Management</h1>
          <h2>Login</h2>

          <form onSubmit={handleLogin}>
            <label htmlFor="username">
              Username
            </label>

            <input
              id="username"
              type="text"
              placeholder="Enter username"
              value={username ?? ""}
              onChange={(e) =>
                setUsername(e.target.value)
              }
              autoComplete="username"
              required
            />

            <label htmlFor="login-password">
              Password
            </label>

            <PasswordInput
              id="login-password"
              value={password ?? ""}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="Enter password"
              autoComplete="current-password"
              required
            />

            {loginError && (
              <p
                className="error"
                role="alert"
              >
                {loginError}
              </p>
            )}

            <button
              type="submit"
              title="Login"
            >
              Login
            </button>
          </form>

          <div className="credentials">
            <p>
              Login using your registered
              username and password.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default LoginPage;