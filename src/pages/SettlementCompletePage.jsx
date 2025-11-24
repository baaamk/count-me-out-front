import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import MobileLayout from "../layouts/MobileLayout";
import { SettlementSummaryCard, LinkCopyButton } from "../components/common";
import { ref, get } from "firebase/database";
import { database } from "../config/firebase";
import { shareToKakaoTalk } from "../utils/kakaoShare";

export default function SettlementCompletePage() {

  const { roomId } = useLocation().state || {};
  const [settlementData, setSettlementData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettlementData = async () => {
      if (!roomId || !database) {
        setLoading(false);
        return;
      }

      try {
        const roomRef = ref(database, `settlements/${roomId}`);
        const snapshot = await get(roomRef);
        const roomData = snapshot.val();

        if (roomData) {
          // menuItems를 배열로 변환 (객체인 경우 Object.values 사용)
          const menuItemsArray = Array.isArray(roomData.menuItems)
            ? roomData.menuItems
            : roomData.menuItems
            ? Object.values(roomData.menuItems)
            : [];
          
          const participants = Object.values(roomData.participants || {});
          
          // 각 메뉴별로 실시간으로 pricePerPerson 계산
          const menuItemsWithPricePerPerson = menuItemsArray.map((item) => {
            // completed: true인 참여자만 카운트 (확정한 참여자만)
            const completedParticipants = participants.filter(p => p.completed === true);
            const confirmedCount = completedParticipants.filter((p) => {
              const selectedIds = p.selectedMenuIds;
              // null이거나 배열이 아니거나 빈 배열이면 선택하지 않은 것으로 처리
              if (!selectedIds || !Array.isArray(selectedIds) || selectedIds.length === 0) {
                return false;
              }
              // 타입 일치 확인 (숫자로 변환하여 비교)
              const menuId = typeof item.id === 'number' ? item.id : Number(item.id);
              return selectedIds.some(id => {
                const selectedId = typeof id === 'number' ? id : Number(id);
                return selectedId === menuId;
              });
            }).length;
            
            // pricePerPerson 실시간 계산 (확정한 참여자 수 기반)
            const calculatedPricePerPerson = confirmedCount > 0
              ? Math.floor((item.price || 0) / confirmedCount)
              : item.price || 0;
            
            return {
              ...item,
              pricePerPerson: item.pricePerPerson ?? calculatedPricePerPerson,
            };
          });
          
          setSettlementData({
            totalAmount: menuItemsArray.reduce((sum, item) => sum + item.price, 0),
            participantCount: participants.length,
            date: new Date(roomData.createdAt).toLocaleDateString("ko-KR"),
            participants: participants.map((p) => {
              // 참여자가 선택한 메뉴들의 pricePerPerson 합산
              const selectedMenuIds = p.selectedMenuIds || [];
              const amount = menuItemsWithPricePerPerson
                .filter((item) => {
                  const itemId = typeof item.id === 'number' ? item.id : Number(item.id);
                  return selectedMenuIds.some(id => {
                    const selectedId = typeof id === 'number' ? id : Number(id);
                    return selectedId === itemId;
                  });
                })
                .reduce((sum, item) => sum + (item.pricePerPerson || 0), 0);
              
              return {
                name: p.nickname,
                menuItems: menuItemsWithPricePerPerson
                  .filter((item) => {
                    const itemId = typeof item.id === 'number' ? item.id : Number(item.id);
                    return selectedMenuIds.some(id => {
                      const selectedId = typeof id === 'number' ? id : Number(id);
                      return selectedId === itemId;
                    });
                  })
                  .map((item) => item.name)
                  .join(" + "),
                amount: amount,
              };
            }),
          });
        }
        setLoading(false);
      } catch (err) {
        console.error("정산 데이터 조회 실패:", err);
        setLoading(false);
      }
    };

    fetchSettlementData();
  }, [roomId]);

  const settlementLink = roomId ? `${window.location.origin}/settlement/${roomId}` : "";

  const handleKakaoShare = async () => {
    if (!settlementLink) {
      alert("정산 링크를 생성할 수 없습니다.");
      return;
    }

    const shareTitle = "정산 내역 확인";
    const shareText = "정산 내역을 확인해보세요!";
    
    await shareToKakaoTalk(shareTitle, shareText, settlementLink);
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

  if (!settlementData) {
    return (
      <MobileLayout>
        <div className="flex flex-col gap-4 items-center justify-center min-h-screen p-5">
          <p className="text-red-500">정산 데이터를 불러올 수 없습니다.</p>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="flex flex-col gap-5 items-center p-5 bg-neutral-50 min-h-screen w-full">
        {/* Notification Header */}
        <div className="bg-white flex flex-col gap-2 h-20 items-center p-5 shrink-0 w-full max-w-[350px]">
          <h1 className="font-bold text-xl text-[#1a1a1a]">📢 정산 완료 알림</h1>
          <p className="font-medium text-sm text-gray-500">
            참여자들에게 정산 내역을 공유하세요
          </p>
        </div>

        {/* Settlement Summary */}
        <SettlementSummaryCard
          totalAmount={settlementData.totalAmount}
          participantCount={settlementData.participantCount}
          date={settlementData.date}
        />

        {/* Participant Details */}
        <div className="bg-white flex flex-col gap-4 h-[215px] items-start p-5 shrink-0 w-full max-w-[350px]">
          <h2 className="font-bold text-base text-[#1a1a1a]">참여자별 정산 내역</h2>
          {settlementData.participants.map((participant, index) => (
            <div
              key={index}
              className="bg-neutral-50 flex h-10 items-center justify-between px-4 py-2 shrink-0 w-full max-w-[310px]"
            >
              <div className="flex gap-2 h-6 items-center shrink-0 w-[200px]">
                <p className="font-semibold text-sm text-[#1a1a1a]">{participant.name}</p>
                <p className="font-medium text-xs text-gray-500">{participant.menuItems}</p>
              </div>
              <p className="font-bold text-base text-[#1a1a1a]">
                {participant.amount.toLocaleString()}원
              </p>
            </div>
          ))}
        </div>

        {/* Share Buttons */}
        <div className="bg-white flex flex-col gap-3 h-[183px] items-start p-5 shrink-0 w-full max-w-[350px]">
          <h2 className="font-bold text-base text-[#1a1a1a]">공유하기</h2>
          
          {/* KakaoTalk Share Button */}
          <button
            onClick={handleKakaoShare}
            className="bg-[#ffcc00] flex gap-2 h-12 items-center justify-center px-4 py-3 rounded-xl text-white w-full max-w-[310px] hover:bg-[#ffc000] transition-colors"
          >
            <span className="font-normal text-xl">💬</span>
            <span className="font-semibold text-base">카카오톡으로 공유하기</span>
          </button>

          {/* Link Copy Button */}
          <LinkCopyButton link={settlementLink} />
        </div>
      </div>
    </MobileLayout>
  );
}

