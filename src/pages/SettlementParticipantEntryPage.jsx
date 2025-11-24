import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import MobileLayout from "../layouts/MobileLayout";
import { ParticipantEntryForm } from "../components/common";
import { ref, get, update, onDisconnect } from "firebase/database";
import { database, auth } from "../config/firebase";

export default function SettlementParticipantEntryPage() {
  const navigate = useNavigate();
  const { roomId: roomIdFromParams } = useParams();
  const location = useLocation();
  // URL 파라미터 또는 location.state에서 roomId 가져오기
  const roomId = roomIdFromParams || location.state?.roomId;
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [currentParticipants, setCurrentParticipants] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Firebase에서 정산 방 정보 가져오기
  useEffect(() => {
    if (!roomId || !database) {
      setError("방 정보를 불러올 수 없습니다.");
      setLoading(false);
      return;
    }

    const fetchRoomData = async () => {
      try {
        const roomRef = ref(database, `settlements/${roomId}`);
        const snapshot = await get(roomRef);
        const data = snapshot.val();

        if (!data) {
          setError("방을 찾을 수 없습니다.");
          setLoading(false);
          return;
        }

        if (data.status === "completed") {
          setError("이미 완료된 정산입니다.");
          setLoading(false);
          return;
        }

        setTotalParticipants(data.totalParticipants || 0);
        setCurrentParticipants(data.currentParticipants || 0);
        setLoading(false);
      } catch (err) {
        console.error("방 정보 가져오기 실패:", err);
        setError("방 정보를 불러오는 중 오류가 발생했습니다.");
        setLoading(false);
      }
    };

    fetchRoomData();
  }, [roomId]);

  const handleConfirm = async (nickname) => {
    if (!roomId || !database || !nickname.trim()) {
      alert("닉네임을 입력해주세요.");
      return;
    }

    try {
      const roomRef = ref(database, `settlements/${roomId}`);
      const snapshot = await get(roomRef);
      const roomData = snapshot.val();

      if (!roomData) {
        alert("방을 찾을 수 없습니다.");
        return;
      }

      // 닉네임 중복 확인
      if (roomData.participants?.[nickname.trim()]) {
        alert("이미 사용 중인 닉네임입니다. 다른 닉네임을 사용해주세요.");
        return;
      }

      // 참여자 추가 (로그인한 사용자의 UID도 저장)
      const currentUser = auth.currentUser;
      const participantRef = ref(database, `settlements/${roomId}/participants/${nickname.trim()}`);
      await update(participantRef, {
        nickname: nickname.trim(),
        isHost: false,
        selectedMenuIds: null, // 빈 배열 대신 null 사용
        completed: false,
        joinedAt: Date.now(),
        uid: currentUser?.uid || null, // 로그인한 사용자의 UID 저장 (선택사항)
      });
      
      // onDisconnect 설정: 연결이 끊어지면 자동으로 참여자 제거
      // (단, completed: true가 아닌 경우에만)
      onDisconnect(participantRef).remove().catch((error) => {
        console.error("onDisconnect 설정 실패:", error);
        // 실패해도 계속 진행 (선택사항 기능)
      });

      // 현재 참여자 수 업데이트
      const newCurrentParticipants = (roomData.currentParticipants || 0) + 1;
      await update(ref(database, `settlements/${roomId}`), {
        currentParticipants: newCurrentParticipants,
      });

      // 메뉴 선택 페이지로 이동
      navigate(`/settlement/room/${roomId}/menu-selection`, {
        state: { roomId, userNickname: nickname.trim() }
      });
    } catch (err) {
      console.error("참여 처리 실패:", err);
      alert("참여 처리에 실패했습니다. 다시 시도해주세요.");
    }
  };

  if (loading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p>방 정보를 불러오는 중...</p>
        </div>
      </MobileLayout>
    );
  }

  if (error) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <p className="text-red-500">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            홈으로 돌아가기
          </button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <ParticipantEntryForm
        totalParticipants={totalParticipants}
        currentParticipants={currentParticipants}
        onConfirm={handleConfirm}
        loginReturnTo={`/settlement/room/${roomId}/participant-entry`}
      />
    </MobileLayout>
  );
}

