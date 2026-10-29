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


async function loginAsStaff(students = []) {
  return loginAsRole("Staff", students);
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

it("shows invalid student ID when update receives invalid record ID", async () => {
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
      target: { value: "Updated Student" },
    }
  );

  mockPut.mockRejectedValueOnce(
    new Error("Invalid record ID")
  );

  fireEvent.click(
    screen.getByRole("button", {
      name: /update student/i,
    })
  );

  expect(
    await screen.findByText("Invalid student ID.")
  ).toBeInTheDocument();
});

it("logs out when updating a student returns 401", async () => {
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

  mockPut.mockRejectedValueOnce({
    response: {
      status: 401,
    },
  });

  fireEvent.click(
    screen.getByRole("button", {
      name: /update student/i,
    })
  );

  expect(
    await screen.findByText(
      "Session expired. Please login again."
    )
  ).toBeInTheDocument();
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

it("shows permission message when editing is attempted without permission", async () => {
  await loginAsRole("Viewer", []);

  expect(
    screen.getByText(/you can view student information/i)
  ).toBeInTheDocument();
});