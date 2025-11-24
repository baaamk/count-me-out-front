import { useState, useEffect } from "react";

export default function AccountSettingsModal({ isOpen, onClose, onSave, initialData }) {
  const [bank, setBank] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [kakaoPayCode, setKakaoPayCode] = useState("");
  const [showBankDropdown, setShowBankDropdown] = useState(false);

  // initialData가 변경되면 상태 업데이트
  useEffect(() => {
    if (initialData) {
      setBank(initialData.bank || "");
      setAccountNumber(initialData.accountNumber || "");
      setKakaoPayCode(initialData.kakaoPayCode || "");
    } else {
      setBank("");
      setAccountNumber("");
      setKakaoPayCode("");
    }
  }, [initialData, isOpen]);

  const banks = [
    "경남은행",
    "광주은행",
    "단위농협(지역농축협)",
    "부산은행",
    "새마을금고",
    "산림조합",
    "신한은행",
    "신협",
    "씨티은행",
    "우리은행",
    "우체국예금보험",
    "저축은행중앙회",
    "전북은행",
    "제주은행",
    "카카오뱅크",
    "케이뱅크",
    "토스뱅크",
    "하나은행",
    "홍콩상하이은행",
    "IBK기업은행",
    "KB국민은행",
    "iM뱅크(대구)",
    "한국산업은행",
    "NH농협은행",
    "SC제일은행",
    "Sh수협은행",
  ];

  const handleSave = () => {
    if (!bank) {
      alert("은행을 선택해주세요.");
      return;
    }
    if (!accountNumber.trim()) {
      alert("계좌번호를 입력해주세요.");
      return;
    }
    // 카카오페이 코드는 선택사항이므로 필수 검증 제거

    onSave({
      bank,
      accountNumber,
      kakaoPayCode: kakaoPayCode.trim() || null,
    });
    handleClose();
  };

  const handleClose = () => {
    setShowBankDropdown(false);
    onClose();
  };

  const handleBankSelect = (selectedBank) => {
    setBank(selectedBank);
    setShowBankDropdown(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
      onClick={handleClose}
    >
      <div
        className="bg-white flex flex-col gap-4 h-[443px] items-start p-6 rounded-2xl w-[320px] max-w-[90vw] relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-6 right-6 text-[#6b7380] hover:opacity-70 transition-opacity"
        >
          <span className="text-lg">✕</span>
        </button>

        {/* Modal Header */}
        <div className="flex flex-col gap-1 h-[54px] items-start justify-end w-full max-w-[272px]">
          <h2 className="font-bold text-base text-gray-900">정산 계좌 및 송금 설정</h2>
          <div className="font-normal text-[11px] text-[#6b7380]">
            <p className="mb-0">입금 받을 계좌와 송금 링크를 저장해두면</p>
            <p>정산 요청 시 친구가 바로 송금할 수 있어요.</p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="flex flex-col gap-4 h-[264px] items-start w-full max-w-[272px]">
          {/* Bank Selection */}
          <div className="flex flex-col gap-2 w-full">
            <label className="font-semibold text-[13px] text-[#333333]">은행 선택</label>
            <div className="relative w-full">
              <button
                onClick={() => setShowBankDropdown(!showBankDropdown)}
                className="bg-neutral-50 border border-[#e0e0e0] h-11 px-4 py-3 rounded-xl w-full flex items-center justify-between hover:bg-neutral-100 transition-colors"
              >
                <span className={`font-medium text-sm ${bank ? "text-[#1a1a1a]" : "text-[#767676]"}`}>
                  {bank || "은행 선택"}
                </span>
                <span className={`font-normal text-[#999999] transition-transform ${showBankDropdown ? "rotate-180" : ""}`}>
                  ▼
                </span>
              </button>
              {showBankDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#e0e0e0] rounded-xl shadow-lg max-h-48 overflow-y-auto z-10">
                  {banks.map((bankName) => (
                    <button
                      key={bankName}
                      onClick={() => handleBankSelect(bankName)}
                      className="w-full px-4 py-3 text-left hover:bg-neutral-50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                    >
                      <span className="font-medium text-sm text-[#1a1a1a]">{bankName}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Account Number */}
          <div className="flex flex-col gap-2 w-full">
            <label className="font-semibold text-[13px] text-[#333333]">계좌번호</label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9-]/g, "");
                setAccountNumber(value);
              }}
              placeholder="계좌번호를 입력하세요"
              className="bg-neutral-50 border border-[#e0e0e0] h-11 px-4 py-3 rounded-xl w-full text-sm text-[#1a1a1a] outline-none focus:ring-2 focus:ring-[#3366cc] placeholder:text-[#767676]"
            />
          </div>

          {/* KakaoPay Code */}
          <div className="flex flex-col gap-1 w-full">
            <label className="font-semibold text-[13px] text-[#333333]">카카오페이 송금코드 (선택)</label>
            <input
              type="text"
              value={kakaoPayCode}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, "");
                setKakaoPayCode(value);
              }}
              placeholder="카카오페이 송금코드 입력 (선택사항)"
              className="bg-neutral-50 border border-[#e0e0e0] h-11 px-4 py-3 rounded-xl w-full text-[13px] text-[#1a1a1a] outline-none focus:ring-2 focus:ring-[#3366cc] placeholder:text-[#767676]"
            />
            <p className="font-medium text-[11px] text-[#666666]">
              카카오페이 송금코드는 선택 항목입니다.
            </p>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="bg-[#3b82f2] flex items-center justify-center h-[52px] px-4 py-4 rounded-[14px] w-full max-w-[272px] hover:bg-[#2563eb] transition-colors"
        >
          <span className="font-semibold text-base text-white">저장하기</span>
        </button>
      </div>
    </div>
  );
}

