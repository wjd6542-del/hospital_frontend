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
import LeaveView from "@/pages/hr/LeaveView.vue";
import LeaveGrantView from "@/pages/hr/LeaveGrantView.vue";
import TransactionView from "@/pages/finance/TransactionView.vue";
import FinanceDashboardView from "@/pages/finance/DashboardView.vue";
import FinanceBudgetView from "@/pages/finance/BudgetView.vue";
import FinanceReportView from "@/pages/finance/ReportView.vue";
import PurchaseOrderView from "@/pages/purchase/PurchaseOrderView.vue";
import VendorView from "@/pages/purchase/VendorView.vue";
import ItemView from "@/pages/inventory/ItemView.vue";
import StockMovementView from "@/pages/inventory/StockMovementView.vue";
import AssetView from "@/pages/asset/AssetView.vue";
import MaintenanceView from "@/pages/facility/MaintenanceView.vue";
import PatientView from "@/pages/emr/PatientView.vue";
import EncounterView from "@/pages/emr/EncounterView.vue";
import PrescriptionView from "@/pages/emr/PrescriptionView.vue";
import LabOrderView from "@/pages/emr/LabOrderView.vue";
import BillView from "@/pages/emr/BillView.vue";
import AppointmentView from "@/pages/reservation/AppointmentView.vue";
import AdmissionView from "@/pages/ward/AdmissionView.vue";
import ClaimView from "@/pages/insurance/ClaimView.vue";
import StatsView from "@/pages/stats/StatsView.vue";

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
            { path: "hr/leave", component: LeaveView, meta: { auth: true, title: "휴가 관리", perm: "leave.view" } },
            { path: "hr/leave-grant", component: LeaveGrantView, meta: { auth: true, title: "연차 부여", perm: "leave.view" } },

            // 재무
            { path: "finance/dashboard", component: FinanceDashboardView, meta: { auth: true, title: "재무 대시보드", perm: "finance.view" } },
            { path: "finance/transactions", component: TransactionView, meta: { auth: true, title: "수입·지출 내역", perm: "finance.view" } },
            { path: "finance/budget", component: FinanceBudgetView, meta: { auth: true, title: "예산 관리", perm: "finance.view" } },
            { path: "finance/report", component: FinanceReportView, meta: { auth: true, title: "기간 비교", perm: "finance.view" } },

            // 구매
            { path: "purchase/orders", component: PurchaseOrderView, meta: { auth: true, title: "발주 관리", perm: "purchase.view" } },
            { path: "purchase/vendors", component: VendorView, meta: { auth: true, title: "거래처", perm: "purchase.view" } },

            // 재고
            { path: "inventory/items", component: ItemView, meta: { auth: true, title: "품목·현재고", perm: "inventory.view" } },
            { path: "inventory/movements", component: StockMovementView, meta: { auth: true, title: "입출고", perm: "inventory.view" } },

            // 자산
            { path: "assets", component: AssetView, meta: { auth: true, title: "자산 대장", perm: "asset.view" } },

            // 시설
            { path: "facility/maintenance", component: MaintenanceView, meta: { auth: true, title: "유지보수 요청", perm: "facility.view" } },

            // 진료·EMR
            { path: "emr/patients", component: PatientView, meta: { auth: true, title: "환자 관리", perm: "patient.view" } },
            { path: "emr/encounters", component: EncounterView, meta: { auth: true, title: "진료", perm: "emr.view" } },
            { path: "emr/prescriptions", component: PrescriptionView, meta: { auth: true, title: "처방", perm: "prescription.view" } },
            { path: "emr/lab-orders", component: LabOrderView, meta: { auth: true, title: "검사", perm: "lab.view" } },
            { path: "emr/bills", component: BillView, meta: { auth: true, title: "수납", perm: "billing.view" } },

            // 예약
            { path: "reservation/appointments", component: AppointmentView, meta: { auth: true, title: "진료 예약", perm: "reservation.view" } },

            // 병동
            { path: "ward/admissions", component: AdmissionView, meta: { auth: true, title: "입원 관리", perm: "ward.view" } },

            // 보험청구
            { path: "insurance/claims", component: ClaimView, meta: { auth: true, title: "보험청구", perm: "insurance.view" } },

            // 통계
            { path: "stats", component: StatsView, meta: { auth: true, title: "통계", perm: "stats.view" } },

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
