import StudentSkeleton from "./StudentSkeleton";

function StudentList({
  searchTerm,
  setSearchTerm,
  filteredStudents,
  students,
  loading,
  canEdit,
  canDelete,
  handleEdit,
  handleDelete,
}) {
  return (
    <div className="student-list">
      <div className="student-list-header">
        <div>
          <h2>Registered Students</h2>

          <p className="student-count">
            {searchTerm
              ? `${filteredStudents.length} student(s) found`
              : `${students.length} student(s) registered`}
          </p>
        </div>

        <div className="student-search">
          <span className="search-icon">⌕</span>

          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm ?? ""}
            onChange={(e) =>
              setSearchTerm(e.target.value)
            }
          />

          {searchTerm && (
            <button
              type="button"
              className="clear-search-button"
              onClick={() => setSearchTerm("")}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <>
          <StudentSkeleton />
          <StudentSkeleton />
          <StudentSkeleton />
        </>
      ) : students.length === 0 ? (
        <p className="no-data">
          No student data available.
        </p>
      ) : filteredStudents.length === 0 ? (
        <div className="no-search-results">
          <p>
            No students found for "{searchTerm}"
          </p>

          <button
            type="button"
            onClick={() => setSearchTerm("")}
          >
            Clear Search
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <caption
              style={{ display: "none" }}
            >
              Registered Students
            </caption>

            <thead>
              <tr>
                <th>S.No</th>
                <th>Name</th>
                <th>Place</th>
                <th>Age</th>
                <th>Mobile</th>
                <th>Email</th>
                <th>Gender</th>
                <th>Course</th>
                <th>College</th>
                <th>Address</th>

                {(canEdit || canDelete) && (
                  <th>Action</th>
                )}
              </tr>
            </thead>

            <tbody>
              {filteredStudents.map(
                (item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td>{item.name ?? "-"}</td>
                    <td>{item.place ?? "-"}</td>
                    <td>{item.age ?? "-"}</td>
                    <td>
                      {item.mobileNumber ??
                        "-"}
                    </td>
                    <td>{item.email ?? "-"}</td>
                    <td>{item.gender ?? "-"}</td>
                    <td>{item.course ?? "-"}</td>
                    <td>{item.college ?? "-"}</td>
                    <td>
                      {item.address ?? "-"}
                    </td>

                    {(canEdit ||
                      canDelete) && (
                      <td>
                        {canEdit && (
                          <button
                            type="button"
                            title="Edit Student"
                            onClick={() =>
                              handleEdit(item)
                            }
                          >
                            Edit
                          </button>
                        )}

                        {canDelete && (
                          <button
                            type="button"
                            title="Delete Student"
                            onClick={() =>
                              handleDelete(
                                item.id
                              )
                            }
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default StudentList;