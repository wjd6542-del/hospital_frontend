// @ts-nocheck
import api from "@/api/api";

// 처방 (약품 중첩, 조제 시 재고 차감)
export const prescriptionApi = {
  list: (body = {}) => api.post("/prescription/list", body).then((r) => r.data),
  get: (id) => api.post("/prescription/get", { id }).then((r) => r.data),
  save: (body) => api.post("/prescription/save", body).then((r) => r.data),
  dispense: (id) => api.post("/prescription/dispense", { id }).then((r) => r.data),
  cancel: (id) => api.post("/prescription/cancel", { id }).then((r) => r.data),
  remove: (id) => api.post("/prescription/delete", { id }).then((r) => r.data),
};
