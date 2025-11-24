// src/components/common/ParticipantEntryForm.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * 참여자 진입 폼 컴포넌트
 * @param {number} totalParticipants - 전체 참여자 수
 * @param {number} currentParticipants - 현재 참여자 수
 * @param {function} onConfirm - 확인 버튼 클릭 핸들러 (nickname을 인자로 받음)
 * @param {string} loginReturnTo - 로그인 후 돌아올 경로
 * @param {string} className - 추가 클래스명
 */
export default function ParticipantEntryForm({
  totalParticipants,
  currentParticipants,
  onConfirm,
  loginReturnTo,
  className = "",
}) {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState("");
  const remainingParticipants = totalParticipants - currentParticipants;

  const handleConfirm = () => {
    if (!nickname.trim()) {
      alert("닉네임을 입력해주세요.");
      return;
    }
    if (onConfirm) {
      onConfirm(nickname);
    }
  };

  const handleLogin = () => {
    navigate("/login", { state: { returnTo: loginReturnTo || "/" } });
  };

  return (
    <div className={`flex flex-col gap-6 items-center pt-11 pb-[34px] px-5 bg-neutral-50 min-h-screen w-full ${className}`}>
      {/* Status Bar */}
      <div className="bg-[#f2f2f2] h-10 flex items-center justify-between px-4 py-3 rounded-xl w-full max-w-[335px]">
        <p className="font-semibold text-sm text-[#333333]">
          참여 현황: {currentParticipants}명 / {totalParticipants}명 | 미참여 {remainingParticipants}명
        </p>
      </div>

      {/* User Auth Section */}
      <div className="bg-white flex flex-col gap-5 h-[104px] items-center px-5 py-6 w-full max-w-[335px]">
        <h1 className="font-bold text-2xl text-[#1a1a1a]">참여하기</h1>
        <p className="font-normal text-base text-gray-500">
          닉네임으로 참여하거나 로그인해주세요
        </p>
      </div>

      {/* Nickname Field */}
      <div className="bg-white border border-[#edf0f5] h-[148px] relative rounded-2xl w-full max-w-[342px]">
        <div className="flex flex-col gap-[15px] h-[148px] items-center justify-center px-5 py-2.5 rounded-[inherit] w-full">
          {/* Nickname Input */}
          <div className="flex flex-col gap-2 items-start w-full max-w-[302px]">
            <label className="font-semibold text-sm text-[#1a1a1a]">닉네임</label>
            <input
              type="text"
              placeholder="닉네임을 입력해주세요"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="bg-white border border-[#e0e0e0] h-10 flex items-center px-4 py-2.5 rounded-xl w-full text-[12.5px] text-[#999999] outline-none focus:ring-2 focus:ring-[#333333] focus:text-[#1a1a1a]"
            />
          </div>

          {/* Confirm Button */}
          <button
            onClick={handleConfirm}
            className="bg-[#3b82f2] flex items-center justify-center h-10 px-4 py-2 rounded-xl shrink-0 w-full hover:bg-[#2563eb] transition-colors"
          >
            <span className="font-semibold text-base text-white">확인</span>
          </button>
        </div>
      </div>

      {/* Login Option */}
      <button
        onClick={handleLogin}
        className="bg-[#f0f5ff] border border-[#e6e6e6] h-[60px] flex items-center justify-between px-5 py-4 rounded-xl w-full max-w-[295px] hover:bg-[#e0ebff] transition-colors"
      >
        <span className="font-semibold text-base text-[#333333]">로그인하고 참여하기</span>
        <span className="font-semibold text-lg text-[#666666]">→</span>
      </button>
    </div>
  );
}

