// @ts-nocheck
import api from "@/api/api";

// 부서 (계층 트리)
export const departmentApi = {
  tree: () => api.post("/department/tree", {}).then((r) => r.data),
  list: (body = {}) => api.post("/department/list", body).then((r) => r.data),
  options: () => api.post("/department/options", {}).then((r) => r.data),
  get: (id) => api.post("/department/get", { id }).then((r) => r.data),
  save: (body) => api.post("/department/save", body).then((r) => r.data),
  reorder: (body) => api.post("/department/reorder", body).then((r) => r.data),
  remove: (id) => api.post("/department/delete", { id }).then((r) => r.data),
};

// 직원
export const employeeApi = {
  list: (body = {}) => api.post("/employee/list", body).then((r) => r.data),
  options: () => api.post("/employee/options", {}).then((r) => r.data),
  get: (id) => api.post("/employee/get", { id }).then((r) => r.data),
  save: (body) => api.post("/employee/save", body).then((r) => r.data),
  resign: (id, resigned_at) => api.post("/employee/resign", { id, resigned_at }).then((r) => r.data),
  remove: (id) => api.post("/employee/delete", { id }).then((r) => r.data),
};

// 공통 코드 (직급·직종·고용형태·면허종류·부서유형)
export const categoryApi = {
  list: (body = {}) => api.post("/category/list", body).then((r) => r.data),
  save: (body) => api.post("/category/save", body).then((r) => r.data),
  remove: (id) => api.post("/category/delete", { id }).then((r) => r.data),
};
