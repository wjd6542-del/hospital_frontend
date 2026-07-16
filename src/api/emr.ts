// @ts-nocheck
import api from "@/api/api";

// 환자 등록 (임상계 공통 마스터)
export const patientApi = {
  list: (body = {}) => api.post("/patient/list", body).then((r) => r.data),
  get: (id) => api.post("/patient/get", { id }).then((r) => r.data),
  save: (body) => api.post("/patient/save", body).then((r) => r.data),
  remove: (id) => api.post("/patient/delete", { id }).then((r) => r.data),
};

// 외래 진료 (SOAP · 바이탈 · 진단 중첩)
export const encounterApi = {
  list: (body = {}) => api.post("/encounter/list", body).then((r) => r.data),
  get: (id) => api.post("/encounter/get", { id }).then((r) => r.data),
  save: (body) => api.post("/encounter/save", body).then((r) => r.data),
  remove: (id) => api.post("/encounter/delete", { id }).then((r) => r.data),
};
