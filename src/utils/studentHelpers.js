export function filterStudents(
  students = [],
  searchTerm = ""
) {
  const search =
    searchTerm.toLowerCase().trim();

  if (!search) {
    return students;
  }

  return students.filter((item) => {
    return (
      item.name
        ?.toLowerCase()
        .includes(search) ||
      item.place
        ?.toLowerCase()
        .includes(search) ||
      item.email
        ?.toLowerCase()
        .includes(search) ||
      item.course
        ?.toLowerCase()
        .includes(search) ||
      item.college
        ?.toLowerCase()
        .includes(search) ||
      item.gender
        ?.toLowerCase()
        .includes(search) ||
      item.mobileNumber
        ?.toString()
        .includes(search) ||
      item.age
        ?.toString()
        .includes(search)
    );
  });
}