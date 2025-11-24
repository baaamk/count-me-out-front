// src/components/common/LinkCopyButton.jsx

import { useState } from "react";

/**
 * 링크 복사 버튼 컴포넌트
 * @param {string} link - 복사할 링크
 * @param {string} className - 추가 클래스명
 */
export default function LinkCopyButton({ link, className = "" }) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("링크 복사 실패:", err);
      // Fallback: 텍스트 선택 방식
      const textArea = document.createElement("textarea");
      textArea.value = link;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopyLink}
      className={`bg-[#f2f2f2] flex gap-2 h-12 items-center justify-center px-4 py-3 rounded-xl text-[#666666] w-full max-w-[310px] hover:bg-[#e6e6e6] transition-colors ${className}`}
    >
      <span className="font-normal text-xl">🔗</span>
      <span className="font-semibold text-base text-[#333333]">
        {copied ? "복사됨!" : "링크 복사하기"}
      </span>
    </button>
  );
}

