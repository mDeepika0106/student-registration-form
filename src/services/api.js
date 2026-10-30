import axios from "axios";
import {
  getSafeApiUrl,
  getSafeId,
} from "../validation";

const DEFAULT_API_URL =
  "https://studentregistrationform-api-deepika-c8cjcthmcgfjhecg.indiasouthcentral-01.azurewebsites.net/api";

const API_URL = getSafeApiUrl(
  import.meta.env.VITE_API_URL ||
    DEFAULT_API_URL
);

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

const api = {
  getStudents(config = {}) {
    return apiClient.get(
      "/Student",
      config
    );
  },

  login(data) {
    return apiClient.post(
      "/Auth/login",
      data
    );
  },

  changePassword(
    data,
    config = {}
  ) {
    return apiClient.post(
      "/Auth/change-password",
      data,
      config
    );
  },

  getUsers(config = {}) {
    return apiClient.get(
      "/User",
      config
    );
  },

  createUser(
    data,
    config = {}
  ) {
    return apiClient.post(
      "/User",
      data,
      config
    );
  },

  deleteUser(
    id,
    config = {}
  ) {
    return apiClient.delete(
      `/User/${getSafeId(id)}`,
      config
    );
  },

  createStudent(
    data,
    config = {}
  ) {
    return apiClient.post(
      "/Student",
      data,
      config
    );
  },

  updateStudent(
    id,
    data,
    config = {}
  ) {
    return apiClient.put(
      `/Student/${getSafeId(id)}`,
      data,
      config
    );
  },

  deleteStudent(
    id,
    config = {}
  ) {
    return apiClient.delete(
      `/Student/${getSafeId(id)}`,
      config
    );
  },
};

export default api;