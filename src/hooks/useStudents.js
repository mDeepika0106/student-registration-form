import { useState } from "react";
import toast from "react-hot-toast";
import { getSafeId } from "../validation";
import {
  emptyStudent,
} from "../constants/constants";

export function useStudents(
  api,
  getAuthConfig,
  canEdit,
  canDelete,
  handleLogout
) {
  const [students, setStudents] =
    useState([]);

  const [student, setStudent] =
    useState({
      ...emptyStudent,
    });

  const [editingId, setEditingId] =
    useState(null);

  const handleEdit = (
    item
  ) => {
    if (!canEdit) return;

    setStudent({
      name: item.name ?? "",
      place:
        item.place ?? "",
      age: item.age ?? "",
      mobile:
        item.mobileNumber ?? "",
      email:
        item.email ?? "",
      gender:
        item.gender ?? "",
      course:
        item.course ?? "",
      college:
        item.college ?? "",
      address:
        item.address ?? "",
    });

    setEditingId(item.id);
  };

  const handleDelete =
    async (id) => {
      if (!canDelete)
        return;

      try {
        const safeId =
          getSafeId(id);

        await api.deleteStudent(
          safeId,
          getAuthConfig()
        );

        setStudents(
          (current) =>
            current.filter(
              (item) =>
                item.id !==
                safeId
            )
        );

        toast.success(
          "Student deleted"
        );
      } catch {
        toast.error(
          "Delete failed"
        );
      }
    };

  return {
    students,
    setStudents,
    student,
    setStudent,
    editingId,
    setEditingId,
    handleEdit,
    handleDelete,
  };
}