import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import MobileLayout from "../layouts/MobileLayout";
import StepIndicator from "../components/settlement/StepIndicator";
import ButtonContainer from "../components/layout/ButtonContainer";
import { shareToKakaoTalk } from "../utils/kakaoShare";

export default function TaxiStep4ShareRoomLinkPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const roomId = location.state?.roomId;
  const [roomLink] = useState(
    roomId
      ? `${window.location.origin}/taxi/settlement/room/${roomId}/participant-entry`
      : ""
  );
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(roomLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("링크 복사 실패:", err);
      // Fallback: 텍스트 선택 방식
      const textArea = document.createElement("textarea");
      textArea.value = roomLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleKakaoShare = async () => {
    if (!roomLink) {
      alert("방 링크를 생성할 수 없습니다.");
      return;
    }

    const shareTitle = "택시 정산 방 초대";
    const shareText = "택시 정산에 참여해주세요!";
    
    await shareToKakaoTalk(shareTitle, shareText, roomLink);
  };

  const handlePrevious = () => {
    navigate("/taxi/settlement/step3");
  };

  const handleNext = () => {
    // 출발지/도착지 정보 전달
    navigate("/taxi/settlement/step5", {
      state: location.state,
    });
  };

  return (
    <MobileLayout>
      <div className="flex flex-col gap-8 items-center pt-[60px] pb-10 px-6 bg-[#fafcff] min-h-screen w-full">
        {/* Step Indicator */}
        <StepIndicator currentStep={4} className="w-full max-w-[342px]" />

        {/* Header Section */}
        <div className="flex flex-col gap-2 items-center justify-center p-2.5 h-[76px] w-full max-w-[342px]">
          <h1 className="font-bold text-2xl text-[#1a1a1a]">방 링크 공유하기</h1>
          <p className="font-normal text-base text-gray-500">
            친구들과 함께 계산해보세요
          </p>
        </div>

        {/* Link Share Section */}
        <div className="bg-white border border-[#edf0f5] relative rounded-2xl w-full max-w-[342px]">
          <div className="flex flex-col gap-4 items-start p-5 rounded-[inherit] w-full">
            {/* Room Link Input */}
            <div className="bg-white border border-[#e0e0e0] h-10 relative rounded-xl w-full">
              <div className="flex h-10 items-center pl-2 pr-4 py-2.5 rounded-[inherit] w-full">
                <p className="font-normal text-sm text-[#1a1a1a] flex-1 truncate">
                  {roomLink}
                </p>
                <button
                  onClick={handleCopyLink}
                  className="bg-neutral-50 h-5 flex items-center justify-center px-2 py-1 rounded-md shrink-0 hover:bg-neutral-100 transition-colors"
                >
                  <span className="font-medium text-xs text-[#4a8fe3]">
                    {copied ? "복사됨!" : "복사"}
                  </span>
                </button>
              </div>
            </div>

            {/* KakaoTalk Share Button */}
            <button
              onClick={handleKakaoShare}
              className="bg-[#ffd600] border border-[#e0e0e0] h-12 flex gap-3 items-center justify-center px-4 py-2.5 rounded-xl w-full hover:bg-[#ffcc00] transition-colors"
            >
              <span className="font-medium text-base text-center text-white whitespace-pre-wrap">
                카카오톡으로 공유하기
              </span>
            </button>
          </div>
        </div>

        {/* Button Container */}
        <ButtonContainer
          onPrevious={handlePrevious}
          onNext={handleNext}
          className="w-full max-w-[342px]"
        />
      </div>
    </MobileLayout>
  );
}

