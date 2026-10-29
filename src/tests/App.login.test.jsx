import userEvent from "@testing-library/user-event";

import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
} from "vitest";

import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";

import App from "../App";

const {
  mockPost,
  mockGet,
  mockPut,
  mockDelete,
} = vi.hoisted(() => ({
  mockPost: vi.fn(),
  mockGet: vi.fn(),
  mockPut: vi.fn(),
  mockDelete: vi.fn(),
}));

vi.mock("axios", () => ({
  default: {
    create: vi.fn(() => ({
      post: mockPost,
      get: mockGet,
      put: mockPut,
      delete: mockDelete,
    })),
  },
}));

const testToken =
  "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.dGVzdC1zaWduYXR1cmU";

beforeEach(() => {
  mockPost.mockReset();
  mockGet.mockReset();
  mockPut.mockReset();
  mockDelete.mockReset();
});



describe("Login form", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("displays the login form fields", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Login" })
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText("Username")
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText("Password")
    ).toBeInTheDocument();
  });

  it("shows an error when the password is empty", () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "testuser" },
    });

    const form = screen
      .getByRole("button", { name: "Login" })
      .closest("form");

    fireEvent.submit(form);

    expect(
      document.querySelector("p.error")
    ).toHaveTextContent("Password is required.");
  });

  
it("toggles password visibility when the toggle button is clicked", () => {
  render(<App />);

  // Find the password input using its unique ID.
  const passwordInput = document.getElementById("login-password");

  // Initially, the password should be hidden.
  expect(passwordInput).toHaveAttribute("type", "password");

  // Click Show password.
  fireEvent.click(
    screen.getByRole("button", { name: "Show password" })
  );

  // Password should now be visible.
  expect(passwordInput).toHaveAttribute("type", "text");

  // Click Hide password.
  fireEvent.click(
    screen.getByRole("button", { name: "Hide password" })
  );

  // Password should be hidden again.
  expect(passwordInput).toHaveAttribute("type", "password");
});


  it("shows an error when the API rejects the login", async () => {
    mockPost.mockRejectedValueOnce({
      response: { status: 401 },
    });

    render(<App />);

    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "testuser" },
    });

    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "wrongpassword" },
    });

    fireEvent.submit(
      screen.getByRole("button", { name: "Login" }).closest("form")
    );

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith("/Auth/login", {
        username: "testuser",
        password: "wrongpassword",
      });
    });

    expect(
      await screen.findByText("Invalid username or password.", {
        selector: "p.error",
      })
    ).toBeInTheDocument();
  });

  it("shows an error when the server cannot be reached", async () => {
    mockPost.mockRejectedValueOnce(new Error("Network Error"));

    render(<App />);

    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "testuser" },
    });

    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "validpassword" },
    });

    fireEvent.submit(
      screen.getByRole("button", { name: "Login" }).closest("form")
    );

    expect(
      await screen.findByText("Unable to connect to the server.", {
        selector: "p.error",
      })
    ).toBeInTheDocument();
  });

  it("logs in successfully when the API returns valid credentials", async () => {
    mockPost.mockResolvedValueOnce({
      data: {
        token: testToken,
        username: "testuser",
        role: "Admin",
      },
    });

    mockGet.mockResolvedValue({ data: [] });

    render(<App />);

    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "testuser" },
    });

    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "correctpassword" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Login" })
    );

    expect(
      await screen.findByText("testuser", { selector: "strong" })
    ).toBeInTheDocument();

    expect(
      screen.getByText("Admin", { selector: "strong" })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Logout" })
    ).toBeInTheDocument();
  });
  it.each([
  [
    "missing token",
    {
      username: "testuser",
      role: "Admin",
    },
  ],
  [
    "invalid role",
    {
      token: testToken,
      username: "testuser",
      role: "SuperAdmin",
    },
  ],
  [
    "missing username",
    {
      token: testToken,
      username: "",
      role: "Admin",
    },
  ],
])(
  "rejects login when the response contains %s",
  async (_description, responseData) => {
    mockPost.mockResolvedValueOnce({
      data: responseData,
    });

    render(<App />);

    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "testuser" },
    });

    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "correctpassword" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Login" })
    );

    expect(
      await screen.findByText(
        "The server returned invalid login information."
      )
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("heading", {
        name: "Student Registration",
      })
    ).not.toBeInTheDocument();
    
  }
);

});

it("shows a permission error when loading students returns 403", async () => {
  mockPost.mockResolvedValueOnce({
    data: {
      token: testToken,
      username: "testuser",
      role: "Admin",
    },
  });

  mockGet.mockRejectedValueOnce({
    response: { status: 403 },
  });

  render(<App />);

  fireEvent.change(screen.getByLabelText("Username"), {
    target: { value: "testuser" },
  });

  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "correctpassword" },
  });

  fireEvent.click(
    screen.getByRole("button", { name: "Login" })
  );

  expect(
    await screen.findByText(
      "You do not have permission to view students."
    )
  ).toBeInTheDocument();
});
it("shows an error when loading students fails unexpectedly", async () => {
  mockPost.mockResolvedValueOnce({
    data: {
      token: testToken,
      username: "testuser",
      role: "Admin",
    },
  });

  mockGet.mockRejectedValueOnce(
    new Error("Network Error")
  );

  render(<App />);

  fireEvent.change(screen.getByLabelText("Username"), {
    target: { value: "testuser" },
  });

  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "correctpassword" },
  });

  fireEvent.click(
    screen.getByRole("button", { name: "Login" })
  );
  

fireEvent.click(
  screen.getByRole("button", {
    name: /login/i,
  })
);


  expect(
    await screen.findByText(
      "Failed to fetch student data."
    )
  ).toBeInTheDocument();
});


it.skip("shows username required validation", async () => {
  render(<App />);

  fireEvent.change(
    screen.getByLabelText("Password"),
    { target: { value: "password123" } }
  );

  fireEvent.click(
    screen.getByRole("button", { name: /login/i })
  );

  expect(
    await screen.findByText("Username is required.")
  ).toBeInTheDocument();
});