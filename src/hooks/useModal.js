import { useState } from "react";

/**
 * 모달 관리 커스텀 훅
 * @returns {Object} 모달 상태 및 핸들러
 */
export function useModal() {
  const [isOpen, setIsOpen] = useState(false);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen((prev) => !prev);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}

