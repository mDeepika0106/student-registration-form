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
  vi.clearAllMocks();

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


it("opens the Change Password form", async () => {
  await loginAsAdmin();

  fireEvent.click(
    screen.getByRole("button", { name: "Change Password" })
  );

  expect(screen.getByLabelText("Current Password")).toBeInTheDocument();
  expect(screen.getByLabelText("New Password")).toBeInTheDocument();
  expect(
    screen.getByLabelText("Confirm New Password")
  ).toBeInTheDocument();
});

it("closes the Change Password form when Cancel is clicked", async () => {
  await loginAsAdmin();

  fireEvent.click(
    screen.getByRole("button", { name: "Change Password" })
  );

  expect(screen.getByLabelText("Current Password")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

  await waitFor(() => {
    expect(
      screen.queryByLabelText("Current Password")
    ).not.toBeInTheDocument();
  });
});


it("shows all Change Password fields", async () => {
  await loginAsAdmin();

  fireEvent.click(
    screen.getByRole("button", { name: "Change Password" })
  );

  expect(document.querySelector("#current-password")).toBeInTheDocument();
  expect(document.querySelector("#new-password")).toBeInTheDocument();
  expect(
    document.querySelector("#confirm-new-password")
  ).toBeInTheDocument();
});

it("displays the minimum password length hint", async () => {
  await loginAsAdmin();

  fireEvent.click(
    screen.getByRole("button", { name: "Change Password" })
  );

  expect(
    screen.getByText("Password must contain at least 6 characters.")
  ).toBeInTheDocument();
});

it("displays the API error message when changing password fails", async () => {
  await loginAsAdmin();

  mockPost.mockRejectedValueOnce({
    response: {
      data: { message: "Current password is incorrect." },
    },
  });

  fireEvent.click(
    screen.getByRole("button", { name: "Change Password" })
  );

  fireEvent.change(screen.getByLabelText("Current Password"), {
    target: { value: "WrongPassword123" },
  });

  fireEvent.change(screen.getByLabelText("New Password"), {
    target: { value: "NewPassword123" },
  });

  fireEvent.change(screen.getByLabelText("Confirm New Password"), {
    target: { value: "NewPassword123" },
  });

fireEvent.click(
  document.querySelector(
    'form button[type="submit"]'
  )
);
  await waitFor(() => {
    expect(
      screen.getByText("Current password is incorrect.")
    ).toBeInTheDocument();
  });
});

it("shows an error when the current password is empty", async () => {
  await loginAsAdmin();

  fireEvent.click(
    screen.getByRole("button", { name: "Change Password" })
  );

  fireEvent.change(screen.getByLabelText("New Password"), {
    target: { value: "NewPassword123" },
  });

  fireEvent.change(
    screen.getByLabelText("Confirm New Password"),
    { target: { value: "NewPassword123" } }
  );

  const form = document
    .querySelector("#current-password")
    .closest("form");

  fireEvent.submit(form);

  expect(
    await screen.findByText("Enter your current password.")
  ).toBeInTheDocument();
  expect(mockPost).not.toHaveBeenCalledWith(
    "/Auth/change-password",
    expect.anything(),
    expect.anything()
  );
});

it("shows an error when the new password is empty", async () => {
  await loginAsAdmin();

  fireEvent.click(
    screen.getByRole("button", { name: "Change Password" })
  );

  fireEvent.change(screen.getByLabelText("Current Password"), {
    target: { value: "OldPassword123" },
  });

  fireEvent.change(
    screen.getByLabelText("Confirm New Password"),
    { target: { value: "" } }
  );

  const form = document
    .querySelector("#new-password")
    .closest("form");

  fireEvent.submit(form);

  expect(
    await screen.findByText("Enter your new password.")
  ).toBeInTheDocument();
});


it("displays a generic error when changing password fails unexpectedly", async () => {
  await loginAsAdmin();

  mockPost.mockRejectedValueOnce(new Error("Network Error"));

  fireEvent.click(
    screen.getByRole("button", { name: "Change Password" })
  );

  fireEvent.change(screen.getByLabelText("Current Password"), {
    target: { value: "OldPassword123" },
  });

  fireEvent.change(screen.getByLabelText("New Password"), {
    target: { value: "NewPassword123" },
  });

  fireEvent.change(screen.getByLabelText("Confirm New Password"), {
    target: { value: "NewPassword123" },
  });

  fireEvent.click(
  document.querySelector(
    'form button[type="submit"]'
  )
);

  await waitFor(() => {
    expect(
      screen.getByText("Failed to change password.")
    ).toBeInTheDocument();
  });
});


it("logs out when changing password returns 401", async () => {
  await loginAsAdmin();

  mockPost.mockRejectedValueOnce({
    response: { status: 401 },
  });

  fireEvent.click(
    screen.getByRole("button", { name: "Change Password" })
  );

  fireEvent.change(screen.getByLabelText("Current Password"), {
    target: { value: "OldPassword123" },
  });

  fireEvent.change(screen.getByLabelText("New Password"), {
    target: { value: "NewPassword123" },
  });

  fireEvent.change(screen.getByLabelText("Confirm New Password"), {
    target: { value: "NewPassword123" },
  });

 fireEvent.click(
  document.querySelector(
    'form button[type="submit"]'
  )
);
  await waitFor(() => {
    expect(
      screen.getByText("Session expired. Please login again.")
    ).toBeInTheDocument();
  });
});


it("rejects a new password shorter than 6 characters", async () => {
  const user = userEvent.setup();

  await loginAsAdmin();

  await user.click(
    screen.getByRole("button", { name: "Change Password" })
  );

  await user.type(
    document.querySelector("#current-password"),
    "OldPassword123"
  );

  await user.type(
    document.querySelector("#new-password"),
    "abc"
  );

  await user.type(
    document.querySelector("#confirm-new-password"),
    "abc"
  );

  const form = document
    .querySelector("#new-password")
    .closest("form");

  await user.click(
    within(form).getByRole("button", {
      name: /change password/i,
    })
  );

  expect(
    await screen.findByText(
      "Password must contain at least 6 characters."
    )
  ).toBeInTheDocument();

    expect(mockPost).not.toHaveBeenCalledWith(
    "/Auth/change-password",
    expect.anything(),
    expect.anything()
  );
}, 10000);

it("changes the password successfully", async () => {
  const user = userEvent.setup();

  await loginAsAdmin();

  await user.click(
    screen.getByRole("button", { name: "Change Password" })
  );

  await user.type(
    document.querySelector("#current-password"),
    "OldPassword123"
  );

  await user.type(
    document.querySelector("#new-password"),
    "NewPassword123"
  );

  await user.type(
    document.querySelector("#confirm-new-password"),
    "NewPassword123"
  );

  mockPost.mockResolvedValueOnce({
    data: { message: "Password changed successfully" },
  });

  const form = document
    .querySelector("#new-password")
    .closest("form");

  await user.click(
    within(form).getByRole("button", {
      name: /change password/i,
    })
  );

  await waitFor(() => {
    expect(mockPost).toHaveBeenCalledWith(
      "/Auth/change-password",
      {
        currentPassword: "OldPassword123",
        newPassword: "NewPassword123",
        confirmNewPassword: "NewPassword123",
      },
      expect.anything()
    );
  });

  await waitFor(() => {
    expect(
      screen.queryByLabelText("Current Password")
    ).not.toBeInTheDocument();
  });
}, 10000);


it("shows error when passwords do not match", async () => {
  await loginAsAdmin();

  fireEvent.click(
    screen.getByRole("button", {
      name: "Change Password",
    })
  );

  fireEvent.change(
    screen.getByLabelText("Current Password"),
    {
      target: { value: "OldPassword123" },
    }
  );

  fireEvent.change(
    screen.getByLabelText("New Password"),
    {
      target: { value: "NewPassword123" },
    }
  );

  fireEvent.change(
    screen.getByLabelText("Confirm New Password"),
    {
      target: { value: "DifferentPassword" },
    }
  );

  const form = document
    .querySelector("#current-password")
    .closest("form");

  fireEvent.submit(form);

  expect(
    await screen.findByText(
      "New passwords do not match."
    )
  ).toBeInTheDocument();
}, 10000);
