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
  vi.clearAllMocks();

  mockPost.mockReset();
  mockGet.mockReset();
  mockPut.mockReset();
  mockDelete.mockReset();
});

async function loginAsAdmin(students = []) {
  mockPost.mockResolvedValueOnce({
    data: {
      token: testToken,
      username: "testuser",
      role: "Admin",
    },
  });

  mockGet.mockResolvedValue({
    data: students,
  });

  render(<App />);

  fireEvent.change(
    screen.getByLabelText("Username"),
    {
      target: {
        value: "testuser",
      },
    }
  );

  fireEvent.change(
    screen.getByLabelText("Password"),
    {
      target: {
        value: "correctpassword",
      },
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

        it("clears the form after adding a student", async () => {
  await loginAsAdmin();

  mockPost.mockResolvedValueOnce({
    data: {
      id: 1,
      name: "Test Student",
    },
  });

  fireEvent.change(
    screen.getByLabelText("Student Name *"),
    {
      target: { value: "Test Student" },
    }
  );

  fireEvent.change(
    screen.getByLabelText("Place *"),
    {
      target: { value: "Vijayawada" },
    }
  );

  fireEvent.change(
    screen.getByLabelText("Age *"),
    {
      target: { value: "21" },
    }
  );

  fireEvent.change(
    screen.getByLabelText("Mobile Number *"),
    {
      target: { value: "9876543210" },
    }
  );

  fireEvent.change(
    screen.getByLabelText("Email *"),
    {
      target: { value: "student@test.com" },
    }
  );

  fireEvent.change(
    screen.getByLabelText("Gender *"),
    {
      target: { value: "Male" },
    }
  );

  fireEvent.change(
    screen.getByLabelText("Course *"),
    {
      target: { value: "B.Tech" },
    }
  );

  fireEvent.change(
    screen.getByLabelText("College Name *"),
    {
      target: { value: "ABC College" },
    }
  );

  fireEvent.change(
    screen.getByLabelText("Address *"),
    {
      target: { value: "Address" },
    }
  );

  fireEvent.click(
    screen.getByRole("button", {
      name: "Add Student",
    })
  );

  await screen.findByText(
    "Student added successfully!"
  );

  expect(
    screen.getByLabelText("Student Name *")
  ).toHaveValue("");
});

        it("shows the student count when students exist", async () => {
  await loginAsAdmin([
    {
      id: 1,
      name: "Student One",
      place: "Vijayawada",
      age: 21,
      mobileNumber: "9876543210",
      email: "one@test.com",
      gender: "Male",
      course: "B.Tech",
      college: "ABC",
      address: "Address",
    },
  ]);

  expect(
    await screen.findByText("1 student(s) registered")
  ).toBeInTheDocument();
});


    });
    