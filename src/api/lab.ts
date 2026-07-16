// @ts-nocheck
import api from "@/api/api";

// 검사 마스터 (오더 가능한 검사 항목)
export const labTestApi = {
  list: (body = {}) => api.post("/labTest/list", body).then((r) => r.data),
  save: (body) => api.post("/labTest/save", body).then((r) => r.data),
  remove: (id) => api.post("/labTest/delete", { id }).then((r) => r.data),
};

// 검사 오더 / 결과 (항목 중첩, 결과 입력 시 이상치 자동판정)
export const labOrderApi = {
  list: (body = {}) => api.post("/labOrder/list", body).then((r) => r.data),
  get: (id) => api.post("/labOrder/get", { id }).then((r) => r.data),
  save: (body) => api.post("/labOrder/save", body).then((r) => r.data),
  result: (id, results) => api.post("/labOrder/result", { id, results }).then((r) => r.data),
  cancel: (id) => api.post("/labOrder/cancel", { id }).then((r) => r.data),
  remove: (id) => api.post("/labOrder/delete", { id }).then((r) => r.data),
};
