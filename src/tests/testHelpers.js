import { render, screen, fireEvent } from "@testing-library/react";
import App from "../App";

export const testToken =
  "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.dGVzdC1zaWduYXR1cmU";

export async function loginAsRole(
  role,
  students = [],
  mockPost,
  mockGet
) {
  mockPost.mockResolvedValueOnce({
    data: {
      token: testToken,
      username: "testuser",
      role,
    },
  });

  mockGet.mockResolvedValue({
    data: students,
  });

  render(<App />);

  fireEvent.change(
    screen.getByLabelText("Username"),
    {
      target: { value: "testuser" },
    }
  );

  fireEvent.change(
    screen.getByLabelText("Password"),
    {
      target: { value: "correctpassword" },
    }
  );

  fireEvent.click(
    screen.getByRole("button", {
      name: "Login",
    })
  );

  await screen.findByRole("heading", {
    name: "Student Registration",
  });
}

export function makeStudent(
  overrides = {}
) {
  return {
    id: 1,
    name: "Delete Test Student",
    place: "Vijayawada",
    age: 21,
    mobileNumber: "9876543210",
    email: "delete@example.com",
    gender: "Female",
    course: "B.Tech",
    college: "Test College",
    address: "Test Address",
    ...overrides,
  };
}