// @ts-nocheck
import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";

import RootLayout from "@/layouts/RootLayout.vue";
import AuthLayout from "@/layouts/AuthLayout.vue";
import MainLayout from "@/layouts/MainLayout.vue";

import LoginPage from "@/pages/auth/LoginPage.vue";
import HomePage from "@/pages/home/HomePage.vue";

import BoardView from "@/pages/board/BoardView.vue";
import PostDetailView from "@/pages/board/PostDetailView.vue";
import PostEditView from "@/pages/board/PostEditView.vue";

import FaqView from "@/pages/faq/FaqView.vue";

import DepartmentView from "@/pages/hr/DepartmentView.vue";
import EmployeeView from "@/pages/hr/EmployeeView.vue";
import ScheduleView from "@/pages/hr/ScheduleView.vue";
import AttendanceView from "@/pages/hr/AttendanceView.vue";

import MyPage from "@/pages/mypage/MyPage.vue";
import SettingsView from "@/pages/settings/SettingsView.vue";
import AccountSettings from "@/pages/settings/AccountSettings.vue";
import WhiteIpSettings from "@/pages/settings/WhiteIpSettings.vue";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      component: RootLayout,
      children: [
        {
          path: "login",
          component: AuthLayout,
          children: [{ path: "", component: LoginPage }],
        },
        {
          path: "",
          component: MainLayout,
          children: [
            { path: "", component: HomePage, meta: { auth: true, title: "대시보드" } },

            { path: "faq", component: FaqView, meta: { auth: true, title: "자주 하는 질문", perm: "faq.view" } },

            // 인사
            { path: "hr/department", component: DepartmentView, meta: { auth: true, title: "부서 관리", perm: "department.view" } },
            { path: "hr/employee", component: EmployeeView, meta: { auth: true, title: "직원 관리", perm: "hr.view" } },
            { path: "hr/schedule", component: ScheduleView, meta: { auth: true, title: "근무표", perm: "attendance.view" } },
            { path: "hr/attendance", component: AttendanceView, meta: { auth: true, title: "출퇴근", perm: "attendance.view" } },

            // 게시판
            { path: "board/:slug", component: BoardView, meta: { auth: true, title: "게시판", perm: "board.view" } },
            { path: "board/:slug/write", component: PostEditView, meta: { auth: true, title: "글쓰기", perm: "board.write" } },
            { path: "post/:id", component: PostDetailView, meta: { auth: true, title: "게시글", perm: "board.view" } },
            { path: "post/:id/edit", component: PostEditView, meta: { auth: true, title: "글 수정", perm: "board.write" } },

            { path: "mypage", component: MyPage, meta: { auth: true, title: "마이페이지" } },
            { path: "account/roles", component: AccountSettings, meta: { auth: true, title: "계정 권한", perm: ["usermanager.view", "permission.user.view"] } },
            { path: "account/whiteip", component: WhiteIpSettings, meta: { auth: true, title: "화이트 아이피", perm: "usermanager.view" } },
            { path: "settings", component: SettingsView, meta: { auth: true, title: "환경설정", perm: ["permission.menu.view"] } },
          ],
        },
      ],
    },
    // 없는 경로(삭제된 CS 라우트의 옛 북마크 포함)는 대시보드로
    { path: "/:pathMatch(.*)*", redirect: "/" },
  ],
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (!auth.isLoaded) return true;
  if (to.path === "/login") return true;
  if (to.meta.auth && !auth.user) return "/login";
  // 권한 체크: meta.perm(문자열 또는 배열) 중 하나라도 보유해야 접근 (super는 항상 통과)
  const perm = to.meta.perm as string | string[] | undefined;
  if (perm && auth.user) {
    const codes = Array.isArray(perm) ? perm : [perm];
    if (!codes.some((c) => auth.hasPermission(c))) return "/";
  }
  return true;
});

export default router;
