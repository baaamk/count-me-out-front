import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import MobileLayout from "../layouts/MobileLayout";
import { ref, get, update, onValue } from "firebase/database";
import { database } from "../config/firebase";

export default function SettlementMenuSelectionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedMenuIds, setSelectedMenuIds] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [currentParticipants, setCurrentParticipants] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Step5에서 온 경우 방장으로 간주
  const isHost = location.state?.isHost || false;
  const roomId = location.state?.roomId;
  const [userNickname, setUserNickname] = useState(location.state?.userNickname || null);

  // Firebase에서 정산 방 데이터 가져오기
  useEffect(() => {
    if (!roomId || !database) {
      setLoading(false);
      return;
    }

    const roomRef = ref(database, `settlements/${roomId}`);
    
    // 실시간 구독
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // menuItems를 배열로 변환 (객체인 경우 Object.values 사용)
        const items = Array.isArray(data.menuItems)
          ? data.menuItems
          : data.menuItems
          ? Object.values(data.menuItems)
          : [];
        // 각 항목에 필수 속성 기본값 설정
        // participantCount와 pricePerPerson은 참여자 선택 후 계산되므로 초기에는 없을 수 있음
        const safeItems = items.map(item => ({
          id: item.id || 0,
          name: item.name || '',
          price: item.price || 0,
          quantity: item.quantity || 1,
          participantCount: item.participantCount, // undefined일 수 있음 (참여자 선택 후 계산)
          pricePerPerson: item.pricePerPerson, // undefined일 수 있음 (참여자 선택 후 계산)
          participants: item.participants || [],
        }));
        setMenuItems(safeItems);
        setTotalParticipants(data.totalParticipants || 0);
        setCurrentParticipants(data.currentParticipants || 0);
        
        // 방장인 경우: Firebase에서 방장 정보를 가져와서 selectedMenuIds 초기화
        if (isHost && !userNickname) {
          const participants = data.participants || {};
          const hostParticipant = Object.values(participants).find(p => p.isHost === true);
          if (hostParticipant) {
            setUserNickname(hostParticipant.nickname);
            // 방장의 selectedMenuIds를 불러와서 초기화 (null이면 빈 배열)
            const hostSelectedIds = hostParticipant.selectedMenuIds;
            if (hostSelectedIds && Array.isArray(hostSelectedIds) && hostSelectedIds.length > 0) {
              setSelectedMenuIds(hostSelectedIds);
            } else {
              // null이거나 빈 배열이면 빈 배열로 초기화
              setSelectedMenuIds([]);
            }
          }
        } else if (!isHost && userNickname) {
          // 참여자인 경우: Firebase에서 자신의 selectedMenuIds 불러오기
          const participant = data.participants?.[userNickname];
          if (participant) {
            const participantSelectedIds = participant.selectedMenuIds;
            if (participantSelectedIds && Array.isArray(participantSelectedIds) && participantSelectedIds.length > 0) {
              setSelectedMenuIds(participantSelectedIds);
            } else {
              setSelectedMenuIds([]);
            }
          }
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [roomId, isHost, userNickname]);

  const remainingParticipants = totalParticipants - currentParticipants;

  const handleMenuToggle = (menuId) => {
    setSelectedMenuIds((prev) =>
      prev.includes(menuId)
        ? prev.filter((id) => id !== menuId)
        : [...prev, menuId]
    );
  };

  const handleConfirm = async () => {
    if (!roomId || !database) {
      alert("방 정보를 불러올 수 없습니다.");
      return;
    }

    // 방장인 경우 userNickname이 아직 설정되지 않았을 수 있으므로 확인
    let finalUserNickname = userNickname;
    if (isHost && !finalUserNickname) {
      try {
        const roomRef = ref(database, `settlements/${roomId}`);
        const snapshot = await get(roomRef);
        const roomData = snapshot.val();
        if (roomData) {
          const participants = roomData.participants || {};
          const hostParticipant = Object.values(participants).find(p => p.isHost === true);
          if (hostParticipant) {
            finalUserNickname = hostParticipant.nickname;
            setUserNickname(finalUserNickname);
          }
        }
      } catch (err) {
        console.error("방장 정보 가져오기 실패:", err);
      }
    }

    if (!finalUserNickname) {
      alert("사용자 정보를 찾을 수 없습니다.");
      return;
    }

    try {
      const roomRef = ref(database, `settlements/${roomId}`);
      const snapshot = await get(roomRef);
      const roomData = snapshot.val();

      if (!roomData) {
        alert("방 정보를 찾을 수 없습니다.");
        return;
      }

      // 참여자 정보 업데이트
      const participantRef = ref(database, `settlements/${roomId}/participants/${finalUserNickname}`);
      await update(participantRef, {
        selectedMenuIds: selectedMenuIds.length > 0 ? selectedMenuIds : null, // 빈 배열이면 null로 저장
        completed: true,
        completedAt: Date.now(),
      });

      // 현재 완료된 참여자 수 업데이트
      const completedCount = Object.values(roomData.participants || {}).filter(
        (p) => p.completed
      ).length + (roomData.participants?.[finalUserNickname]?.completed ? 0 : 1);
      
      await update(ref(database, `settlements/${roomId}`), {
        currentParticipants: completedCount,
      });

      // 각 메뉴 항목의 참여자 수 계산 및 업데이트
      // 모든 참여자의 선택을 기반으로 계산
      const allParticipants = Object.values(roomData.participants || {});
      const menuUpdates = {};
      
      menuItems.forEach((menuItem) => {
        // 이 메뉴를 선택한 참여자 수 계산
        const selectedParticipants = allParticipants.filter(
          (p) => p.selectedMenuIds?.includes(menuItem.id)
        ).length;
        
        const participantCount = selectedParticipants;
        const pricePerPerson = participantCount > 0 
          ? Math.floor(menuItem.price / participantCount)
          : menuItem.price;
        
        // menuItems는 객체 구조이므로 menuItem.id를 키로 사용
        menuUpdates[`menuItems/${menuItem.id}/participantCount`] = participantCount;
        menuUpdates[`menuItems/${menuItem.id}/pricePerPerson`] = pricePerPerson;
      });

      if (Object.keys(menuUpdates).length > 0) {
        await update(ref(database, `settlements/${roomId}`), menuUpdates);
      }

      if (isHost) {
        // 방장은 방장 페이지로 이동
        navigate(`/settlement/room/${roomId}/host`, { state: { roomId } });
      } else {
        // 참여자는 메뉴 선택 확정 페이지로 이동
        navigate(`/settlement/room/${roomId}/menu-selection-confirmed`, { 
          state: { roomId, userNickname: finalUserNickname } 
        });
      }
    } catch (error) {
      console.error("메뉴 선택 저장 실패:", error);
      alert("메뉴 선택 저장에 실패했습니다. 다시 시도해주세요.");
    }
  };

  return (
    <MobileLayout>
      <div className="flex flex-col gap-2.5 items-center p-5 bg-neutral-50 min-h-screen w-full">
        {/* Header Section */}
        <div className="bg-white h-[106px] overflow-clip relative shrink-0 w-full max-w-[350px]">
          <div className="absolute flex flex-col gap-2 h-[68px] items-start left-5 top-[19px] w-[162px]">
            <h1 className="font-bold text-xl text-[#1a1a1a]">🍽️ 메뉴 선택하기</h1>
            <div className="font-medium h-9 text-sm text-gray-500">
              <p className="leading-normal mb-0">
                {totalParticipants}명 중 {currentParticipants}명이 참여 중이에요
              </p>
              <p className="font-semibold leading-normal">
                미완료 <span className="underline">{remainingParticipants}</span>명
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Menu Area */}
        <div className="flex flex-col gap-2.5 h-[494px] items-start overflow-y-auto px-0 py-2.5 w-full max-w-[350px]">
          {menuItems.map((item) => {
            const isSelected = selectedMenuIds.includes(item.id);
            return (
              <div
                key={item.id}
                onClick={() => handleMenuToggle(item.id)}
                className="bg-white border border-snow h-20 relative rounded-[10px] shrink-0 w-full cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className="flex flex-col h-20 items-start overflow-hidden pb-4 pt-0 px-4 rounded-[inherit] w-full">
                  {/* Top Row */}
                  <div className="flex h-[50px] items-center justify-between shrink-0 w-full gap-2">
                    <div className="flex flex-col gap-1 h-[38px] items-start shrink-0 flex-1 min-w-0">
                      <p className="font-semibold text-base text-[#1a1a1a] truncate">
                        {item.name}
                      </p>
                      <p className="font-normal text-xs text-gray-500 truncate">
                        {(item.price || 0).toLocaleString()}원
                        {item.participantCount > 0 && (
                          <> • {item.participantCount}명 참여 • {(item.pricePerPerson || 0).toLocaleString()}원/인</>
                        )}
                      </p>
                    </div>
                    {/* Checkbox */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMenuToggle(item.id);
                      }}
                      className={`flex items-center justify-center p-1 rounded-[5px] shrink-0 size-6 ${
                        isSelected
                          ? "bg-[#3366cc]"
                          : "bg-white border border-[#e6e6e6]"
                      }`}
                    >
                      {isSelected && (
                        <p className="font-semibold text-sm text-white">✓</p>
                      )}
                    </button>
                  </div>

                  {/* Participant Chips */}
                  <div className="flex gap-1.5 h-6 items-center shrink-0 w-full flex-wrap">
                    {item.participants.map((participant, index) => (
                      <div
                        key={index}
                        className={`flex h-6 items-center justify-center px-2 py-1 rounded-xl shrink-0 ${
                          participant.isSelected
                            ? "bg-[#e5f2ff]"
                            : "bg-[#ffe5e5]"
                        }`}
                      >
                        <p
                          className={`font-medium text-[11px] whitespace-nowrap ${
                            participant.isSelected
                              ? "text-[#3366cc]"
                              : "text-[#cc3333]"
                          }`}
                        >
                          {participant.name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Section */}
        <div className="bg-white flex flex-col gap-4 items-start overflow-clip p-5 sticky bottom-0 rounded-[10px] shrink-0 w-full max-w-[350px] z-10">
          <button
            onClick={handleConfirm}
            className="bg-[#3366cc] flex gap-2 h-12 items-center justify-center px-4 py-3 rounded-xl shrink-0 w-full max-w-[310px] hover:bg-[#2555e6] transition-colors"
          >
            <span className="font-semibold text-base text-white">메뉴 선택 확정</span>
          </button>
        </div>
      </div>
    </MobileLayout>
  );
}

