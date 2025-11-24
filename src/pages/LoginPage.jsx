import MobileLayout from "../layouts/MobileLayout";
import { Button, Input, FormSection } from "../components/common";
import { useForm } from "../hooks/useForm";
import { useNavigation } from "../hooks/useNavigation";
import { useLocation } from "react-router-dom";
import { text } from "../constants";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, firestore } from "../config/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function LoginPage() {
  const { navigate, goToSignup } = useNavigation();
  const location = useLocation();
  
  const { values, errors, handleChange, handleBlur, validate } = useForm(
    { nickname: "", password: "" },
    {
      nickname: (value) => (!value ? "닉네임을 입력해주세요" : null),
      password: (value) => (!value ? "비밀번호를 입력해주세요" : null),
    }
  );

  const handleLogin = async () => {
    if (!validate()) return;
    
    try {
      // Firestore에서 닉네임으로 사용자 찾기
      const nickname = values.nickname.trim();
      const usersRef = collection(firestore, "users");
      const q = query(usersRef, where("nickname", "==", nickname));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        alert("등록되지 않은 닉네임입니다.");
        return;
      }
      
      // 첫 번째 사용자 문서 가져오기 (닉네임은 고유해야 함)
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      const email = userData.email;
      
      if (!email) {
        alert("사용자 정보에 오류가 있습니다. 관리자에게 문의해주세요.");
        return;
      }
      
      // Firebase Authentication으로 로그인 (이메일과 비밀번호 사용)
      await signInWithEmailAndPassword(auth, email, values.password);
      
      // 로그인 성공 시 returnTo가 있으면 그곳으로, 없으면 홈으로 이동
      const returnTo = location.state?.returnTo || "/";
      navigate(returnTo);
    } catch (error) {
      console.error("로그인 실패:", error);
      let errorMessage = "로그인에 실패했습니다.";
      
      if (error?.code === "auth/api-key-not-valid") {
        errorMessage = "Firebase API 키가 유효하지 않습니다. 관리자에게 문의해주세요.";
      } else if (error?.code === "auth/user-not-found") {
        errorMessage = "등록되지 않은 닉네임입니다.";
      } else if (error?.code === "auth/wrong-password") {
        errorMessage = "비밀번호가 올바르지 않습니다.";
      } else if (error?.code === "auth/invalid-email") {
        errorMessage = "사용자 정보에 오류가 있습니다. 관리자에게 문의해주세요.";
      } else if (error?.code === "auth/too-many-requests") {
        errorMessage = "너무 많은 시도가 있었습니다. 나중에 다시 시도해주세요.";
      } else if (error?.code === "auth/operation-not-allowed") {
        errorMessage = "이메일/비밀번호 로그인이 활성화되지 않았습니다. 관리자에게 문의해주세요.";
      } else if (error?.message) {
        errorMessage = `로그인 실패: ${error.message}`;
      }
      
      alert(errorMessage);
    }
  };

  return (
    <MobileLayout>
      <div className="flex flex-col gap-8 items-start pt-[60px] pb-10 px-6 bg-white min-h-screen w-full">
        <FormSection
          title={text.appName}
          description="간편하게 N빵 정산하세요"
        >
          <Input
            type="text"
            placeholder="닉네임"
            value={values.nickname}
            onChange={(e) => handleChange("nickname", e.target.value)}
            onBlur={() => handleBlur("nickname")}
            error={!!errors.nickname}
            errorMessage={errors.nickname}
            size="md"
            className="p-4"
          />

          <Input
            type="password"
            placeholder="비밀번호"
            value={values.password}
            onChange={(e) => handleChange("password", e.target.value)}
            onBlur={() => handleBlur("password")}
            error={!!errors.password}
            errorMessage={errors.password}
            size="md"
            className="p-4"
          />

          <Button variant="primary" size="xl" onClick={handleLogin} className="w-full">
            {text.login}
          </Button>
        </FormSection>

        <div className="flex flex-col gap-4 items-center justify-center p-2.5 text-sm w-full">
          <p className="font-normal text-gray-500">아직 계정이 없으신가요?</p>
          <button
            onClick={goToSignup}
            className="font-semibold text-[#333333] hover:opacity-70 transition-opacity"
          >
            {text.signup}
          </button>
        </div>
      </div>
    </MobileLayout>
  );
}

