import MobileLayout from "../layouts/MobileLayout";
import { Button, Input, FormSection } from "../components/common";
import { useForm } from "../hooks/useForm";
import { useNavigation } from "../hooks/useNavigation";
import { useLocation } from "react-router-dom";
import { text } from "../constants";
import { isValidEmail } from "../utils/validation";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth, firestore } from "../config/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

export default function LoginPage() {
  const { navigate, goToSignup } = useNavigation();
  const location = useLocation();
  
  const { values, errors, handleChange, handleBlur, validate } = useForm(
    { id: "", password: "" },
    {
      id: (value) => (!value ? "아이디를 입력해주세요" : null),
      password: (value) => (!value ? "비밀번호를 입력해주세요" : null),
    }
  );

  const handleLogin = async () => {
    if (!validate()) return;
    
    try {
      // Firebase Authentication으로 로그인 (비밀번호는 자동으로 해시 처리됨)
      await signInWithEmailAndPassword(auth, values.id, values.password);
      
      // 로그인 성공 시 returnTo가 있으면 그곳으로, 없으면 홈으로 이동
      const returnTo = location.state?.returnTo || "/";
      navigate(returnTo);
    } catch (error) {
      console.error("로그인 실패:", error);
      let errorMessage = "로그인에 실패했습니다.";
      
      if (error.code === "auth/user-not-found") {
        errorMessage = "등록되지 않은 이메일입니다.";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "비밀번호가 올바르지 않습니다.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "올바른 이메일 형식이 아닙니다.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "너무 많은 시도가 있었습니다. 나중에 다시 시도해주세요.";
      }
      
      alert(errorMessage);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      // 구글 로그인 팝업 열기
      const result = await signInWithPopup(auth, provider);
      
      // 사용자 정보 가져오기
      const user = result.user;
      const email = user.email;
      const displayName = user.displayName;
      const photoURL = user.photoURL;
      const uid = user.uid;
      
      console.log("Google 로그인 성공:", {
        email,
        displayName,
        photoURL,
        uid,
      });
      
      // Firestore에 사용자 정보 저장 (처음 로그인한 경우만)
      try {
        const userRef = doc(firestore, "users", uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          // 신규 사용자인 경우 정보 저장
          await setDoc(userRef, {
            email,
            displayName: displayName || null,
            photoURL: photoURL || null,
            createdAt: Date.now(),
            provider: "google",
            lastLoginAt: Date.now(),
          });
          console.log("사용자 정보가 Firestore에 저장되었습니다.");
        } else {
          // 기존 사용자인 경우 마지막 로그인 시간만 업데이트
          await setDoc(userRef, {
            lastLoginAt: Date.now(),
          }, { merge: true });
        }
      } catch (firestoreError) {
        console.error("Firestore 저장 실패:", firestoreError);
        // Firestore 저장 실패해도 로그인은 계속 진행
      }
      
      // 로그인 성공 시 returnTo가 있으면 그곳으로, 없으면 홈으로 이동
      const returnTo = location.state?.returnTo || "/";
      navigate(returnTo);
    } catch (error) {
      console.error("구글 로그인 실패:", error);
      let errorMessage = "구글 로그인에 실패했습니다.";
      
      if (error.code === "auth/popup-closed-by-user") {
        errorMessage = "로그인 창이 닫혔습니다.";
      } else if (error.code === "auth/popup-blocked") {
        errorMessage = "팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용해주세요.";
      } else if (error.code === "auth/account-exists-with-different-credential") {
        errorMessage = "이미 다른 방법으로 가입된 계정입니다.";
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
            placeholder="아이디"
            value={values.id}
            onChange={(e) => handleChange("id", e.target.value)}
            onBlur={() => handleBlur("id")}
            error={!!errors.id}
            errorMessage={errors.id}
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

          <div className="flex items-center justify-center p-2.5 w-full">
            <p className="font-normal text-sm text-[#999999]">또는</p>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="bg-white border border-[#e0e0e0] h-[55px] flex items-center justify-center gap-3 px-4 rounded-xl w-full hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="font-semibold text-base text-[#1a1a1a]">Google로 로그인</span>
          </button>
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

