// src/components/common/Divider.jsx

/**
 * 구분선 컴포넌트
 * @param {string} className - 추가 클래스명
 */
export default function Divider({ className = "" }) {
  return <div className={`bg-neutral-200 h-px w-full ${className}`} />;
}

