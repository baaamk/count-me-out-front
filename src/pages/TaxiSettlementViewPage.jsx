import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import MobileLayout from "../layouts/MobileLayout";
import { SettlementHeader } from "../components/common";
import { ref, get } from "firebase/database";
import { database } from "../config/firebase";

export default function TaxiSettlementViewPage() {
  const navigate = useNavigate();
  const { uuid } = useParams();
  const [nickname, setNickname] = useState("");
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userNickname, setUserNickname] = useState("");
  const [settlementInfo, setSettlementInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettlementData = async () => {
      if (!uuid || !database) {
        setLoading(false);
        return;
      }

      try {
        // TODO: Firebase Auth에서 로그인 상태 확인
        setIsLoggedIn(false);
        setUserNickname("");

        // UUID로 Firebase에서 정산 방 데이터 가져오기
        const roomRef = ref(database, `settlements/${uuid}`);
        const snapshot = await get(roomRef);
        const roomData = snapshot.val();

        if (roomData) {
          const participants = Object.keys(roomData.participants || {});
          setSettlementInfo({
            totalAmount: roomData.taxiInfo?.totalAmount || 0,
            participantCount: participants.length,
            date: new Date(roomData.createdAt).toLocaleDateString("ko-KR"),
            participants,
          });
        }
        setLoading(false);
      } catch (err) {
        console.error("정산 데이터 조회 실패:", err);
        setLoading(false);
      }
    };

    fetchSettlementData();
  }, [uuid]);

  // 로그인된 상태라면 자동으로 정산 상세 페이지로 이동
  useEffect(() => {
    if (isLoggedIn && userNickname && settlementInfo && uuid) {
      // 참여자 목록에 사용자 닉네임이 있는지 확인
      if (settlementInfo.participants.includes(userNickname)) {
        navigate(`/taxi/settlement/${uuid}/payment/${userNickname}`);
      }
    }
  }, [isLoggedIn, userNickname, settlementInfo, uuid, navigate]);

  const handleConfirm = () => {
    if (!nickname.trim()) {
      alert("닉네임을 입력해주세요.");
      return;
    }

    if (!settlementInfo || !uuid) {
      alert("정산 정보를 불러올 수 없습니다.");
      return;
    }

    // 참여자 목록에 있는 닉네임인지 확인
    if (!settlementInfo.participants.includes(nickname)) {
      alert("참여자 목록에 없는 닉네임입니다. 올바른 닉네임을 입력해주세요.");
      return;
    }

    navigate(`/taxi/settlement/${uuid}/payment/${nickname}`);
  };

  if (loading) {
    return (
      <MobileLayout>
        <div className="flex justify-center items-center min-h-screen">
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </MobileLayout>
    );
  }

  if (!settlementInfo) {
    return (
      <MobileLayout>
        <div className="flex flex-col gap-4 items-center justify-center min-h-screen p-5">
          <p className="text-red-500">정산 방을 찾을 수 없습니다.</p>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="flex flex-col gap-5 items-center p-5 bg-neutral-50 min-h-screen w-full">
        {/* Settlement Header */}
        <SettlementHeader
          title="정산 내역 확인"
          subtitle="닉네임을 입력하여 정산 내역을 확인하세요"
        />

        {/* Settlement Info */}
        <div className="bg-[#f2f7ff] flex flex-col gap-3 h-[120px] items-center p-5 shrink-0 w-full max-w-[350px]">
          <p className="font-bold text-base text-[#3366cc]">📋 정산 정보</p>
          <p className="font-medium text-sm text-[#4d4d4d]">
            {settlementInfo.totalAmount > 0 ? `${settlementInfo.totalAmount.toLocaleString()}원 • ` : ""}{settlementInfo.participantCount}명 참여 • {settlementInfo.date}
          </p>
        </div>

        {/* Nickname Input Section */}
        <div className="bg-white flex flex-col gap-2.5 h-[200px] items-center overflow-clip p-5 shrink-0 w-full max-w-[350px]">
          <h2 className="font-bold text-base text-[#1a1a1a]">닉네임 입력</h2>
          <p className="font-medium text-xs text-gray-500">
            정산에 참여했던 닉네임을 입력해주세요
          </p>
          <input
            type="text"
            placeholder="닉네임을 입력해주세요"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="bg-white border border-[#e0e0e0] h-10 flex items-center px-4 py-2.5 rounded-xl w-full max-w-[302px] text-[12.5px] text-[#999999] outline-none focus:ring-2 focus:ring-[#333333] focus:text-[#1a1a1a]"
          />
          <button
            onClick={handleConfirm}
            className="bg-[#3366cc] flex gap-2 h-12 items-center justify-center px-4 py-3 rounded-lg shrink-0 w-full max-w-[310px] hover:bg-[#2555e6] transition-colors"
          >
            <span className="font-semibold text-base text-white">정산 내역 확인하기</span>
          </button>
        </div>

        {/* Participant List */}
        <div className="bg-white flex flex-col gap-3 h-[150px] items-start p-5 shrink-0 w-full max-w-[350px]">
          <h2 className="font-bold text-base text-[#1a1a1a]">참여자 목록</h2>
          <p className="font-medium text-sm text-gray-500">
            {settlementInfo.participants.join(", ")}
          </p>
          <p className="font-medium text-xs text-[#b3b3b3]">
            위 닉네임 중 하나를 입력해주세요
          </p>
        </div>
      </div>
    </MobileLayout>
  );
}

