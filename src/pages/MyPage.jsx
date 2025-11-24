import MobileLayout from "../layouts/MobileLayout";
import { Card, Button, PageHeader, Divider, HomeButton } from "../components/common";
import { useModal } from "../hooks/useModal";
import { useNavigation } from "../hooks/useNavigation";
import { formatCurrency, formatYearMonth } from "../utils/format";
import AccountSettingsModal from "../components/modals/AccountSettingsModal";
import { useState, useEffect } from "react";
import { auth, firestore } from "../config/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, deleteDoc } from "firebase/firestore";

export default function MyPage() {
  const { navigate } = useNavigation();
  const accountModal = useModal();

  // Firebase Auth에서 사용자 정보 가져오기
  const [userData, setUserData] = useState(null);
  const [accountData, setAccountData] = useState(null);
  const [settlementHistory, setSettlementHistory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 인증 상태 확인 및 데이터 로드
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setUserData(null);
        setAccountData(null);
        setSettlementHistory(null);
        setLoading(false);
        return;
      }

      try {
        // Firestore에서 사용자 정보 가져오기
        const userRef = doc(firestore, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          setUserData({
            nickname: userData.nickname || userData.displayName || "",
            email: userData.email || user.email || "",
            avatar: userData.photoURL || "👤",
          });

          // 계좌 정보 가져오기
          setAccountData({
            bank: userData.bank || "",
            accountNumber: userData.accountNumber || "",
            kakaoPayCode: userData.kakaoPayCode || "",
          });
        } else {
          // 사용자 문서가 없으면 기본값 설정
          setUserData({
            nickname: user.displayName || "",
            email: user.email || "",
            avatar: user.photoURL || "👤",
          });
          setAccountData({
            bank: "",
            accountNumber: "",
            kakaoPayCode: "",
          });
        }

        // 정산 내역 통계 계산 (이번 달, 지난 달)
        try {
          const settlementsRef = collection(firestore, `users/${user.uid}/settlements`);
          const q = query(
            settlementsRef,
            where("status", "==", "completed")
          );
          const querySnapshot = await getDocs(q);
          
          const now = new Date();
          const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
          
          let thisMonthTotal = 0;
          let lastMonthTotal = 0;
          
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            const completedDate = new Date(data.completedAt);
            const amount = data.amount || 0;
            
            if (completedDate >= thisMonthStart) {
              thisMonthTotal += amount;
            } else if (completedDate >= lastMonthStart && completedDate <= lastMonthEnd) {
              lastMonthTotal += amount;
            }
          });
          
          setSettlementHistory({
            thisMonth: thisMonthTotal,
            lastMonth: lastMonthTotal,
            difference: thisMonthTotal - lastMonthTotal,
          });
        } catch (error) {
          console.error("정산 내역 통계 계산 실패:", error);
          setSettlementHistory({
            thisMonth: 0,
            lastMonth: 0,
            difference: 0,
          });
        }
      } catch (error) {
        console.error("사용자 데이터 조회 실패:", error);
        setUserData(null);
        setAccountData(null);
        setSettlementHistory(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // userData가 null일 때 기본값 설정
  const displayUserData = userData || { nickname: "", email: "", avatar: "👤" };
  const displayAccountData = accountData || { bank: "", accountNumber: "", kakaoPayLink: "" };
  const displaySettlementHistory = settlementHistory || { thisMonth: 0, lastMonth: 0, difference: 0 };

  const handleEditProfile = () => {
    // TODO: 프로필 수정 페이지로 이동
    navigate("/mypage/profile/edit");
  };

  const handleAccountSettings = () => {
    accountModal.open();
  };

  const handleAccountSave = async (accountData) => {
    const user = auth.currentUser;
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    try {
      // Firestore에 계좌 정보 저장
      const userRef = doc(firestore, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        // 기존 문서 업데이트
        await updateDoc(userRef, {
          bank: accountData.bank,
          accountNumber: accountData.accountNumber,
          kakaoPayCode: accountData.kakaoPayCode || null,
          accountUpdatedAt: Date.now(),
        });
      } else {
        // 새 문서 생성
        await setDoc(userRef, {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          createdAt: Date.now(),
          lastLoginAt: Date.now(),
          provider: "email",
          bank: accountData.bank,
          accountNumber: accountData.accountNumber,
          kakaoPayCode: accountData.kakaoPayCode || null,
          accountUpdatedAt: Date.now(),
        });
      }

      // 로컬 상태 업데이트
      setAccountData({
        bank: accountData.bank,
        accountNumber: accountData.accountNumber,
        kakaoPayCode: accountData.kakaoPayCode || "",
      });

      alert("계좌 정보가 저장되었습니다.");
      accountModal.close();
    } catch (error) {
      console.error("계좌 정보 저장 실패:", error);
      alert("계좌 정보 저장에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const handleViewHistory = () => {
    navigate("/settlement/list");
  };

  const handleNotice = () => {
    alert("공지사항 기능은 준비 중입니다.");
  };

  const handleTerms = () => {
    alert("이용약관 페이지는 준비 중입니다.");
  };

  const handleVersion = () => {
    alert("앱 버전: 1.0.0");
  };

  const handleInquiry = () => {
    alert("문의하기 기능은 준비 중입니다.");
  };

  const handleLogout = async () => {
    if (!confirm("로그아웃 하시겠습니까?")) {
      return;
    }

    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("로그아웃 실패:", error);
      alert("로그아웃에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const handleWithdraw = async () => {
    if (!confirm("정말 회원 탈퇴를 하시겠습니까?\n모든 데이터가 삭제되며 복구할 수 없습니다.")) {
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    try {
      // Firestore에서 사용자 데이터 삭제
      const userRef = doc(firestore, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        // 정산 내역도 삭제
        const settlementsRef = collection(firestore, `users/${user.uid}/settlements`);
        const settlementsSnapshot = await getDocs(settlementsRef);
        
        const deletePromises = settlementsSnapshot.docs.map((doc) => deleteDoc(doc.ref));
        await Promise.all(deletePromises);

        // 사용자 문서 삭제
        await deleteDoc(userRef);
      }

      // Firebase Auth에서 계정 삭제
      await user.delete();

      alert("회원 탈퇴가 완료되었습니다.");
      navigate("/login");
    } catch (error) {
      console.error("회원 탈퇴 실패:", error);
      let errorMessage = "회원 탈퇴에 실패했습니다.";
      
      if (error.code === "auth/requires-recent-login") {
        errorMessage = "보안을 위해 다시 로그인한 후 탈퇴해주세요.";
        navigate("/login");
        return;
      }
      
      alert(errorMessage);
    }
  };

  return (
    <MobileLayout>
      <div className="flex flex-col gap-5 items-center px-4 py-5 bg-neutral-50 min-h-screen w-full">
        <div className="flex items-center justify-between w-full max-w-[358px]">
          <div className="flex flex-col gap-2 items-start px-1 py-0 flex-1">
            <h1 className="font-bold text-2xl text-[#1a1a1a]">마이페이지</h1>
            <p className="font-medium text-sm text-gray-500">
              정산과 송금 정보를 한곳에서 관리하세요
            </p>
          </div>
          <HomeButton variant="simple" />
        </div>

        <Card className="flex flex-col gap-4 h-[123px] items-start p-6 w-full max-w-[358px] relative">
          <div className="flex gap-4 items-center w-full">
            <div className="bg-[#d9ebff] flex items-center justify-center rounded-full size-[72px] shrink-0">
              <p className="text-3xl">{displayUserData.avatar}</p>
            </div>
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <p className="font-bold text-xl text-[#1a1a1a]">{displayUserData.nickname || "사용자"}</p>
              <p className="font-medium text-sm text-gray-500">{displayUserData.email || ""}</p>
              <p className="font-medium text-xs text-[#767676]">
                친구들이 알아볼 수 있게 닉네임을 설정해요
              </p>
            </div>
          </div>
          <Button
            variant="blue"
            size="sm"
            onClick={handleEditProfile}
            className="absolute right-6 top-8 h-9 px-4 text-sm whitespace-nowrap"
          >
            프로필 수정
          </Button>
        </Card>

        <div className="bg-[#f2f6fe] flex flex-col gap-4 h-[319px] items-start p-6 rounded-3xl w-full max-w-[358px] relative">
          <div className="flex flex-col gap-2 w-full">
            <p className="font-bold text-lg text-[#3366cc]">💰 정산 계좌 및 송금 설정</p>
            <p className="font-medium text-[13px] text-[#545454]">
              친구들이 바로 송금할 수 있도록 정보를 저장해두세요
            </p>
          </div>
          <Button
            variant="blue"
            size="sm"
            onClick={handleAccountSettings}
            className="absolute right-6 top-6 h-[27px] w-[71px] px-2.5 py-1 text-sm whitespace-nowrap"
          >
            설정하기
          </Button>

          <div className="bg-white flex flex-col gap-4 h-[196px] items-start p-5 rounded-[20px] w-full max-w-[310px] mt-4">
            {/* Bank Row */}
            <div className="bg-[#f2f6fe] flex items-center h-12 px-4 rounded-[14px] w-full max-w-[270px]">
              <p className="font-semibold text-xs text-[#333333] w-[80px]">은행명</p>
              <p className="font-bold text-sm text-[#3366cc]">{displayAccountData.bank || "미설정"}</p>
            </div>

            {/* Account Row */}
            <div className="bg-neutral-50 flex items-center h-12 px-4 rounded-[14px] w-full max-w-[270px]">
              <p className="font-semibold text-xs text-[#333333] w-[80px]">계좌번호</p>
              <p className="font-bold text-sm text-[#1a1a1a]">{displayAccountData.accountNumber || "미설정"}</p>
            </div>

            {/* Link Row */}
            <div className="bg-neutral-50 flex flex-col gap-1 h-12 px-4 py-2 rounded-[14px] w-full max-w-[270px]">
              <p className="font-semibold text-xs text-[#333333]">카카오페이 송금 링크</p>
              <p className="font-semibold text-xs text-[#3366cc]">{displayAccountData.kakaoPayLink || ""}</p>
            </div>
          </div>
        </div>

        <Card className="flex flex-col gap-4 h-[220px] items-start p-6 w-full max-w-[358px]">
          <div className="flex flex-col gap-2">
            <p className="font-bold text-lg text-[#1a1a1a]">📊 정산 내역</p>
            <p className="font-medium text-[13px] text-[#767676]">
              월별 히스토리를 확인하고 날짜별 리스트로 이동하세요
            </p>
          </div>

          <div className="bg-[#f2f6fe] flex flex-col gap-1 h-[60px] items-start px-4 py-3 rounded-2xl w-full max-w-[310px]">
            <p className="font-bold text-[15px] text-[#3366cc] whitespace-nowrap">
              이번 달 총 {formatCurrency(displaySettlementHistory.thisMonth)}을 정산했어요!
            </p>
            <p className="font-semibold text-xs text-[#333333] -mt-1">
              지난 달 대비 +{formatCurrency(displaySettlementHistory.difference)}
            </p>
          </div>

          <Button
            variant="blue"
            size="md"
            onClick={handleViewHistory}
            className="w-full max-w-[310px] h-12 rounded-[14px] text-[15px]"
          >
            월별 정산 히스토리 보기
          </Button>
        </Card>

        <Card className="flex flex-col gap-4 h-[480px] items-start p-6 w-full max-w-[358px]">
          <p className="font-bold text-lg text-[#1a1a1a]">앱 설정 및 고객지원</p>

          {/* Notice Item */}
          <button
            onClick={handleNotice}
            className="flex items-center justify-between h-12 w-full max-w-[310px] hover:opacity-70 transition-opacity"
          >
            <span className="font-semibold text-[15px] text-[#1a1a1a]">공지사항</span>
            <span className="font-semibold text-lg text-[#999999]">›</span>
          </button>

          {/* Terms Item */}
          <button
            onClick={handleTerms}
            className="flex items-center justify-between h-12 w-full max-w-[310px] hover:opacity-70 transition-opacity"
          >
            <span className="font-semibold text-[15px] text-[#1a1a1a] whitespace-nowrap">이용약관 및 개인정보 처리방침</span>
            <span className="font-semibold text-lg text-[#999999]">›</span>
          </button>

          {/* Version Item */}
          <button
            onClick={handleVersion}
            className="flex items-center justify-between h-12 w-full max-w-[310px] hover:opacity-70 transition-opacity"
          >
            <span className="font-semibold text-[15px] text-[#1a1a1a]">앱 버전 정보</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[15px] text-gray-500">v1.0.0</span>
              <span className="font-semibold text-lg text-[#999999]">›</span>
            </div>
          </button>

          {/* Customer Support Section */}
          <p className="font-semibold text-[13px] text-[#666666] mt-4">고객지원</p>

          {/* Inquiry Item */}
          <button
            onClick={handleInquiry}
            className="flex items-center justify-between h-12 w-full max-w-[310px] hover:opacity-70 transition-opacity"
          >
            <span className="font-semibold text-[15px] text-[#1a1a1a]">문의 남기기</span>
            <span className="font-semibold text-lg text-[#999999]">›</span>
          </button>

          {/* Account Section */}
          <p className="font-semibold text-[13px] text-[#666666] mt-4">계정</p>

          {/* Logout Item */}
          <button
            onClick={handleLogout}
            className="flex items-center justify-between h-12 w-full max-w-[310px] hover:opacity-70 transition-opacity"
          >
            <span className="font-semibold text-[15px] text-[#1a1a1a]">로그아웃</span>
            <span className="font-semibold text-lg text-[#999999]">›</span>
          </button>

          <Divider className="max-w-[310px] mt-4" />

          <button
            onClick={handleWithdraw}
            className="font-medium text-sm text-[#d93025] hover:opacity-70 transition-opacity"
          >
            회원 탈퇴
          </button>
        </Card>
      </div>

      <AccountSettingsModal
        isOpen={accountModal.isOpen}
        onClose={accountModal.close}
        onSave={handleAccountSave}
        initialData={displayAccountData}
      />
    </MobileLayout>
  );
}

