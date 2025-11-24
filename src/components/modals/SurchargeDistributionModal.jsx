import { useState } from "react";

/**
 * 시외 할증 분배 방식 선택 모달
 * @param {boolean} isOpen - 모달 열림/닫힘 상태
 * @param {function} onClose - 모달 닫기 핸들러
 * @param {function} onConfirm - 확인 버튼 클릭 핸들러 (선택된 옵션을 인자로 전달)
 */
export default function SurchargeDistributionModal({ isOpen, onClose, onConfirm }) {
  const [selectedOption, setSelectedOption] = useState("equal"); // "equal" 또는 "boundary"

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(selectedOption);
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-[rgba(0,0,0,0.4)] flex flex-col items-center justify-center z-50"
      onClick={handleOverlayClick}
    >
      <div className="bg-white flex flex-col h-[400px] items-start overflow-clip p-6 relative rounded-2xl shrink-0 w-[320px]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="bg-white flex items-center justify-center overflow-clip relative shrink-0 size-6 mb-4"
        >
          <p className="font-normal text-[18px] text-[#6b7380]">✕</p>
        </button>

        {/* Modal Header */}
        <div className="bg-white flex flex-col gap-1 h-[45px] items-start justify-end mb-4 w-[272px]">
          <p className="font-bold text-base text-gray-900">시외 할증 분배 방식 선택</p>
          <p className="font-normal text-[11px] text-[#6b7380]">
            심야/통행료 등 기타 특수요금은 총액에 포함되어 일괄 분배
          </p>
        </div>

        {/* Options Container */}
        <div className="bg-white flex flex-col gap-2 h-[154px] items-start overflow-clip pb-0 pt-5 px-0 mb-4 w-[272px]">
          {/* Option 1: 시외 할증 포함 균등 분배 */}
          <button
            onClick={() => setSelectedOption("equal")}
            className={`flex gap-3 h-[52px] items-center justify-center px-4 py-3 rounded-xl w-[272px] transition-colors ${
              selectedOption === "equal"
                ? "bg-[#f0f5ff]"
                : "bg-white border border-[#e0e0e0]"
            }`}
          >
            <p className="font-semibold text-sm text-gray-900">시외 할증 포함 균등 분배</p>
          </button>

          {/* Option 2: 시외 구간만 부담 */}
          <button
            onClick={() => setSelectedOption("boundary")}
            className={`flex gap-3 h-[52px] items-center justify-center px-4 py-3 rounded-xl w-[272px] transition-colors ${
              selectedOption === "boundary"
                ? "bg-[#f0f5ff]"
                : "bg-white border border-[#e0e0e0]"
            }`}
          >
            <div className="flex flex-col gap-1 h-[41px] items-center justify-center w-[240px]">
              <p className="font-semibold text-sm text-gray-900">시외 구간만 부담</p>
              <p className="font-normal text-[13px] text-[#6b7380]">
                (경계 이후 하차자에게만 할증 분배)
              </p>
            </div>
          </button>
        </div>

        {/* Confirm Button */}
        <button
          onClick={handleConfirm}
          className="bg-[#3b82f2] flex h-12 items-center justify-center relative rounded-xl w-[272px] hover:bg-[#2563eb] transition-colors"
        >
          <span className="font-semibold text-base text-white">확인</span>
        </button>
      </div>
    </div>
  );
}

