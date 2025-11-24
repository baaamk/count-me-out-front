import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import MobileLayout from "../layouts/MobileLayout";
import { auth, firestore } from "../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";

export default function HomePage() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [settlementHistory, setSettlementHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 개발 환경인지 확인 (로컬에서는 true, 프로덕션에서는 false)
  const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

  useEffect(() => {
    // 인증 상태 확인
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoggedIn(!!user);
      
      if (user) {
        // Firestore에서 사용자별 정산 내역 가져오기 (최근 3개)
        try {
          const settlementsRef = collection(firestore, `users/${user.uid}/settlements`);
          
          // orderBy 없이 먼저 시도 (인덱스 문제 방지)
          let q = query(
            settlementsRef,
            where("status", "==", "completed")
          );
          
          let querySnapshot;
          try {
            querySnapshot = await getDocs(q);
          } catch (indexError) {
            // 인덱스 오류인 경우 orderBy 없이 다시 시도
            console.warn("인덱스 오류, orderBy 없이 조회:", indexError);
            q = query(settlementsRef, where("status", "==", "completed"));
            querySnapshot = await getDocs(q);
          }
          
          const history = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            
            // Firestore Timestamp를 Date로 변환하는 헬퍼 함수
            const toDate = (timestamp) => {
              if (!timestamp) return null;
              // Firestore Timestamp 객체인 경우
              if (timestamp.toDate && typeof timestamp.toDate === 'function') {
                return timestamp.toDate();
              }
              // toMillis 메서드가 있는 경우
              if (timestamp.toMillis && typeof timestamp.toMillis === 'function') {
                return new Date(timestamp.toMillis());
              }
              // seconds와 nanoseconds 속성이 있는 경우 (Firestore Timestamp 구조)
              if (timestamp.seconds !== undefined) {
                return new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000);
              }
              // 숫자인 경우 (밀리초)
              if (typeof timestamp === 'number') {
                return new Date(timestamp);
              }
              // Date 객체인 경우
              if (timestamp instanceof Date) {
                return timestamp;
              }
              return null;
            };
            
            // completedAt이 없으면 createdAt 사용
            const completedDate = toDate(data.completedAt) || toDate(data.createdAt) || new Date();
              
            if (isNaN(completedDate.getTime())) {
              return; // 유효하지 않은 날짜는 스킵
            }
            
            const dateStr = completedDate.toLocaleDateString("ko-KR");
            
            // 타입에 따른 제목 생성
            const typeConfig = {
              receipt: { icon: "🧾", title: "영수증 정산" },
              taxi: { icon: "🚕", title: "택시 정산" },
            };
            const config = typeConfig[data.type] || { icon: "💰", title: "정산" };
            
            // 정렬용 타임스탬프 (밀리초)
            const completedAtMs = data.completedAt 
              ? (data.completedAt.toMillis ? data.completedAt.toMillis() : 
                 (data.completedAt.seconds ? data.completedAt.seconds * 1000 : 
                  (typeof data.completedAt === 'number' ? data.completedAt : completedDate.getTime())))
              : (data.createdAt 
                ? (data.createdAt.toMillis ? data.createdAt.toMillis() : 
                   (data.createdAt.seconds ? data.createdAt.seconds * 1000 : 
                    (typeof data.createdAt === 'number' ? data.createdAt : completedDate.getTime())))
                : completedDate.getTime());
            
            history.push({
              id: doc.id,
              uuid: data.roomId,
              type: data.type,
              amount: data.amount || 0, // 개인 금액 (본인이 낸 금액)
              totalAmount: data.totalAmount || 0, // 참고용 (표시하지 않음)
              date: dateStr,
              nickname: data.nickname,
              title: `${dateStr} ${config.title}`,
              icon: config.icon,
              completedAt: completedAtMs, // 정렬용 (밀리초)
            });
          });
          
          // 클라이언트 측에서 날짜순 정렬 (completedAt 기준, 내림차순)
          history.sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
          
          // 최근 3개만 선택
          setSettlementHistory(history.slice(0, 3));
        } catch (error) {
          console.error("정산 내역 조회 실패:", error);
          console.error("에러 상세:", {
            code: error?.code,
            message: error?.message,
            stack: error?.stack
          });
          
          // 권한 오류인 경우 사용자에게 알림
          if (error?.code === 'permission-denied') {
            console.warn("Firestore 권한 오류: 정산 내역을 읽을 수 없습니다. Firestore 규칙을 확인해주세요.");
          }
          
          setSettlementHistory([]);
        }
      } else {
        setSettlementHistory([]);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const hasHistory = settlementHistory.length > 0;

  return (
    <MobileLayout>
      <div className="flex flex-col gap-4 p-4 bg-neutral-50 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-white w-full">
          <h1 className="font-bold text-[20px] text-[#1a1a1a]">나는 빼줘</h1>
          {isLoggedIn ? (
            <button
              onClick={() => navigate("/mypage")}
              className="bg-[#f2f2f2] h-8 px-3 py-1.5 rounded-2xl flex items-center justify-center whitespace-nowrap"
            >
              <span className="font-medium text-[13px] text-[#333333] whitespace-nowrap">마이페이지</span>
            </button>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="bg-[#f2f2f2] h-8 px-3 py-1.5 rounded-2xl w-20 flex items-center justify-center"
            >
              <span className="font-medium text-[13px] text-[#333333]">로그인</span>
            </button>
          )}
        </div>

        {/* Action Cards Row */}
        <div className={`flex gap-3 p-4 bg-white rounded-3xl w-full ${isDevelopment ? '' : 'justify-center'}`}>
          {/* Receipt Card */}
          <div
            onClick={() => navigate("/settlement/receipt/step1")}
            className="flex-1 flex flex-col gap-1 items-start p-4 bg-[#d9ebff] rounded-[20px] cursor-pointer"
          >
            <p className="text-[32px]">🧾</p>
            <p className="font-semibold text-base text-[#1a1a1a]">영수증 정산</p>
            <p className="font-normal text-xs text-gray-500">메뉴 선택 후 자동 계산</p>
          </div>

          {/* Taxi Card - 개발 환경에서만 활성화 */}
          {isDevelopment ? (
            <div
              onClick={() => navigate("/taxi/settlement/start")}
              className="flex-1 flex flex-col gap-1 items-start p-4 bg-[#d9ebff] rounded-[20px] cursor-pointer"
            >
              <p className="text-[32px]">🚕</p>
              <p className="font-semibold text-base text-[#1a1a1a]">택시 정산</p>
              <p className="font-normal text-xs text-gray-500">하차 위치로 N빵</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-1 items-start p-4 bg-[#f2f2f2] rounded-[20px] cursor-not-allowed opacity-60">
              <p className="text-[32px]">🚕</p>
              <p className="font-semibold text-base text-[#666666]">택시 정산</p>
              <p className="font-normal text-xs text-[#999999]">업데이트 중</p>
            </div>
          )}
        </div>

        {/* History Section */}
        <div className="flex flex-col gap-3 p-4 bg-white w-full">
          {/* History Header */}
          <div className="flex items-center justify-between p-2.5 w-full">
            <h2 className="font-semibold text-[18px] text-[#1a1a1a]">이전 정산</h2>
            <button
              onClick={() => navigate("/settlement/list")}
              className="font-normal text-sm text-[#666666]"
            >
              전체 보기
            </button>
          </div>

          {isLoggedIn ? (
            hasHistory ? (
              /* History List */
              <div className="flex flex-col gap-3 items-start w-full">
                {settlementHistory.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      // 로그인된 상태라면 정산 상세 페이지로 이동
                      if (item.type === "taxi") {
                        navigate(`/taxi/settlement/${item.uuid}`);
                      } else {
                        navigate(`/settlement/${item.uuid}`);
                      }
                    }}
                    className="flex gap-3 items-center justify-center h-[54px] p-4 bg-white border border-[#f2f2f2] rounded-xl w-full cursor-pointer"
                  >
                    <p className="text-2xl shrink-0">
                      {item.icon || (item.type === "taxi" ? "🚕" : "🧾")}
                    </p>
                    <div className="flex flex-col gap-0.5 items-start pl-0 pr-2.5 py-2.5 shrink-0 w-[149px]">
                      <p className="font-bold text-[15px] text-[#1a1a1a]">{item.title || `${item.date} 정산`}</p>
                    </div>
                    <div className="flex flex-1 flex-col gap-0.5 items-end justify-center pl-2.5 pr-0 py-2.5 min-w-0">
                      <p className="font-bold text-base text-[#4a8fe3]">
                        {/* 개인 금액만 표시 (본인이 낸 금액) */}
                        {typeof item.amount === 'number' ? item.amount.toLocaleString() + '원' : item.amount}
                      </p>
                    </div>
                    <p className="text-xl text-[#b3b3b3] shrink-0">›</p>
                  </div>
                ))}
              </div>
            ) : (
              /* Empty State for Logged In User */
              <div className="flex flex-col gap-4 items-center justify-center h-40 p-10 bg-neutral-50 rounded-xl w-full">
                <div className="flex items-center justify-center rounded-3xl size-12 bg-[#cccccc]">
                  <p className="text-2xl text-[#666666]">📄</p>
                </div>
                <p className="font-medium text-base text-[#666666]">아직 내역이 없습니다</p>
              </div>
            )
          ) : (
            /* Guest Banner */
            <div className="flex flex-col gap-3 items-center justify-center p-5 bg-[#f7f7fa] rounded-2xl w-full">
              <button
                onClick={() => navigate("/login")}
                className="bg-[#333333] h-11 px-5 py-3 rounded-full w-20 flex items-center justify-center"
              >
                <span className="font-medium text-sm text-white">로그인</span>
              </button>
              <p className="font-medium text-[14.5px] text-[#4d4d4d] text-center">
                로그인하면 지난 정산을 저장·조회할 수 있어요
              </p>
              <p className="font-normal text-xs text-[#666666]">
                로그인 없이도 바로 정산할 수 있어요
              </p>
            </div>
          )}
        </div>

        {/* Footer Spacer */}
        <div className="h-[35px] w-full bg-neutral-50" />
      </div>
    </MobileLayout>
  );
}

