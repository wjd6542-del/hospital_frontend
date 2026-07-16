// @ts-nocheck
import api from "@/api/api";

// 품목 마스터 (현재고 포함)
export const itemApi = {
  list: (body = {}) => api.post("/item/list", body).then((r) => r.data),
  save: (body) => api.post("/item/save", body).then((r) => r.data),
  remove: (id) => api.post("/item/delete", { id }).then((r) => r.data),
};

// 입출고 수불부
export const movementApi = {
  list: (body) => api.post("/stockMovement/list", body).then((r) => r.data),
  save: (body) => api.post("/stockMovement/save", body).then((r) => r.data),
  remove: (id) => api.post("/stockMovement/delete", { id }).then((r) => r.data),
};
