import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import MobileLayout from "../layouts/MobileLayout";
import {
  SettlementHeader,
  PaymentMethodButtons,
  AccountCopyButton,
  HomeButton,
} from "../components/common";
import { openTossDeepLink } from "../utils/tossDeepLink";
import { ref, get } from "firebase/database";
import { database } from "../config/firebase";

export default function SettlementPaymentPage() {
  const { uuid, nickname } = useParams();
  const [settlementData, setSettlementData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSettlementData = async () => {
      if (!uuid || !nickname || !database) {
        setError("필수 정보가 없습니다.");
        setLoading(false);
        return;
      }

      try {
        const roomRef = ref(database, `settlements/${uuid}`);
        const snapshot = await get(roomRef);
        const roomData = snapshot.val();

        if (!roomData) {
          setError("정산 방을 찾을 수 없습니다.");
          setLoading(false);
          return;
        }

        // 참여자 정보 확인
        const participant = roomData.participants?.[nickname];
        if (!participant) {
          setError("참여자 정보를 찾을 수 없습니다.");
          setLoading(false);
          return;
        }

        // 선택한 메뉴 항목 계산
        const selectedMenuItems = (roomData.menuItems || []).filter((item) =>
          participant.selectedMenuIds?.includes(item.id)
        );

        const totalAmount = selectedMenuItems.reduce(
          (sum, item) => sum + (item.pricePerPerson || 0),
          0
        );

        setSettlementData({
          nickname,
          totalAmount,
          menuItems: selectedMenuItems.map((item) => ({
            name: item.name,
            price: item.pricePerPerson || 0,
          })),
          accountInfo: {
            bank: roomData.host?.bank || "",
            accountNumber: roomData.host?.accountNumber || "",
          },
        });
        setLoading(false);
      } catch (err) {
        console.error("정산 데이터 조회 실패:", err);
        setError("정산 데이터를 불러오는 중 오류가 발생했습니다.");
        setLoading(false);
      }
    };

    fetchSettlementData();
  }, [uuid, nickname]);

  const handleKakaoPay = () => {
    if (!settlementData) return;
    // TODO: 카카오페이 송금 API 연동
    console.log("카카오페이 송금:", settlementData);
    alert("카카오페이 송금 기능은 카카오페이 SDK 연동이 필요합니다.");
  };

  const handleToss = () => {
    if (!settlementData) return;
    const { totalAmount, accountInfo } = settlementData;
    openTossDeepLink(totalAmount, accountInfo.bank, accountInfo.accountNumber);
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

  if (error || !settlementData) {
    return (
      <MobileLayout>
        <div className="flex flex-col gap-4 items-center justify-center min-h-screen p-5">
          <p className="text-red-500">{error || "데이터를 불러올 수 없습니다."}</p>
          <HomeButton />
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="flex flex-col gap-5 items-center p-5 bg-neutral-50 min-h-screen w-full">
        {/* Payment Header */}
        <SettlementHeader />

        {/* Payment Summary */}
        <div className="bg-white flex flex-col gap-3 h-[183px] items-center overflow-clip p-5 shrink-0 w-full max-w-[350px]">
          <h2 className="font-bold text-base text-[#1a1a1a]">정산 내역</h2>
          <div className="flex flex-col gap-2 h-[120px] items-start px-0 py-2 shrink-0 w-full max-w-[310px]">
            {/* Divider Line */}
            <div className="bg-[#e6e6e6] h-px shrink-0 w-full" />

            {/* Selected Items */}
            <div className="flex flex-col gap-2 h-[60px] items-start px-0 py-2 shrink-0 w-full">
              {settlementData.menuItems.map((item, index) => (
                <div
                  key={index}
                  className="flex h-6 items-center justify-between text-sm w-full"
                >
                  <p className="font-medium text-[#4d4d4d]">{item.name}</p>
                  <p className="font-semibold text-[#1a1a1a]">
                    {item.price.toLocaleString()}원
                  </p>
                </div>
              ))}
            </div>

            {/* Bottom Divider */}
            <div className="bg-[#e6e6e6] h-px shrink-0 w-full" />

            {/* Total Section */}
            <div className="flex font-bold h-8 items-center justify-between px-0 py-2 text-[#1a1a1a] w-full">
              <p className="text-base">총 합계</p>
              <p className="text-lg">
                {settlementData.totalAmount.toLocaleString()}원
              </p>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <PaymentMethodButtons
          onKakaoPay={handleKakaoPay}
          onToss={handleToss}
        />

        {/* Account Copy Button */}
        <AccountCopyButton accountInfo={settlementData.accountInfo} />

        {/* Home Button */}
        <HomeButton />
      </div>
    </MobileLayout>
  );
}

