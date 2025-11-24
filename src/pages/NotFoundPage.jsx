import { useNavigate, useLocation } from "react-router-dom";
import MobileLayout from "../layouts/MobileLayout";

export default function NotFoundPage() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <MobileLayout>
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-6">
        <h1 className="text-4xl font-bold text-gray-800">404</h1>
        <p className="text-lg text-gray-600">페이지를 찾을 수 없습니다</p>
        <p className="text-sm text-gray-500">경로: {location.pathname}</p>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-3 bg-[#3366cc] text-white rounded-lg hover:bg-[#2555e6] transition-colors"
        >
          홈으로 돌아가기
        </button>
      </div>
    </MobileLayout>
  );
}

