import { useState } from "react";

/**
 * 카카오페이 송금코드 안내 모달
 */
export default function KakaoPayHelpModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white flex flex-col gap-4 items-start p-6 rounded-2xl w-[320px] max-w-[90vw] relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-[#6b7380] hover:opacity-70 transition-opacity"
        >
          <span className="text-lg">✕</span>
        </button>

        {/* Modal Header */}
        <div className="flex flex-col gap-1 items-start w-full">
          <h2 className="font-bold text-base text-gray-900">카카오페이 송금코드 가져오기</h2>
        </div>

        {/* Instructions */}
        <div className="flex flex-col gap-3 items-start w-full">
          <div className="flex flex-col gap-2">
            <p className="font-semibold text-sm text-[#1a1a1a]">1단계</p>
            <p className="font-normal text-sm text-[#666666]">
              카카오페이 앱을 실행하세요
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <p className="font-semibold text-sm text-[#1a1a1a]">2단계</p>
            <p className="font-normal text-sm text-[#666666]">
              하단 메뉴에서 <span className="font-semibold">"더보기"</span>를 선택하세요
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <p className="font-semibold text-sm text-[#1a1a1a]">3단계</p>
            <p className="font-normal text-sm text-[#666666]">
              <span className="font-semibold">"송금"</span> 메뉴를 선택하세요
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <p className="font-semibold text-sm text-[#1a1a1a]">4단계</p>
            <p className="font-normal text-sm text-[#666666]">
              <span className="font-semibold">"코드로 송금받기"</span>를 선택하세요
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <p className="font-semibold text-sm text-[#1a1a1a]">5단계</p>
            <p className="font-normal text-sm text-[#666666]">
              송금코드를 복사하여 입력하세요
            </p>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="bg-[#3b82f2] flex items-center justify-center h-[52px] px-4 py-4 rounded-[14px] w-full hover:bg-[#2563eb] transition-colors"
        >
          <span className="font-semibold text-base text-white">확인</span>
        </button>
      </div>
    </div>
  );
}

