function StudentForm({
  student,
  handleChange,
  handleSubmit,
  editingId,
  setEditingId,
  setStudent,
  emptyStudent,
}) {
  return (
    <div className="form-box">
      <h2>
        {editingId !== null
          ? "Edit Student Details"
          : "Enter Student Details"}
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="student-name">
              Student Name *
            </label>

            <input
              id="student-name"
              type="text"
              name="name"
              value={student.name ?? ""}
              onChange={handleChange}
              placeholder="Enter student name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="student-place">
              Place *
            </label>

            <input
              id="student-place"
              type="text"
              name="place"
              value={student.place ?? ""}
              onChange={handleChange}
              placeholder="Enter place"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="student-age">
              Age *
            </label>

            <input
              id="student-age"
              type="number"
              name="age"
              value={student.age ?? ""}
              onChange={handleChange}
              placeholder="Enter age"
              min="1"
              max="120"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="student-mobile">
              Mobile Number *
            </label>

            <input
              id="student-mobile"
              type="tel"
              name="mobile"
              value={student.mobile ?? ""}
              onChange={handleChange}
              placeholder="Enter mobile number"
              maxLength={10}
              pattern="[0-9]{10}"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="student-email">
              Email *
            </label>

            <input
              id="student-email"
              type="email"
              name="email"
              value={student.email ?? ""}
              onChange={handleChange}
              placeholder="Enter email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="student-gender">
              Gender *
            </label>

            <select
              id="student-gender"
              name="gender"
              value={student.gender ?? ""}
              onChange={handleChange}
              required
            >
              <option value="">
                Select Gender
              </option>

              <option value="Male">
                Male
              </option>

              <option value="Female">
                Female
              </option>

              <option value="Other">
                Other
              </option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="student-course">
              Course *
            </label>

            <select
              id="student-course"
              name="course"
              value={student.course ?? ""}
              onChange={handleChange}
              required
            >
              <option value="">
                Select Course
              </option>

              <option value="B.Tech">
                B.Tech
              </option>

              <option value="B.Sc">
                B.Sc
              </option>

              <option value="B.Com">
                B.Com
              </option>

              <option value="BCA">
                BCA
              </option>

              <option value="MCA">
                MCA
              </option>

              <option value="MBA">
                MBA
              </option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="student-college">
              College Name *
            </label>

            <input
              id="student-college"
              type="text"
              name="college"
              value={student.college ?? ""}
              onChange={handleChange}
              placeholder="Enter college name"
              required
            />
          </div>

          <div className="form-group full-width">
            <label htmlFor="student-address">
              Address *
            </label>

            <textarea
              id="student-address"
              name="address"
              value={student.address ?? ""}
              onChange={handleChange}
              placeholder="Enter complete address"
              rows="4"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="add-button"
          title={
            editingId !== null
              ? "Update Student"
              : "Add Student"
          }
        >
          {editingId !== null
            ? "Update Student"
            : "Add Student"}
        </button>

        {editingId !== null && (
          <button
            type="button"
            className="logout-button"
            title="Cancel Edit"
            onClick={() => {
              setEditingId(null);

              setStudent({
                ...emptyStudent,
              });
            }}
          >
            Cancel Edit
          </button>
        )}
      </form>
    </div>
  );
}

export default StudentForm;