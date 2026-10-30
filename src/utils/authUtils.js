import { isSafeText } from "../validation";

export function isValidToken(value) {
  return (
    isSafeText(value, 5000) &&
    /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(
      value
    )
  );
}

export function clearStoredAuth() {
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
  } catch {
    // Ignore storage errors
  }
}