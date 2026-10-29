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

it("shows all students when search is empty", async () => {
  await loginAsAdmin([
    makeStudent({
      id: 1,
      name: "Ravi Kumar",
    }),
    makeStudent({
      id: 2,
      name: "Priya Sharma",
      email: "priya@example.com",
    }),
  ]);

  expect(
    await screen.findByText("Ravi Kumar")
  ).toBeInTheDocument();

  expect(
    screen.getByText("Priya Sharma")
  ).toBeInTheDocument();
});

it("does not show clear search button when search is empty", async () => {
  await loginAsAdmin([
    makeStudent(),
  ]);

  expect(
    screen.queryByTitle("Clear search")
  ).not.toBeInTheDocument();
});

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

it("shows empty state when there are no students", async () => {
  await loginAsAdmin([]);

  expect(
    await screen.findByText(
      "No student data available."
    )
  ).toBeInTheDocument();
});

it("shows view only message for viewer role", async () => {
  await loginAsRole("Viewer", []);

  expect(
    screen.getByText(
      /you can view student information/i
    )
  ).toBeInTheDocument();
});

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

it("shows viewer readonly mode", async () => {
  await loginAsRole("Viewer", [
    makeStudent(),
  ]);

  expect(
    screen.getByText(/you can view student information/i)
  ).toBeInTheDocument();
});