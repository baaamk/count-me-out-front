// src/components/common/Card.jsx

/**
 * 카드 컴포넌트
 * @param {React.ReactNode} children - 자식 요소
 * @param {string} className - 추가 클래스명
 * @param {function} onClick - 클릭 핸들러
 * @param {boolean} hover - 호버 효과 여부
 */
export default function Card({ children, className = "", onClick, hover = false }) {
  const baseStyles = "bg-white rounded-3xl";
  const hoverStyles = hover ? "hover:bg-neutral-50 transition-colors cursor-pointer" : "";
  
  return (
    <div
      className={`${baseStyles} ${hoverStyles} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
