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
  within,
  act,
} from "@testing-library/react";

import userEvent from "@testing-library/user-event";

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

async function loginAsRole(role, students = []) {
  mockPost.mockResolvedValueOnce({
    data: {
      token: testToken,
      username: "testuser",
      role,
    },
  });

  mockGet.mockResolvedValue({ data: students });

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

  await screen.findByRole("heading", {
    name: "Student Registration",
  });
}

async function loginAsAdmin(students = []) {
  return loginAsRole("Admin", students);
}


function makeStudent(overrides = {}) {
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


it("shows Manage Users for Admin", async () => {
  await loginAsAdmin();

  expect(
    screen.getByRole("button", { name: "Manage Users" })
  ).toBeInTheDocument();
});

it("displays the Create New User form for Admin", async () => {
  await loginAsAdmin();

  fireEvent.click(
    screen.getByRole("button", { name: "Manage Users" })
  );

  expect(
    await screen.findByRole("heading", { name: "Manage Users" })
  ).toBeInTheDocument();

  expect(
    screen.getByRole("heading", { name: "Create New User" })
  ).toBeInTheDocument();

  expect(
    document.querySelector("#user-management-username")
  ).toBeInTheDocument();

  expect(
    document.querySelector("#user-management-email")
  ).toBeInTheDocument();
});

it("displays all fields in the Create New User form", async () => {
  await loginAsAdmin();

  fireEvent.click(
    screen.getByRole("button", { name: "Manage Users" })
  );

  expect(await screen.findByLabelText("Username *")).toBeInTheDocument();

  expect(
    screen.getByLabelText("Email *", {
      selector: "#user-management-email",
    })
  ).toBeInTheDocument();

  expect(
    document.querySelector("#user-management-password")
  ).toBeInTheDocument();

  expect(screen.getByLabelText("Role *")).toBeInTheDocument();
});

it("provides the supported roles in the user creation form", async () => {
  await loginAsAdmin();

  fireEvent.click(
    screen.getByRole("button", { name: "Manage Users" })
  );

  const roleSelect = await screen.findByLabelText("Role *");

  expect(roleSelect).toHaveDisplayValue("Viewer");

  ["Admin", "Manager", "Staff", "Viewer"].forEach((role) => {
    expect(
      screen.getByRole("option", { name: role })
    ).toBeInTheDocument();
  });
});

it("closes the Create New User form and resets its fields", async () => {
  const user = userEvent.setup();

  await loginAsAdmin();

  await user.click(
    screen.getByRole("button", { name: /manage users/i })
  );

  const username = document.querySelector(
    "#user-management-username"
  );
  const email = document.querySelector("#user-management-email");
  const password = document.querySelector(
    "#user-management-password"
  );

  expect(username).not.toBeNull();
  expect(email).not.toBeNull();
  expect(password).not.toBeNull();

  await user.type(username, "newstaff");
  await user.type(email, "staff@example.com");
  await user.type(password, "Password123");

  await user.click(
    screen.getByRole("button", { name: /close/i })
  );

  await user.click(
    screen.getByRole("button", { name: /manage users/i })
  );

  expect(await screen.findByLabelText("Username *")).toHaveValue("");

  expect(
    screen.getByLabelText("Email *", {
      selector: "#user-management-email",
    })
  ).toHaveValue("");

  expect(
    document.querySelector("#user-management-password")
  ).toHaveValue("");

  expect(screen.getByLabelText("Role *")).toHaveValue("Viewer");
}, 10000);

it("creates a user successfully", async () => {
  const user = userEvent.setup();

  await loginAsAdmin();

  await user.click(
    screen.getByRole("button", { name: /manage users/i })
  );

  await user.type(
    screen.getByLabelText("Username *"),
    "newstaff"
  );

  await user.type(
    document.querySelector("#user-management-email"),
    "newstaff@example.com"
  );

  await user.type(
    document.querySelector("#user-management-password"),
    "Password123"
  );

  await user.selectOptions(
    screen.getByLabelText("Role *"),
    "Staff"
  );

  mockPost.mockResolvedValueOnce({
    data: { message: "User created successfully" },
  });

  mockGet.mockResolvedValue({ data: [] });

  await user.click(
    screen.getByRole("button", { name: /create user/i })
  );

  await waitFor(() => {
    expect(mockPost).toHaveBeenCalledWith(
      "/User",
      expect.objectContaining({
        username: "newstaff",
        email: "newstaff@example.com",
        password: "Password123",
        role: "Staff",
      }),
      expect.anything()
    );
  });
}, 10000);


 it("shows an error when the new username is empty", async () => {
  const user = userEvent.setup();

  await loginAsAdmin();

  await user.click(
    screen.getByRole("button", { name: /manage users/i })
  );

  const usernameInput = screen.getByLabelText(/username/i);
  const form = usernameInput.closest("form");

  expect(form).not.toBeNull();

  // Find the form's React submit handler.
  const reactPropsKey = Object.keys(form).find(
    (key) =>
      key.startsWith("__reactProps$") &&
      form[key]?.onSubmit
  );

  expect(reactPropsKey).toBeDefined();

  const handleSubmit = form[reactPropsKey].onSubmit;

  await act(async () => {
    await handleSubmit({
      preventDefault: vi.fn(),
    });
  });

  expect(
    await screen.findByText("Username is required.")
  ).toBeInTheDocument();
});



it("does not delete a user when confirmation is cancelled", async () => {
  const confirmSpy = vi
    .spyOn(window, "confirm")
    .mockReturnValue(false);

  try {
    await loginAsAdmin();

    mockGet.mockImplementation((url) => {
      if (String(url).includes("/User")) {
        return Promise.resolve({
          data: [
            {
              id: 2,
              username: "staffuser",
              email: "staff@example.com",
              role: "Staff",
            },
          ],
        });
      }

      return Promise.resolve({ data: [] });
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Manage Users" })
    );

    const userRow = (
      await screen.findByText("staffuser")
    ).closest("tr");

    fireEvent.click(
      within(userRow).getByRole("button", { name: /delete/i })
    );

    expect(confirmSpy).toHaveBeenCalled();
    expect(mockDelete).not.toHaveBeenCalled();
  } finally {
    confirmSpy.mockRestore();
  }
});
  

it.each([
  [
    "server message",
    {
      response: {
        data: { message: "User cannot be deleted." },
      },
    },
    "User cannot be deleted.",
  ],
  [
    "invalid user ID",
    new Error("Invalid record ID"),
    "Invalid user ID.",
  ],
  [
    "generic failure",
    new Error("Delete failed"),
    "Failed to delete user.",
  ],
])(
  "displays the correct message for a user deletion %s error",
  async (_description, error, expectedMessage) => {
    const confirmSpy = vi
      .spyOn(window, "confirm")
      .mockReturnValue(true);

    try {
      await loginAsAdmin();

      mockGet.mockImplementation((url) => {
        if (String(url).includes("/User")) {
          return Promise.resolve({
            data: [
              {
                id: 2,
                username: "staffuser",
                email: "staff@example.com",
                role: "Staff",
              },
            ],
          });
        }

        return Promise.resolve({ data: [] });
      });

      fireEvent.click(
        screen.getByRole("button", { name: "Manage Users" })
      );

      const userRow = (
        await screen.findByText("staffuser")
      ).closest("tr");

      mockDelete.mockRejectedValueOnce(error);

      fireEvent.click(
        within(userRow).getByRole("button", { name: /delete/i })
      );

      expect(
        await screen.findByText(expectedMessage)
      ).toBeInTheDocument();
    } finally {
      confirmSpy.mockRestore();
    }
  }
);

    
it.each([
  [
    "401",
    { response: { status: 401 } },
    "Session expired. Please login again.",
  ],
  [
    "403",
    { response: { status: 403 } },
    "Only Admin can view users.",
  ],
  [
    "500",
    { response: { status: 500 } },
    "Failed to load users.",
  ],
])(
  "handles user-loading error %s",
  async (_status, error, expectedMessage) => {
    await loginAsAdmin();

    mockGet.mockImplementation((url) => {
      if (String(url).includes("/User")) {
        return Promise.reject(error);
      }

      return Promise.resolve({ data: [] });
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Manage Users" })
    );

    expect(
      await screen.findByText(expectedMessage)
    ).toBeInTheDocument();
  }
);
it("shows permission error when create user returns 403", async () => {
  await loginAsAdmin();

  // users load correctly
  mockGet.mockResolvedValueOnce({
    data: [],
  });

  fireEvent.click(
    screen.getByRole("button", {
      name: /manage users/i,
    })
  );

  expect(
    await screen.findByText("Create New User")
  ).toBeInTheDocument();

  fireEvent.change(
    screen.getByLabelText("Username *"),
    {
      target: { value: "newuser" },
    }
  );

  fireEvent.change(
    document.querySelector("#user-management-email"),
    {
      target: { value: "new@test.com" },
    }
  );

  fireEvent.change(
    document.querySelector("#user-management-password"),
    {
      target: { value: "Password123" },
    }
  );

  fireEvent.change(
    document.querySelector("#user-management-role"),
    {
      target: { value: "Staff" },
    }
  );

  mockPost.mockRejectedValueOnce({
    response: {
      status: 403,
    },
  });

  fireEvent.click(
    screen.getByRole("button", {
      name: /create user/i,
    })
  );

  expect(
    await screen.findByText(
      "Only Admin can create users."
    )
  ).toBeInTheDocument();
});


it("does not show a Delete button for the admin user", async () => {
  // First, log in as Admin.
  await loginAsAdmin();

  // Configure the users API mock AFTER loginAsAdmin(),
  // because the helper configures mockGet itself.
  mockGet.mockImplementation((url) => {
    const requestUrl = String(url);

    if (requestUrl.includes("/User")) {
      return Promise.resolve({
        data: [
          {
            id: 1,
            username: "admin",
            email: "admin@example.com",
            role: "Admin",
          },
        ],
      });
    }

    return Promise.resolve({ data: [] });
  });

  // Open Manage Users.
  fireEvent.click(
    screen.getByRole("button", { name: "Manage Users" })
  );

  // Confirm the Manage Users section is displayed.
  expect(
    await screen.findByRole("heading", {
      name: "Manage Users",
    })
  ).toBeInTheDocument();

  // Find the admin row.
  const adminCell = await screen.findByText("admin");
  const adminRow = adminCell.closest("tr");

  expect(adminRow).not.toBeNull();

  // Confirm the admin row does not contain a Delete button.
  expect(
    within(adminRow).queryByRole("button", {
      name: /delete/i,
    })
  ).not.toBeInTheDocument();
});


it("shows error for invalid role", async () => {
  await loginAsAdmin();

  fireEvent.click(
    screen.getByRole("button", {
      name: /manage users/i,
    })
  );

  fireEvent.change(
    screen.getByLabelText("Username *"),
    {
      target: { value: "user1" },
    }
  );

  fireEvent.change(
    document.querySelector("#user-management-email"),
    {
      target: { value: "user@test.com" },
    }
  );

  fireEvent.change(
    document.querySelector("#user-management-password"),
    {
      target: { value: "Password123" },
    }
  );

  fireEvent.change(
    document.querySelector("#user-management-role"),
    {
      target: { value: "InvalidRole" },
    }
  );

  const form = document
    .querySelector("#user-management-username")
    .closest("form");

  fireEvent.submit(form);

  expect(
    await screen.findByText(
      "Please select a valid role."
    )
  ).toBeInTheDocument();
},10000);

it("shows error for short password", async () => {
  await loginAsAdmin();

  fireEvent.click(
    screen.getByRole("button", {
      name: /manage users/i,
    })
  );

  fireEvent.change(
    screen.getByLabelText("Username *"),
    {
      target: { value: "user1" },
    }
  );

  fireEvent.change(
    document.querySelector("#user-management-email"),
    {
      target: { value: "user@test.com" },
    }
  );

  fireEvent.change(
    document.querySelector("#user-management-password"),
    {
      target: { value: "123" },
    }
  );

  const form = document
  .querySelector("#user-management-username")
  .closest("form");

fireEvent.submit(form);


  expect(
    await screen.findByText(
      "Password must be at least 6 characters."
    )
  ).toBeInTheDocument();
}, 10000);

it("shows generic create user failure", async () => {
  await loginAsAdmin();

  fireEvent.click(
    screen.getByRole("button", {
      name: /manage users/i,
    })
  );

  fireEvent.click(
    screen.getByRole("button", {
      name: /create user/i,
    })
  );

  fireEvent.change(
    screen.getByLabelText("Username *"),
    {
      target: { value: "newuser" },
    }
  );

  fireEvent.change(
    document.querySelector("#user-management-email"),
    {
      target: { value: "new@test.com" },
    }
  );

  fireEvent.change(
    document.querySelector("#user-management-password"),
    {
      target: { value: "Password123" },
    }
  );

  fireEvent.change(
    document.querySelector("#user-management-role"),
    {
      target: { value: "Staff" },
    }
  );

  mockPost.mockRejectedValueOnce(
    new Error("Network Error")
  );

  fireEvent.click(
    screen.getByRole("button", {
      name: /create user/i,
    })
  );

  expect(
    await screen.findByText(
      "Failed to create user."
    )
  ).toBeInTheDocument();
});

