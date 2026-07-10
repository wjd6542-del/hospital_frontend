// @ts-nocheck
import api from "@/api/api";

// 태그 (FAQ 공통)
export const tagApi = {
  list: (body = {}) => api.post("/tag/list", body).then((r) => r.data),
  save: (body) => api.post("/tag/save", body).then((r) => r.data),
  remove: (id) => api.post("/tag/delete", { id }).then((r) => r.data),
};

// 다국어 번역팩
export const langPackApi = {
  list: (body = {}) => api.post("/langPack/list", body).then((r) => r.data),
  save: (body) => api.post("/langPack/save", body).then((r) => r.data),
  batchSave: (rows) => api.post("/langPack/batchSave", rows).then((r) => r.data),
  batchDelete: (rows) => api.post("/langPack/batchDelete", rows).then((r) => r.data),
  remove: (id) => api.post("/langPack/delete", { id }).then((r) => r.data),
  translateText: (text) => api.post("/langPack/translateText", { text }).then((r) => r.data),
};
