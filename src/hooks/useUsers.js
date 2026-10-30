import { useState } from "react";
import toast from "react-hot-toast";
import { isValidRole } from "../validation";
import { emptyUser } from "../constants/constants";

export function useUsers(
  api,
  getAuthConfig,
  role,
  handleLogout
) {
  const [users, setUsers] = useState([]);

  const [newUser, setNewUser] =
    useState({
      ...emptyUser,
    });

  const loadUsers = async () => {
    if (role !== "Admin") return;

    try {
      const response =
        await api.getUsers(
          getAuthConfig()
        );

      setUsers(
        Array.isArray(
          response.data
        )
          ? response.data
          : []
      );
    } catch (error) {
      if (
        error.response?.status === 401
      ) {
        handleLogout();
      }
    }
  };

  const handleCreateUser =
    async (e) => {
      e.preventDefault();

      if (
        !newUser.username.trim()
      ) {
        toast.error(
          "Username is required."
        );
        return;
      }

      if (
        !newUser.email.trim()
      ) {
        toast.error(
          "Email is required."
        );
        return;
      }

      if (
        !newUser.password.trim()
      ) {
        toast.error(
          "Password is required."
        );
        return;
      }

      if (
        newUser.password.length <
        6
      ) {
        toast.error(
          "Password must be at least 6 characters."
        );
        return;
      }

      if (
        !isValidRole(
          newUser.role
        )
      ) {
        toast.error(
          "Please select a valid role."
        );
        return;
      }

      try {
        await api.createUser(
          newUser,
          getAuthConfig()
        );

        toast.success(
          "User created successfully!"
        );

        setNewUser({
          ...emptyUser,
        });

        await loadUsers();
      } catch {
        toast.error(
          "Failed to create user."
        );
      }
    };

  const handleDeleteUser =
    async (id) => {
      if (
        !window.confirm(
          "Delete this user?"
        )
      ) {
        return;
      }

      try {
        await api.deleteUser(
          id,
          getAuthConfig()
        );

        toast.success(
          "User deleted successfully!"
        );

        await loadUsers();
      } catch {
        toast.error(
          "Failed to delete user."
        );
      }
    };

  return {
    users,
    setUsers,
    newUser,
    setNewUser,
    loadUsers,
    handleCreateUser,
    handleDeleteUser,
  };
}