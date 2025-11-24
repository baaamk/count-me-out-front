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

export default function TaxiSettlementPaymentPage() {
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

        // 택시 정산 데이터 계산 (실제 계산 로직은 Firebase에 저장된 데이터 사용)
        const taxiInfo = roomData.taxiInfo || {};
        const calculatedTaxiFare = roomData.calculatedTaxiFare || {};
        const participantFare = calculatedTaxiFare[nickname] || 0;

        setSettlementData({
          nickname,
          totalAmount: participantFare,
          breakdown: calculatedTaxiFare.breakdown?.[nickname] || {
            basicFee: { label: "기본 요금", amount: 0 },
            distanceFee: { label: "이동 금액", amount: 0, details: [] },
            outOfCityFee: { label: "시외 요금", amount: 0, details: [] },
          },
          accountInfo: {
            bank: roomData.host?.bank || "",
            accountNumber: roomData.host?.accountNumber || "",
            name: roomData.host?.nickname || "",
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
        <div className="bg-white flex flex-col gap-3 h-[265px] items-center overflow-clip px-5 py-0 shrink-0 w-full max-w-[350px]">
          <h2 className="font-bold text-base text-[#1a1a1a]">정산 내역</h2>
          
          {/* Divider Line */}
          <div className="bg-[#e6e6e6] h-px shrink-0 w-full max-w-[310px]" />

          {/* Basic Fee */}
          <div className="flex h-6 items-center justify-between text-sm w-full max-w-[310px]">
            <p className="font-normal text-[#4d4d4d]">{settlementData.breakdown.basicFee.label}</p>
            <p className="font-bold text-[#1a1a1a]">
              {settlementData.breakdown.basicFee.amount.toLocaleString()}원
            </p>
          </div>

          {/* Distance Fee */}
          <div className="flex flex-col gap-1 items-start w-full max-w-[310px]">
            <div className="flex h-[17px] items-center justify-between text-sm w-full">
              <p className="font-normal text-[#4d4d4d]">{settlementData.breakdown.distanceFee.label}</p>
              <p className="font-bold text-[#1a1a1a]">
                {settlementData.breakdown.distanceFee.amount.toLocaleString()}원
              </p>
            </div>
            {/* Distance Fee Details */}
            <div className="flex flex-col gap-1 items-start w-full">
              {settlementData.breakdown.distanceFee.details.map((detail, index) => (
                <p key={index} className="font-normal text-[11px] text-[#999999]">
                  {detail}
                </p>
              ))}
            </div>
          </div>

          {/* Out of City Fee */}
          <div className="flex flex-col gap-1 items-start w-full max-w-[310px]">
            <div className="flex h-[17px] items-center justify-between text-sm w-full">
              <p className="font-normal text-[#4d4d4d]">{settlementData.breakdown.outOfCityFee.label}</p>
              <p className="font-bold text-[#1a1a1a]">
                {settlementData.breakdown.outOfCityFee.amount.toLocaleString()}원
              </p>
            </div>
            {/* Out of City Fee Details */}
            {settlementData.breakdown.outOfCityFee.details.map((detail, index) => (
              <p key={index} className="font-normal text-[11px] text-[#999999]">
                {detail}
              </p>
            ))}
          </div>

          {/* Divider Line */}
          <div className="bg-[#e6e6e6] h-px shrink-0 w-full max-w-[310px]" />

          {/* Total Section */}
          <div className="flex font-bold h-8 items-center justify-between text-[#1a1a1a] w-full max-w-[310px]">
            <p className="text-base">총 정산 금액</p>
            <p className="text-lg">
              {settlementData.totalAmount.toLocaleString()}원
            </p>
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

