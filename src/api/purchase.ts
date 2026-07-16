// @ts-nocheck
import api from "@/api/api";

// 거래처
export const vendorApi = {
  list: (body = {}) => api.post("/vendor/list", body).then((r) => r.data),
  save: (body) => api.post("/vendor/save", body).then((r) => r.data),
  remove: (id) => api.post("/vendor/delete", { id }).then((r) => r.data),
};

// 발주
export const orderApi = {
  list: (body) => api.post("/purchaseOrder/list", body).then((r) => r.data),
  save: (body) => api.post("/purchaseOrder/save", body).then((r) => r.data),
  setStatus: (id, status) => api.post("/purchaseOrder/setStatus", { id, status }).then((r) => r.data),
  remove: (id) => api.post("/purchaseOrder/delete", { id }).then((r) => r.data),
};
