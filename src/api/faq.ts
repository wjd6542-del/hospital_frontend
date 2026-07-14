// @ts-nocheck
import api from "@/api/api";

// FAQ
export const faqApi = {
  list: (body = {}) => api.post("/faq/list", body).then((r) => r.data),
  popular: (body = {}) => api.post("/faq/popular", body).then((r) => r.data),
  categories: () => api.post("/faq/categories", {}).then((r) => r.data),
  get: (id) => api.post("/faq/get", { id }).then((r) => r.data),
  save: (body) => api.post("/faq/save", body).then((r) => r.data),
  remove: (id) => api.post("/faq/delete", { id }).then((r) => r.data),
};

// FAQ 분류 (환경설정)
export const faqCategoryApi = {
  list: (body = {}) => api.post("/faqCategory/list", body).then((r) => r.data),
  save: (body) => api.post("/faqCategory/save", body).then((r) => r.data),
  remove: (id) => api.post("/faqCategory/delete", { id }).then((r) => r.data),
};
