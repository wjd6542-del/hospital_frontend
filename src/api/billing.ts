// @ts-nocheck
import api from "@/api/api";

// 수납 / 정산 (항목 중첩, 수납 시 진료수입 자동기록, 보험청구 생성)
export const billApi = {
  list: (body = {}) => api.post("/bill/list", body).then((r) => r.data),
  get: (id) => api.post("/bill/get", { id }).then((r) => r.data),
  suggest: (encounter_id) => api.post("/bill/suggest", { encounter_id }).then((r) => r.data),
  save: (body) => api.post("/bill/save", body).then((r) => r.data),
  pay: (id, amount, method) => api.post("/bill/pay", { id, amount, method }).then((r) => r.data),
  createClaim: (id) => api.post("/bill/createClaim", { id }).then((r) => r.data),
  cancel: (id) => api.post("/bill/cancel", { id }).then((r) => r.data),
  remove: (id) => api.post("/bill/delete", { id }).then((r) => r.data),
};
