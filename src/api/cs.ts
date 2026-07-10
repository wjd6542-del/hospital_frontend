// @ts-nocheck
import api from "@/api/api";

// 게임사 (환경설정)
export const gameCompanyApi = {
  list: (body = {}) => api.post("/gameCompany/list", body).then((r) => r.data),
  tree: () => api.post("/gameCompany/tree", {}).then((r) => r.data),
  reorder: (body) => api.post("/gameCompany/reorder", body).then((r) => r.data),
  options: () => api.post("/gameCompany/options", {}).then((r) => r.data),
  get: (id) => api.post("/gameCompany/get", { id }).then((r) => r.data),
  save: (body) => api.post("/gameCompany/save", body).then((r) => r.data),
  remove: (id) => api.post("/gameCompany/delete", { id }).then((r) => r.data),
};

// CS 응대 유형 (desk) — 게시판처럼 동적 추가
export const supportDeskApi = {
  list: () => api.post("/supportDesk/list", {}).then((r) => r.data),
  listAll: () => api.post("/supportDesk/listAll", {}).then((r) => r.data),
  get: (id) => api.post("/supportDesk/get", { id }).then((r) => r.data),
  getByCode: (code) => api.post("/supportDesk/getByCode", { code }).then((r) => r.data),
  save: (body) => api.post("/supportDesk/save", body).then((r) => r.data),
  remove: (id) => api.post("/supportDesk/delete", { id }).then((r) => r.data),
};

// CS 응대 대상 (유형별 트리) — EntityTree 용으로 desk 스코프 주입 팩토리 제공
export const supportTargetApi = {
  tree: (desk_id) => api.post("/supportTarget/tree", { desk_id }).then((r) => r.data),
  options: (desk_id) => api.post("/supportTarget/options", { desk_id }).then((r) => r.data),
  list: (body = {}) => api.post("/supportTarget/list", body).then((r) => r.data),
  get: (id) => api.post("/supportTarget/get", { id }).then((r) => r.data),
  save: (body) => api.post("/supportTarget/save", body).then((r) => r.data),
  reorder: (body) => api.post("/supportTarget/reorder", body).then((r) => r.data),
  remove: (id) => api.post("/supportTarget/delete", { id }).then((r) => r.data),
};
// EntityTree 는 api.tree()/save/reorder/remove/options 형태를 기대 → desk 고정 래퍼
export function makeTargetTreeApi(deskId) {
  return {
    tree: () => supportTargetApi.tree(deskId),
    options: () => supportTargetApi.options(deskId),
    get: (id) => supportTargetApi.get(id),
    save: (body) => supportTargetApi.save({ ...body, desk_id: body.id ? undefined : deskId }),
    reorder: (body) => supportTargetApi.reorder(body),
    remove: (id) => supportTargetApi.remove(id),
  };
}

// 업체
export const vendorApi = {
  list: (body = {}) => api.post("/vendor/list", body).then((r) => r.data),
  tree: () => api.post("/vendor/tree", {}).then((r) => r.data),
  reorder: (body) => api.post("/vendor/reorder", body).then((r) => r.data),
  options: () => api.post("/vendor/options", {}).then((r) => r.data),
  get: (id) => api.post("/vendor/get", { id }).then((r) => r.data),
  save: (body) => api.post("/vendor/save", body).then((r) => r.data),
  remove: (id) => api.post("/vendor/delete", { id }).then((r) => r.data),
};

// 장부 (지급/회수 원장)
export const ledgerApi = {
  list: (body = {}) => api.post("/ledger/list", body).then((r) => r.data),
  save: (body) => api.post("/ledger/save", body).then((r) => r.data),
  remove: (id) => api.post("/ledger/delete", { id }).then((r) => r.data),
};

// 정산 (업체 정산 / 게임사 정산)
export const settlementApi = {
  list: (body = {}) => api.post("/settlement/list", body).then((r) => r.data),
  yearChart: (body = {}) => api.post("/settlement/yearChart", body).then((r) => r.data),
  get: (id) => api.post("/settlement/get", { id }).then((r) => r.data),
  save: (body) => api.post("/settlement/save", body).then((r) => r.data),
  settle: (body) => api.post("/settlement/settle", body).then((r) => r.data),
  remove: (id) => api.post("/settlement/delete", { id }).then((r) => r.data),
};

// CS 응대 (업체 응대 / 게임사 응대)
export const supportApi = {
  list: (body = {}) => api.post("/support/list", body).then((r) => r.data),
  alerts: (body = {}) => api.post("/support/alerts", body).then((r) => r.data),
  get: (id) => api.post("/support/get", { id }).then((r) => r.data),
  save: (body) => api.post("/support/save", body).then((r) => r.data),
  setStatus: (id, status) => api.post("/support/status", { id, status }).then((r) => r.data),
  bulkStatus: (ids, status) => api.post("/support/bulkStatus", { ids, status }).then((r) => r.data),
  addMessage: (body) => api.post("/support/message", body).then((r) => r.data),
  remove: (id) => api.post("/support/delete", { id }).then((r) => r.data),
};

// 환율
export const exchangeRateApi = {
  list: (body = {}) => api.post("/exchangeRate/list", body).then((r) => r.data),
  latest: () => api.post("/exchangeRate/latest", {}).then((r) => r.data),
  collect: () => api.post("/exchangeRate/collect", {}).then((r) => r.data),
};

