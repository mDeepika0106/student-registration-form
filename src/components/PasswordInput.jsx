import { useState } from "react";

function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  name,
  autoComplete,
  required = false,
  minLength,
}) {
  const [showPassword, setShowPassword] = useState(false);

  return ( 
    <>
    <div className="password-input-wrapper">
      <input
        id={id}
        type={showPassword ? "text" : "password"}
        name={name}
        value={value ?? ""}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        minLength={minLength}
        required={required}
      />

      <button
        type="button"
        className="password-toggle-button"
        onClick={() =>
          setShowPassword((current) => !current)
        }
        aria-label={
          showPassword
            ? "Hide password"
            : "Show password"
        }
      >
        {showPassword ? "🙈" : "👁️"}
      </button>
    </div>
    </>
  );
}

export default PasswordInput;