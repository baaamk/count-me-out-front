// src/components/common/Modal.jsx

/**
 * 공통 모달 컴포넌트
 * @param {boolean} isOpen - 모달 열림 여부
 * @param {function} onClose - 닫기 핸들러
 * @param {React.ReactNode} children - 모달 내용
 * @param {string} className - 추가 클래스명
 * @param {boolean} closeOnOverlayClick - 오버레이 클릭 시 닫기 여부
 */
export default function Modal({
  isOpen,
  onClose,
  children,
  className = "",
  closeOnOverlayClick = true,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
      onClick={closeOnOverlayClick ? onClose : undefined}
    >
      <div
        className={`bg-white rounded-2xl relative ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

