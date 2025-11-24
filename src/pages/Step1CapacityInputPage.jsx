import { useNavigate } from "react-router-dom";
import { useState } from "react";
import MobileLayout from "../layouts/MobileLayout";

export default function Step1CapacityInputPage() {
  const navigate = useNavigate();
  const [capacity, setCapacity] = useState(2);

  const handleDecrease = () => {
    if (capacity > 2) {
      setCapacity(capacity - 1);
    }
  };

  const handleIncrease = () => {
    setCapacity(capacity + 1);
  };

  const handleNext = () => {
    // capacity를 다음 단계로 전달
    navigate("/settlement/receipt/step2", {
      state: { totalParticipants: capacity }
    });
  };

  return (
    <MobileLayout>
      <div className="flex flex-col gap-8 items-center justify-center pt-[60px] pb-10 px-6 bg-[#fafcff] min-h-screen w-full">
        {/* Header Section */}
        <div className="flex flex-col gap-2 items-center justify-center p-2.5 h-20 w-[342px]">
          <h1 className="font-bold text-2xl text-[#1a1a1a]">참여 인원 설정</h1>
          <p className="font-normal text-base text-gray-500">몇 명이 함께 정산하시나요?</p>
        </div>

        {/* Capacity Input Section */}
        <div className="flex flex-col gap-6 items-center justify-center p-2.5 rounded-2xl w-[342px] bg-white">
          {/* Number Display */}
          <div className="flex gap-2 items-center justify-center h-[60px] p-2.5 rounded-xl w-[200px] bg-neutral-50">
            <p className="font-semibold text-2xl text-[#1a1a1a]">{capacity}</p>
            <p className="font-normal text-base text-gray-500">명</p>
          </div>

          {/* Stepper Controls */}
          <div className="flex h-10 items-center justify-between p-2.5 w-[124px]">
            <button
              onClick={handleDecrease}
              disabled={capacity <= 2}
              className={`flex items-center justify-center p-2.5 rounded-[18px] size-9 ${
                capacity <= 2
                  ? "bg-[#e6e6e6] cursor-not-allowed"
                  : "bg-[#e6e6e6] hover:bg-gray-300"
              }`}
            >
              <p className="font-semibold text-xl text-gray-500">−</p>
            </button>
            <button
              onClick={handleIncrease}
              className="bg-[#333333] flex items-center justify-center p-2.5 rounded-[18px] size-9 hover:bg-[#444444]"
            >
              <p className="font-semibold text-xl text-white">+</p>
            </button>
          </div>
        </div>

        {/* Info Text */}
        <div className="flex flex-col justify-center">
          <p className="font-normal text-sm text-[#999999] leading-normal">
            최소 2명부터 시작할 수 있어요
          </p>
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          className="bg-[#333333] h-14 flex items-center justify-center p-2.5 rounded-2xl w-[342px] hover:bg-[#444444]"
        >
          <span className="font-semibold text-[18px] text-white">다음 단계</span>
        </button>
      </div>
    </MobileLayout>
  );
}

