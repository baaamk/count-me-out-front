// src/components/common/EmptyState.jsx

/**
 * 빈 상태 컴포넌트
 * @param {string} message - 표시할 메시지
 * @param {string} className - 추가 클래스명
 */
export default function EmptyState({ message = "데이터가 없습니다.", className = "" }) {
  return (
    <div className={`flex items-center justify-center h-32 rounded-xl w-full ${className}`}>
      <p className="font-medium text-sm text-gray-500">{message}</p>
    </div>
  );
}
