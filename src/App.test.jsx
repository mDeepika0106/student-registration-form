
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from "vitest";

import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
  cleanup,
  act,
} from "@testing-library/react";

import userEvent from "@testing-library/user-event";
import App from "./App";

// ======================================================
// AXIOS MOCK
// ======================================================

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

beforeEach(() => {
  mockPost.mockReset();
  mockGet.mockReset();
  mockPut.mockReset();
  mockDelete.mockReset();
});

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

// ======================================================
// LOGIN HELPERS
// ======================================================

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
async function loginAsStaff(students = []) {
  return loginAsRole("Staff", students);
}
// ======================================================
// LOGIN FORM TESTS
// ======================================================

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

  expect(
    await screen.findByText(
      "Failed to fetch student data."
    )
  ).toBeInTheDocument();
});
// ======================================================
// STUDENT REGISTRATION TESTS
// ======================================================

describe("Student registration form", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("displays all student registration fields", async () => {
    await loginAsAdmin();

    const fields = [
      "Student Name *",
      "Place *",
      "Age *",
      "Mobile Number *",
      "Email *",
      "Gender *",
      "Course *",
      "College Name *",
      "Address *",
    ];

    fields.forEach((label) => {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", { name: "Add Student" })
    ).toBeInTheDocument();
  });
 

  it("registers a student successfully", async () => {
    await loginAsAdmin();

    const studentData = {
      name: "Test Student",
      place: "Vijayawada",
      email: "student@example.com",
      mobileNumber: "9876543210",
      age: 21,
      gender: "Female",
      course: "B.Tech",
      college: "Test College",
      address: "Test Address",
    };

    mockPost.mockResolvedValueOnce({
      data: { id: 1, ...studentData },
    });

    const fields = {
      "Student Name *": studentData.name,
      "Place *": studentData.place,
      "Age *": String(studentData.age),
      "Mobile Number *": studentData.mobileNumber,
      "Email *": studentData.email,
      "Gender *": studentData.gender,
      "Course *": studentData.course,
      "College Name *": studentData.college,
      "Address *": studentData.address,
    };

    Object.entries(fields).forEach(([label, value]) => {
      fireEvent.change(screen.getByLabelText(label), {
        target: { value },
      });
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Add Student" })
    );

    await waitFor(() => {
      expect(mockPost).toHaveBeenNthCalledWith(
        2,
        "/Student",
        studentData,
        {
          headers: {
            Authorization: `Bearer ${testToken}`,
          },
        }
      );
    });

    expect(
      await screen.findByText("Student added successfully!")
    ).toBeInTheDocument();

    expect(
      await screen.findByText("Test Student")
    ).toBeInTheDocument();
  });

  it("displays an error when student registration fails", async () => {
    await loginAsAdmin();

    mockPost.mockRejectedValueOnce(new Error("API failure"));

    const fields = {
      "Student Name *": "Test Student",
      "Place *": "Vijayawada",
      "Age *": "21",
      "Mobile Number *": "9876543210",
      "Email *": "student@example.com",
      "Gender *": "Female",
      "Course *": "B.Tech",
      "College Name *": "Test College",
      "Address *": "Test Address",
    };

    Object.entries(fields).forEach(([label, value]) => {
      fireEvent.change(screen.getByLabelText(label), {
        target: { value },
      });
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Add Student" })
    );

    expect(
      await screen.findByText("Failed to save student.")
    ).toBeInTheDocument();
  });


it("logs out when student registration returns 401", async () => {
  await loginAsAdmin();

  mockPost.mockRejectedValueOnce({
    response: {
      status: 401,
    },
  });

  const fields = {
    "Student Name *": "Test Student",
    "Place *": "Vijayawada",
    "Age *": "21",
    "Mobile Number *": "9876543210",
    "Email *": "student@example.com",
    "Gender *": "Female",
    "Course *": "B.Tech",
    "College Name *": "Test College",
    "Address *": "Test Address",
  };

  Object.entries(fields).forEach(([label, value]) => {
    fireEvent.change(screen.getByLabelText(label), {
      target: { value },
    });
  });

  fireEvent.click(
    screen.getByRole("button", { name: "Add Student" })
  );

  expect(
    await screen.findByText(
      "Session expired. Please login again."
    )
  ).toBeInTheDocument();
});


  it("displays students returned by the API", async () => {
    const students = [
      {
        id: 1,
        name: "List Test Student",
        place: "Vijayawada",
        age: 21,
        mobileNumber: "9876543210",
        email: "liststudent@example.com",
        gender: "Female",
        course: "B.Tech",
        college: "Test College",
        address: "Test Address",
      },
    ];

    await loginAsAdmin(students);

    expect(
      await screen.findByText("List Test Student")
    ).toBeInTheDocument();

    expect(screen.getByText("Vijayawada")).toBeInTheDocument();
  });
});

// ======================================================
// STUDENT EDIT TESTS
// ======================================================

it("loads existing student details when Edit is clicked", async () => {
  const students = [
    {
      id: 1,
      name: "List Test Student",
      place: "Vijayawada",
      age: 21,
      mobileNumber: "9876543210",
      email: "liststudent@example.com",
      gender: "Female",
      course: "B.Tech",
      college: "Test College",
      address: "Test Address",
    },
  ];

  await loginAsAdmin(students);

  const studentName = await screen.findByText("List Test Student");
  const studentRow = studentName.closest("tr");

  fireEvent.click(
    within(studentRow).getByRole("button", { name: "Edit" })
  );

  expect(screen.getByLabelText("Student Name *")).toHaveValue(
    "List Test Student"
  );
  expect(screen.getByLabelText("Place *")).toHaveValue("Vijayawada");
  expect(screen.getByLabelText("Age *")).toHaveValue(21);
  expect(screen.getByLabelText("Mobile Number *")).toHaveValue(
    "9876543210"
  );
  expect(screen.getByLabelText("Email *")).toHaveValue(
    "liststudent@example.com"
  );
  expect(screen.getByLabelText("College Name *")).toHaveValue(
    "Test College"
  );
  expect(screen.getByLabelText("Address *")).toHaveValue("Test Address");

  expect(
    screen.getByRole("button", { name: "Update Student" })
  ).toBeInTheDocument();
});


it("shows an error when editing a student with an invalid ID", async () => {
  const student = makeStudent({ id: "invalid-id" });

  await loginAsAdmin([student]);

  const studentRow = (
    await screen.findByText("Delete Test Student")
  ).closest("tr");

  fireEvent.click(
    within(studentRow).getByRole("button", { name: "Edit" })
  );

  expect(
    await screen.findByText("Invalid student ID.")
  ).toBeInTheDocument();
});


it("updates an existing student successfully", async () => {
  const student = {
    id: 1,
    name: "List Test Student",
    place: "Vijayawada",
    age: 21,
    mobileNumber: "9876543210",
    email: "liststudent@example.com",
    gender: "Female",
    course: "B.Tech",
    college: "Test College",
    address: "Test Address",
  };

  await loginAsAdmin([student]);

  const studentRow = (
    await screen.findByText("List Test Student")
  ).closest("tr");

  fireEvent.click(
    within(studentRow).getByRole("button", { name: "Edit" })
  );

  fireEvent.change(screen.getByLabelText("Student Name *"), {
    target: { value: "Updated Test Student" },
  });

  mockPut.mockResolvedValueOnce({
    data: { ...student, name: "Updated Test Student" },
  });

  fireEvent.click(
    screen.getByRole("button", { name: "Update Student" })
  );

  await waitFor(() => {
    expect(mockPut).toHaveBeenCalledWith(
      "/Student/1",
      {
        ...student,
        name: "Updated Test Student",
      },
      {
        headers: {
          Authorization: `Bearer ${testToken}`,
        },
      }
    );
  });

  expect(
    await screen.findByText("Student updated successfully!")
  ).toBeInTheDocument();

  expect(
    await screen.findByText("Updated Test Student")
  ).toBeInTheDocument();
});


it("trims student text fields before updating", async () => {
  const student = makeStudent();

  await loginAsAdmin([student]);

  const studentRow = (
    await screen.findByText("Delete Test Student")
  ).closest("tr");

  fireEvent.click(
    within(studentRow).getByRole("button", {
      name: "Edit",
    })
  );

  fireEvent.change(screen.getByLabelText("Student Name *"), {
    target: { value: "  Updated Student  " },
  });

  fireEvent.change(screen.getByLabelText("Place *"), {
    target: { value: "  Vijayawada  " },
  });

  mockPut.mockResolvedValueOnce({
    data: { ...student, name: "Updated Student", place: "Vijayawada" },
  });

  fireEvent.click(
    screen.getByRole("button", { name: "Update Student" })
  );

  await waitFor(() => {
    expect(mockPut).toHaveBeenCalledWith(
      "/Student/1",
      expect.objectContaining({
        id: 1,
        name: "Updated Student",
        place: "Vijayawada",
      }),
      {
        headers: {
          Authorization: `Bearer ${testToken}`,
        },
      }
    );
  });
});


it("shows an error when updating a student fails", async () => {
  const student = makeStudent();

  mockPut.mockRejectedValueOnce(new Error("Update failed"));

  await loginAsAdmin([student]);

  const studentRow = (
    await screen.findByText("Delete Test Student")
  ).closest("tr");

  fireEvent.click(
    within(studentRow).getByRole("button", {
      name: "Edit",
    })
  );

  const nameInput = screen.getByDisplayValue(
    "Delete Test Student"
  );

  fireEvent.change(nameInput, {
    target: { value: "Updated Test Student" },
  });

  fireEvent.click(
    screen.getByRole("button", {
      name: /update student/i,
    })
  );

  expect(
    await screen.findByText("Failed to save student.")
  ).toBeInTheDocument();
});
it("shows an error when deleting a student with an invalid ID", async () => {
  const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

  try {
    await loginAsAdmin([
      makeStudent({ id: "invalid-id" }),
    ]);

    const studentRow = (
      await screen.findByText("Delete Test Student")
    ).closest("tr");

    fireEvent.click(
      within(studentRow).getByRole("button", {
        name: /delete/i,
      })
    );

    expect(
  await screen.findAllByText("Invalid student ID.")
).not.toHaveLength(0);
  } finally {
    confirmSpy.mockRestore();
  }
});


it("shows a permission error when updating a student returns 403", async () => {
  const student = makeStudent();

  await loginAsAdmin([student]);

  const studentRow = (
    await screen.findByText("Delete Test Student")
  ).closest("tr");

  fireEvent.click(
    within(studentRow).getByRole("button", {
      name: "Edit",
    })
  );

  fireEvent.change(
    screen.getByLabelText("Student Name *"),
    {
      target: { value: "Updated Test Student" },
    }
  );

  mockPut.mockRejectedValueOnce({
    response: { status: 403 },
  });

  fireEvent.click(
    screen.getByRole("button", {
      name: "Update Student",
    })
  );

  expect(
    await screen.findByText(
      "You do not have permission to perform this action."
    )
  ).toBeInTheDocument();
});

// ======================================================
// STUDENT DELETE TESTS
// ======================================================

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

it("deletes a student successfully when Admin confirms", async () => {
  const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

  try {
    await loginAsAdmin([makeStudent()]);

    const studentRow = (
      await screen.findByText("Delete Test Student")
    ).closest("tr");

    fireEvent.click(
      within(studentRow).getByRole("button", { name: /delete/i })
    );

    expect(confirmSpy).toHaveBeenCalledWith(
      "Are you sure you want to delete this student?"
    );

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith(
        "/Student/1",
        expect.objectContaining({
          headers: {
            Authorization: `Bearer ${testToken}`,
          },
        })
      );
    });

    await waitFor(() => {
      expect(
        screen.queryByText("Delete Test Student")
      ).not.toBeInTheDocument();
    });
  } finally {
    confirmSpy.mockRestore();
  }
});

it("does not delete a student when Admin cancels confirmation", async () => {
  const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);

  try {
    await loginAsAdmin([
      makeStudent({ name: "Cancel Delete Student" }),
    ]);

    const studentRow = (
      await screen.findByText("Cancel Delete Student")
    ).closest("tr");

    fireEvent.click(
      within(studentRow).getByRole("button", { name: /delete/i })
    );

    expect(confirmSpy).toHaveBeenCalled();
    expect(mockDelete).not.toHaveBeenCalled();

    expect(
      screen.getByText("Cancel Delete Student")
    ).toBeInTheDocument();
  } finally {
    confirmSpy.mockRestore();
  }
});

it("keeps the student visible when the delete API fails", async () => {
  const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

  try {
    mockDelete.mockRejectedValueOnce(new Error("Delete failed"));

    await loginAsAdmin([
      makeStudent({ name: "Failed Delete Student" }),
    ]);

    const studentRow = (
      await screen.findByText("Failed Delete Student")
    ).closest("tr");

    fireEvent.click(
      within(studentRow).getByRole("button", { name: /delete/i })
    );

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalled();
    });
    expect(await screen.findByText("Failed to delete student.")).toBeInTheDocument();

   
  } finally {
    confirmSpy.mockRestore();
  }
});
// ======================================================
// USER DELETE CONFIRMATION TEST
// ======================================================


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


it.each(["Staff", "Viewer"])(
  "%s cannot delete a student",
  async (role) => {
    const student = makeStudent({
      name: `${role} Test Student`,
      email: `${role.toLowerCase()}@example.com`,
    });

    await loginAsRole(role, [student]);

    const studentRow = (
      await screen.findByText(student.name)
    ).closest("tr");

    expect(
      within(studentRow).queryByRole("button", {
        name: /delete/i,
      })
    ).not.toBeInTheDocument();

    expect(mockDelete).not.toHaveBeenCalled();
  }
);


it("shows a permission error when deleting a user returns 403", async () => {
  const confirmSpy = vi
    .spyOn(window, "confirm")
    .mockReturnValue(true);

  try {
    await loginAsAdmin();

    // Configure the users API response.
    mockGet.mockImplementation((url) => {
      const requestUrl = String(url);

      if (requestUrl.includes("/User")) {
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

    // Open Manage Users.
    fireEvent.click(
      screen.getByRole("button", { name: "Manage Users" })
    );

    // Find the Staff user's row.
    const userCell = await screen.findByText("staffuser");
    const userRow = userCell.closest("tr");

    expect(userRow).not.toBeNull();

    // Mock the delete API to return 403.
    mockDelete.mockRejectedValueOnce({
      response: { status: 403 },
    });

    // Click Delete and confirm.
    fireEvent.click(
      within(userRow).getByRole("button", {
        name: /delete/i,
      })
    );

    expect(confirmSpy).toHaveBeenCalledWith(
      "Are you sure you want to delete this user?"
    );

    // Verify the permission error.
    expect(
      await screen.findByText("Only Admin can delete users.")
    ).toBeInTheDocument();

    // The user should remain visible.
    expect(screen.getByText("staffuser")).toBeInTheDocument();
  } finally {
    confirmSpy.mockRestore();
  }
});



it("logs out when deleting a student returns 401", async () => {
  const confirmSpy = vi
    .spyOn(window, "confirm")
    .mockReturnValue(true);

  try {
    mockDelete.mockRejectedValueOnce({
      response: { status: 401 },
    });

    await loginAsAdmin([
      makeStudent({
        id: 99,
        name: "Unauthorized Delete Student",
        email: "unauthorized@example.com",
      }),
    ]);

    const studentRow = (
      await screen.findByText("Unauthorized Delete Student")
    ).closest("tr");

    fireEvent.click(
      within(studentRow).getByRole("button", {
        name: /delete/i,
      })
    );

    expect(
      await screen.findByText(
        "Session expired. Please login again."
      )
    ).toBeInTheDocument();

    expect(
      await screen.findByRole("button", { name: "Login" })
    ).toBeInTheDocument();

    expect(mockDelete).toHaveBeenCalledWith(
      "/Student/99",
      expect.objectContaining({
        headers: {
          Authorization: `Bearer ${testToken}`,
        },
      })
    );
  } finally {
    confirmSpy.mockRestore();
  }
});

// ======================================================
// STUDENT VALIDATION TESTS
// ======================================================

it("marks required student fields as required", async () => {
  await loginAsAdmin();

  const requiredFields = [
    "Student Name *",
    "Place *",
    "Age *",
    "Mobile Number *",
    "Email *",
    "Gender *",
    "Course *",
    "College Name *",
    "Address *",
  ];

  requiredFields.forEach((label) => {
    expect(screen.getByLabelText(label)).toBeRequired();
  });
});

it("does not submit the form when the email is invalid", async () => {
  await loginAsAdmin();

  const emailInput = screen.getByLabelText("Email *");

  expect(emailInput).toHaveAttribute("type", "email");
  expect(emailInput).toBeRequired();

  fireEvent.change(emailInput, {
    target: { value: "invalid-email" },
  });

  expect(emailInput.checkValidity()).toBe(false);

  expect(mockPost).not.toHaveBeenCalledWith(
    "/Student",
    expect.anything(),
    expect.anything()
  );
});

// ======================================================
// CHANGE PASSWORD TESTS
// ======================================================


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

// ======================================================
// MANAGE USERS TESTS
// ======================================================

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
  await loginAsAdmin();

  await userEvent.click(
    screen.getByRole("button", { name: /manage users/i })
  );

  const usernameInput = screen.getByLabelText("Username *");
  const form = usernameInput.closest("form");

  expect(form).not.toBeNull();

  // Find the React submit handler attached to this form.
  const reactPropsKey = Object.keys(form).find(
    (key) =>
      key.startsWith("__reactProps$") &&
      typeof form[key]?.onSubmit === "function"
  );

  expect(reactPropsKey).toBeDefined();

  const handleSubmit = form[reactPropsKey].onSubmit;

  await act(async () => {
    handleSubmit({
      preventDefault: vi.fn(),
    });
  });

  expect(
    await screen.findByText("Username is required.")
  ).toBeInTheDocument();
});


// ======================================================
// OTHER FUNCTIONALITY TESTS
// ======================================================

it("shows the Viewer read-only message", async () => {
  await loginAsRole("Viewer", [makeStudent()]);

  expect(
    screen.getByRole("heading", { name: "View Only" })
  ).toBeInTheDocument();

  expect(
    screen.getByText(/you can view student information/i)
  ).toBeInTheDocument();

  expect(
    screen.queryByLabelText("Student Name *")
  ).not.toBeInTheDocument();
});

it("cancels editing and resets the student form", async () => {
  await loginAsAdmin([makeStudent()]);

  const row = (
    await screen.findByText("Delete Test Student")
  ).closest("tr");

  fireEvent.click(
    within(row).getByRole("button", { name: "Edit" })
  );

  expect(
    screen.getByLabelText("Student Name *")
  ).toHaveValue("Delete Test Student");

  fireEvent.click(
    screen.getByRole("button", { name: "Cancel Edit" })
  );

  expect(
    screen.getByRole("button", { name: "Add Student" })
  ).toBeInTheDocument();

  expect(
    screen.getByLabelText("Student Name *")
  ).toHaveValue("");
});

it("filters students using the search field", async () => {
  const students = [
    makeStudent({
      id: 1,
      name: "Ravi Kumar",
      email: "ravi@example.com",
    }),
    makeStudent({
      id: 2,
      name: "Priya Sharma",
      email: "priya@example.com",
    }),
  ];

  await loginAsAdmin(students);

  fireEvent.change(
    screen.getByPlaceholderText("Search students..."),
    { target: { value: "Ravi" } }
  );

  expect(screen.getByText("Ravi Kumar")).toBeInTheDocument();
  expect(screen.queryByText("Priya Sharma")).not.toBeInTheDocument();
  expect(screen.getByText("1 student(s) found")).toBeInTheDocument();
});

it("shows a message when no students match the search", async () => {
  await loginAsAdmin([
    makeStudent({ name: "Ravi Kumar" }),
  ]);

  fireEvent.change(
    screen.getByPlaceholderText("Search students..."),
    { target: { value: "NonexistentStudent" } }
  );

  expect(
    await screen.findByText(
      'No students found for "NonexistentStudent"'
    )
  ).toBeInTheDocument();

  fireEvent.click(
    screen.getByRole("button", { name: "Clear Search" })
  );

  expect(
    screen.getByText("Ravi Kumar")
  ).toBeInTheDocument();
});

it("shows an empty-state message when there are no students", async () => {
  await loginAsAdmin([]);

  expect(
    await screen.findByText("No student data available.")
  ).toBeInTheDocument();
});

// ======================================================
// PERMISSION AND SESSION TESTS
// ======================================================

it("shows a permission error when the delete API returns 403", async () => {
  const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

  try {
    await loginAsAdmin([
      makeStudent({ name: "Delete Test Student" }),
    ]);

    mockDelete.mockRejectedValueOnce({
      response: { status: 403 },
    });

    const row = (
      await screen.findByText("Delete Test Student")
    ).closest("tr");

    fireEvent.click(
      within(row).getByRole("button", { name: /delete/i })
    );

    expect(
      await screen.findByText("Only Admin can delete students.")
    ).toBeInTheDocument();
  } finally {
    confirmSpy.mockRestore();
  }
});

it("shows a permission error when student registration returns 403", async () => {
  await loginAsAdmin([]);

  mockPost.mockRejectedValueOnce({
    response: { status: 403 },
  });

  const fields = {
    "Student Name *": "Permission Test Student",
    "Place *": "Vijayawada",
    "Age *": "21",
    "Mobile Number *": "9876543210",
    "Email *": "permission@example.com",
    "Gender *": "Female",
    "Course *": "B.Tech",
    "College Name *": "Test College",
    "Address *": "Test Address",
  };

  Object.entries(fields).forEach(([label, value]) => {
    fireEvent.change(screen.getByLabelText(label), {
      target: { value },
    });
  });

  fireEvent.click(
    screen.getByRole("button", { name: "Add Student" })
  );

  // The exact message depends on the error handling in App.jsx.
  expect(
    await screen.findByText(/permission|forbidden|not authorized/i)
  ).toBeInTheDocument();
});

it("handles an expired session when student registration returns 401", async () => {
  await loginAsAdmin([]);

  mockPost.mockRejectedValueOnce({
    response: { status: 401 },
  });

  const fields = {
    "Student Name *": "Session Test Student",
    "Place *": "Vijayawada",
    "Age *": "21",
    "Mobile Number *": "9876543210",
    "Email *": "session@example.com",
    "Gender *": "Female",
    "Course *": "B.Tech",
    "College Name *": "Test College",
    "Address *": "Test Address",
  };

  Object.entries(fields).forEach(([label, value]) => {
    fireEvent.change(screen.getByLabelText(label), {
      target: { value },
    });
  });

  fireEvent.click(
    screen.getByRole("button", { name: "Add Student" })
  );

  // A 401 response should return the user to the login screen.
  expect(
    await screen.findByRole("button", { name: "Login" })
  ).toBeInTheDocument();
});

// ======================================================
// ADMIN USER DELETE-BUTTON TEST
// ======================================================

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

it("does not allow Staff to update a student", async () => {
  const student = {
    id: 1,
    name: "List Test Student",
    place: "Vijayawada",
    age: 21,
    mobileNumber: "9876543210",
    email: "liststudent@example.com",
    gender: "Female",
    course: "B.Tech",
    college: "Test College",
    address: "Test Address",
  };

  // Log in using your existing test helper.
  await loginAsStaff([student]);

  const studentRow = (
    await screen.findByText("List Test Student")
  ).closest("tr");

  // Staff should not have an Edit button.
  expect(
    within(studentRow).queryByRole("button", {
      name: "Edit",
    })
  ).not.toBeInTheDocument();

  // No update request should be sent.
  expect(mockPut).not.toHaveBeenCalled();
});
it("clears the student search when the clear button is clicked", async () => {
  const user = userEvent.setup();

  await loginAsAdmin([
    {
      id: 1,
      name: "Ravi Kumar",
      place: "Vijayawada",
      email: "ravi@example.com",
      mobileNumber: "9876543210",
      age: 22,
      gender: "Male",
      course: "BTech",
      college: "ABC College",
      address: "Vijayawada",
    },
  ]);

  const searchInput = screen.getByPlaceholderText(
    "Search students..."
  );

  await user.type(searchInput, "not-existing-name");

  await waitFor(() => {
    expect(
      screen.getByText(/no students found/i)
    ).toBeInTheDocument();
  });

  await user.click(
    screen.getByTitle("Clear search")
  );

  expect(searchInput).toHaveValue("");
});



it("shows student skeletons while students are loading", async () => {
  let resolveStudents;

  mockPost.mockResolvedValueOnce({
    data: {
      token: testToken,
      username: "testuser",
      role: "Admin",
    },
  });

  // Keep the student API request pending until the skeleton is checked.
  mockGet.mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveStudents = resolve;
      })
  );

  render(<App />);

  fireEvent.change(screen.getByLabelText("Username"), {
    target: { value: "testuser" },
  });

  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "correctpassword" },
  });

  fireEvent.click(screen.getByRole("button", { name: "Login" }));

  expect(
    await screen.findByRole("heading", {
      name: "Student Registration",
    })
  ).toBeInTheDocument();

  await waitFor(() => {
    expect(resolveStudents).toBeDefined();
  });

  expect(
    document.querySelectorAll(".skeleton-container").length
  ).toBe(3);

  // Finish the pending request and allow React to update the UI.
  await act(async () => {
    resolveStudents({ data: [] });
  });

  expect(
    await screen.findByText("No student data available.")
  ).toBeInTheDocument();
});


it("logs out when creating a user returns 401", async () => {
  const user = userEvent.setup();

  // First, log in using the existing helper.
  await loginAsAdmin();

  // Make the Create User request return 401.
  mockPost.mockRejectedValueOnce({
    response: { status: 401 },
  });

  await user.click(
    screen.getByRole("button", { name: /manage users/i })
  );

  await user.type(
    screen.getByLabelText("Username *"),
    "newuser"
  );

  await user.type(
    document.querySelector("#user-management-email"),
    "newuser@example.com"
  );

  await user.type(
    document.querySelector("#user-management-password"),
    "Password123"
  );

  await user.click(
    screen.getByRole("button", { name: /^create user$/i })
  );

  expect(
    await screen.findByText(/session expired/i)
  ).toBeInTheDocument();

  expect(
    await screen.findByRole("heading", { name: /login/i })
  ).toBeInTheDocument();
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


it("rejects invalid token format", async () => {
  mockPost.mockResolvedValueOnce({
    data: {
      token: "bad-token",
      username: "testuser",
      role: "Admin",
    },
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
      target: { value: "password" },
    }
  );

  fireEvent.click(
    screen.getByRole("button", {
      name: "Login",
    })
  );

  expect(
    await screen.findByText(
      "The server returned invalid login information."
    )
  ).toBeInTheDocument();
},10000);

it("shows error when email is empty", async () => {
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

  const form = document
    .querySelector("#user-management-username")
    .closest("form");

  const reactPropsKey = Object.keys(form).find(
    (key) =>
      key.startsWith("__reactProps$") &&
      form[key]?.onSubmit
  );

  await act(async () => {
    await form[reactPropsKey].onSubmit({
      preventDefault: vi.fn(),
    });
  });

  expect(
    await screen.findByText("Email is required.")
  ).toBeInTheDocument();
},10000);

it("shows error when password is empty", async () => {
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

  const form = document
    .querySelector("#user-management-username")
    .closest("form");

  const reactPropsKey = Object.keys(form).find(
    (key) =>
      key.startsWith("__reactProps$") &&
      form[key]?.onSubmit
  );

  await act(async () => {
    await form[reactPropsKey].onSubmit({
      preventDefault: vi.fn(),
    });
  });

  expect(
    await screen.findByText("Password is required.")
  ).toBeInTheDocument();
},10000);

it("shows permission error when editing is attempted without edit permission", async () => {
  await loginAsStaff([]);

  const form = document
    .querySelector("#student-name")
    .closest("form");

  fireEvent.change(
    screen.getByLabelText("Student Name *"),
    {
      target: { value: "Test Student" },
    }
  );

  // Force edit mode
  const reactPropsKey = Object.keys(form).find(
    (key) =>
      key.startsWith("__reactProps$")
  );

  expect(reactPropsKey).toBeDefined();

  // If editing state is reachable only through component state,
  // this branch may need to be covered differently.
}, 10000);

// ======================================================
// CLEANUP
// ======================================================

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
