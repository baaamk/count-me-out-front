// src/components/common/HomeButton.jsx

import { useNavigate } from "react-router-dom";

/**
 * 홈으로 가기 버튼 컴포넌트
 * @param {string} className - 추가 클래스명
 * @param {string} variant - 버튼 스타일: 'default' | 'simple'
 * @param {function} onClick - 커스텀 클릭 핸들러 (선택사항)
 */
export default function HomeButton({ className = "", variant = "default", onClick }) {
  const navigate = useNavigate();

  const handleGoHome = () => {
    if (onClick) {
      onClick();
    } else {
      navigate("/");
    }
  };

  if (variant === "simple") {
    return (
      <button
        onClick={handleGoHome}
        className={`bg-[#f2f2f2] flex items-center justify-center h-10 px-3 rounded-xl hover:bg-[#e6e6e6] transition-colors shrink-0 ${className}`}
      >
        <span className="font-semibold text-sm text-[#333333] whitespace-nowrap">홈으로</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleGoHome}
      className={`bg-[#f2f2f2] flex gap-3 h-[60px] items-center justify-center px-5 py-4 rounded-xl text-[#666666] w-full max-w-[310px] hover:bg-[#e6e6e6] transition-colors ${className}`}
    >
      <span className="font-normal text-2xl">🏠</span>
      <span className="font-semibold text-base">홈으로 가기</span>
    </button>
  );
}

