// src/components/common/AccountCopyButton.jsx

import { useState } from "react";

/**
 * 계좌번호 복사 버튼 컴포넌트
 * @param {object} accountInfo - 계좌 정보 { bank: string, accountNumber: string, name?: string }
 * @param {string} className - 추가 클래스명
 */
export default function AccountCopyButton({ accountInfo, className = "" }) {
  const [copied, setCopied] = useState(false);

  const handleCopyAccount = async () => {
    const accountText = accountInfo.name
      ? `${accountInfo.bank} ${accountInfo.accountNumber} (${accountInfo.name})`
      : `${accountInfo.bank} ${accountInfo.accountNumber}`;

    try {
      await navigator.clipboard.writeText(accountText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("계좌번호 복사 실패:", err);
      // Fallback: 텍스트 선택 방식
      const textArea = document.createElement("textarea");
      textArea.value = accountText;
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
      onClick={handleCopyAccount}
      className={`bg-white border border-[#e0e0e0] flex gap-3 h-[60px] items-center justify-center px-5 py-4 rounded-xl w-full max-w-[310px] hover:bg-[#f5f5f5] transition-colors ${className}`}
    >
      <span className="font-normal text-2xl">📋</span>
      <span className="font-semibold text-base text-[#333333]">
        {copied ? "복사 완료!" : "계좌번호 복사"}
      </span>
    </button>
  );
}

