import { useNavigate } from "react-router-dom";
import MobileLayout from "../layouts/MobileLayout";
import { ParticipantEntryForm } from "../components/common";

export default function TaxiParticipantEntryPage() {
  const navigate = useNavigate();
  
  // TODO: 실제 API에서 가져올 데이터
  const totalParticipants = 4;
  const currentParticipants = 2;

  const handleConfirm = (nickname) => {
    // TODO: 닉네임으로 참여 처리
    // 참여 후 하차 위치 선택 페이지로 이동
    navigate("/taxi/settlement/room/location-selection");
  };

  return (
    <MobileLayout>
      <ParticipantEntryForm
        totalParticipants={totalParticipants}
        currentParticipants={currentParticipants}
        onConfirm={handleConfirm}
        loginReturnTo="/taxi/settlement/room/participant-entry"
      />
    </MobileLayout>
  );
}

