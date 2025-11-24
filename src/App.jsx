import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";

// 자주 사용되는 페이지는 즉시 로드
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";

// 나머지 페이지는 lazy loading
const SignUpCompletePage = lazy(() => import("./pages/SignUpCompletePage"));
const Step1CapacityInputPage = lazy(() => import("./pages/Step1CapacityInputPage"));
const Step2ReceiptInputPage = lazy(() => import("./pages/Step2ReceiptInputPage"));
const Step3PaymentInfoPage = lazy(() => import("./pages/Step3PaymentInfoPage"));
const Step4ShareRoomLinkPage = lazy(() => import("./pages/Step4ShareRoomLinkPage"));
const Step5SetupCompletePage = lazy(() => import("./pages/Step5SetupCompletePage"));
const TaxiStep1CapacityInputPage = lazy(() => import("./pages/TaxiStep1CapacityInputPage"));
const TaxiStep2ReceiptInputPage = lazy(() => import("./pages/TaxiStep2ReceiptInputPage"));
const TaxiStep3PaymentInfoPage = lazy(() => import("./pages/TaxiStep3PaymentInfoPage"));
const TaxiStep4ShareRoomLinkPage = lazy(() => import("./pages/TaxiStep4ShareRoomLinkPage"));
const TaxiStep5SetupCompletePage = lazy(() => import("./pages/TaxiStep5SetupCompletePage"));
const SettlementParticipantEntryPage = lazy(() => import("./pages/SettlementParticipantEntryPage"));
const SettlementMenuSelectionPage = lazy(() => import("./pages/SettlementMenuSelectionPage"));
const SettlementMenuSelectionConfirmedPage = lazy(() => import("./pages/SettlementMenuSelectionConfirmedPage"));
const SettlementMenuEditPage = lazy(() => import("./pages/SettlementMenuEditPage"));
const SettlementRoomHostPage = lazy(() => import("./pages/SettlementRoomHostPage"));
const SettlementCompletePage = lazy(() => import("./pages/SettlementCompletePage"));
const SettlementViewPage = lazy(() => import("./pages/SettlementViewPage"));
const SettlementPaymentPage = lazy(() => import("./pages/SettlementPaymentPage"));
const TaxiParticipantEntryPage = lazy(() => import("./pages/TaxiParticipantEntryPage"));
const TaxiLocationSelectionPage = lazy(() => import("./pages/TaxiLocationSelectionPage"));
const TaxiLocationSelectionConfirmedPage = lazy(() => import("./pages/TaxiLocationSelectionConfirmedPage"));
const TaxiLocationSelectionHostPage = lazy(() => import("./pages/TaxiLocationSelectionHostPage"));
const TaxiLocationEditPage = lazy(() => import("./pages/TaxiLocationEditPage"));
const TaxiSettlementCompletePage = lazy(() => import("./pages/TaxiSettlementCompletePage"));
const TaxiSettlementViewPage = lazy(() => import("./pages/TaxiSettlementViewPage"));
const TaxiSettlementPaymentPage = lazy(() => import("./pages/TaxiSettlementPaymentPage"));
const MyPage = lazy(() => import("./pages/MyPage"));
const ProfileEditPage = lazy(() => import("./pages/ProfileEditPage"));
const ChangePasswordPage = lazy(() => import("./pages/ChangePasswordPage"));
const SettlementListPage = lazy(() => import("./pages/SettlementListPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

// 로딩 컴포넌트
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#3366cc]"></div>
      <p className="mt-4 text-gray-500">로딩 중...</p>
    </div>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/signup/complete" element={<SignUpCompletePage />} />
        <Route path="/settlement/receipt/step1" element={<Step1CapacityInputPage />} />
        <Route path="/settlement/receipt/step2" element={<Step2ReceiptInputPage />} />
        <Route path="/settlement/receipt/step3" element={<Step3PaymentInfoPage />} />
        <Route path="/settlement/receipt/step4" element={<Step4ShareRoomLinkPage />} />
        <Route path="/settlement/receipt/step5" element={<Step5SetupCompletePage />} />
        <Route path="/taxi/settlement/start" element={<TaxiStep1CapacityInputPage />} />
        <Route path="/taxi/settlement/step2" element={<TaxiStep2ReceiptInputPage />} />
        <Route path="/taxi/settlement/step3" element={<TaxiStep3PaymentInfoPage />} />
        <Route path="/taxi/settlement/step4" element={<TaxiStep4ShareRoomLinkPage />} />
        <Route path="/taxi/settlement/step5" element={<TaxiStep5SetupCompletePage />} />
        {/* UUID 기반 정산 방 라우트 (보안 강화) */}
        <Route path="/settlement/room/:roomId/participant-entry" element={<SettlementParticipantEntryPage />} />
        <Route path="/settlement/room/:roomId/menu-selection" element={<SettlementMenuSelectionPage />} />
        <Route path="/settlement/room/:roomId/menu-selection-confirmed" element={<SettlementMenuSelectionConfirmedPage />} />
        <Route path="/settlement/room/:roomId/menu-edit" element={<SettlementMenuEditPage />} />
        <Route path="/settlement/room/:roomId/host" element={<SettlementRoomHostPage />} />
        
        {/* 기존 라우트 (하위 호환성) */}
        <Route path="/settlement/room" element={<SettlementRoomHostPage />} />
        <Route path="/settlement/room/participant-entry" element={<SettlementParticipantEntryPage />} />
        <Route path="/settlement/room/menu-selection" element={<SettlementMenuSelectionPage />} />
        <Route path="/settlement/room/menu-selection-confirmed" element={<SettlementMenuSelectionConfirmedPage />} />
        <Route path="/settlement/room/menu-edit" element={<SettlementMenuEditPage />} />
        <Route path="/settlement/room/host" element={<SettlementRoomHostPage />} />
        <Route path="/settlement/complete" element={<SettlementCompletePage />} />
        <Route path="/settlement/list" element={<SettlementListPage />} />
        {/* 구체적인 라우트를 일반 라우트보다 먼저 배치 */}
        <Route path="/settlement/:uuid/payment/:nickname" element={<SettlementPaymentPage />} />
        <Route path="/settlement/:uuid" element={<SettlementViewPage />} />
        <Route path="/taxi/settlement/room/participant-entry" element={<TaxiParticipantEntryPage />} />
        <Route path="/taxi/settlement/room/location-selection" element={<TaxiLocationSelectionPage />} />
        <Route path="/taxi/settlement/room/location-selection-confirmed" element={<TaxiLocationSelectionConfirmedPage />} />
        <Route path="/taxi/settlement/room/location-edit" element={<TaxiLocationEditPage />} />
        <Route path="/taxi/settlement/room/host" element={<TaxiLocationSelectionHostPage />} />
        <Route path="/taxi/settlement/room/complete" element={<TaxiSettlementCompletePage />} />
        <Route path="/taxi/settlement/view" element={<TaxiSettlementViewPage />} />
        {/* 구체적인 라우트를 일반 라우트보다 먼저 배치 */}
        <Route path="/taxi/settlement/:uuid/payment/:nickname" element={<TaxiSettlementPaymentPage />} />
        <Route path="/taxi/settlement/:uuid" element={<TaxiSettlementViewPage />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/mypage/profile/edit" element={<ProfileEditPage />} />
        <Route path="/mypage/password/change" element={<ChangePasswordPage />} />
        <Route path="/mypage/settlement/history" element={<SettlementListPage />} />
        {/* 404 페이지 - 모든 라우트의 마지막에 배치 */}
        <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
