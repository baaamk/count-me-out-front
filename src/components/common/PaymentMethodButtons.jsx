// src/components/common/PaymentMethodButtons.jsx

/**
 * 송금 방법 버튼 그룹 컴포넌트 (카카오페이, 토스)
 * @param {function} onKakaoPay - 카카오페이 버튼 클릭 핸들러
 * @param {function} onToss - 토스 버튼 클릭 핸들러
 * @param {string} className - 추가 클래스명
 */
export default function PaymentMethodButtons({ onKakaoPay, onToss, className = "" }) {
  return (
    <div className={`flex gap-3 items-center w-full max-w-[310px] ${className}`}>
      {/* KakaoPay Button */}
      <button
        onClick={onKakaoPay}
        className="bg-[#FFE500] flex flex-1 gap-2 h-[60px] items-center justify-center px-4 py-3 rounded-xl hover:bg-[#FFD700] transition-colors"
      >
        <span className="font-normal text-2xl">💛</span>
        <span className="font-semibold text-base text-[#3C1E1E]">카카오페이</span>
      </button>

      {/* Toss Button */}
      <button
        onClick={onToss}
        className="bg-[#0064FF] flex flex-1 gap-2 h-[60px] items-center justify-center px-4 py-3 rounded-xl hover:bg-[#0052CC] transition-colors"
      >
        <span className="font-normal text-2xl">💙</span>
        <span className="font-semibold text-base text-white">토스</span>
      </button>
    </div>
  );
}

