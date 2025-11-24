import { useNavigate } from "react-router-dom";
import MobileLayout from "../layouts/MobileLayout";

export default function SignUpCompletePage() {
  const navigate = useNavigate();

  return (
    <MobileLayout>
      <div className="flex flex-col gap-8 items-center justify-center pt-[100px] pb-[60px] px-6 bg-[#fafcff] min-h-screen w-full">
        {/* Welcome Content */}
        <div className="flex flex-col gap-6 h-[226px] items-center justify-center p-2.5 rounded-3xl w-[342px] bg-white">
          <p className="text-[64px]">🎉</p>
          <h1 className="font-bold text-[32px] text-[#1a1a1a]">반가워요!</h1>
          <p className="font-normal text-[18px] text-gray-500">나는 빼줘에 오신 것을 환영해요!</p>
          <p className="font-normal text-base text-[#999999]">
            이제 정산 내역을 저장하고 관리할 수 있어요
          </p>
        </div>

        {/* Start Button */}
        <button
          onClick={() => navigate("/")}
          className="bg-[#333333] h-14 flex items-center justify-center p-2.5 rounded-2xl w-[342px]"
        >
          <span className="font-semibold text-[18px] text-white">정산 시작하기</span>
        </button>

        {/* Tip */}
        <p className="font-normal text-sm text-[#b3b3b3]">
          💡 팁: 영수증 사진만 찍어도 자동으로 계산해드려요!
        </p>
      </div>
    </MobileLayout>
  );
}

