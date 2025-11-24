import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import MobileLayout from "../layouts/MobileLayout";

export default function TaxiStep5SetupCompletePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSpinning, setIsSpinning] = useState(true);

  useEffect(() => {
    // 2초 후 회전 애니메이션 중지
    const timer = setTimeout(() => {
      setIsSpinning(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleEnterRoom = () => {
    // 방장이 택시 정산 방으로 이동 (출발지/도착지 정보 전달)
    const departureInfo = location.state?.departureInfo || {
      name: "홍대입구역 5번출구",
      lat: 37.5572,
      lng: 126.9234,
    };
    
    const arrivalInfo = location.state?.arrivalInfo || {
      name: "강남역",
      lat: 37.4980,
      lng: 127.0276,
    };
    
    navigate("/taxi/settlement/room/host", {
      state: {
        departureInfo,
        arrivalInfo,
      },
    });
  };

  return (
    <MobileLayout>
      <div className="flex flex-col gap-8 items-center justify-center pt-[60px] pb-10 px-6 bg-[#fafcff] min-h-screen w-full">
        {/* Big Check with Spinning Animation */}
        <div 
          className="flex items-center justify-center relative shrink-0"
          style={{
            perspective: "1000px",
          }}
        >
          <div className="bg-[#3366ff] flex items-center justify-center p-2.5 relative rounded-[50px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] size-[100px]">
            <p
              className="font-bold text-[40px] text-white relative z-10"
              style={{
                transformOrigin: "center center",
                transformStyle: "preserve-3d",
                display: "inline-block",
                animation: isSpinning ? "flipY 1s linear infinite" : "none",
              }}
            >
              ✓
            </p>
            <div className="absolute inset-0 pointer-events-none shadow-[inset_0px_4px_4px_0px_rgba(255,255,255,0.25)] rounded-[50px]" />
          </div>
        </div>

        {/* Success Content */}
        <div className="bg-white border border-[#edf0f5] h-[200px] relative shrink-0 w-full max-w-[342px]">
          <div className="flex flex-col gap-6 h-[200px] items-center justify-center p-10 rounded-[inherit] w-full">
            <p className="text-[48px]">🎉</p>
            <p className="font-bold text-2xl text-[#1a1a1a] text-center whitespace-nowrap">
              모든 설정이 완료되었습니다!
            </p>
            <p className="font-normal text-base text-gray-500 text-center whitespace-nowrap">
              이제 정산내용을 실시간으로 확인하세요
            </p>
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={handleEnterRoom}
          className="bg-[#3366ff] h-14 flex items-center justify-center p-2.5 rounded-2xl w-full max-w-[342px] hover:bg-[#2555e6] transition-colors"
        >
          <span className="font-semibold text-base text-white">정산 방 들어가기</span>
        </button>
      </div>
    </MobileLayout>
  );
}

