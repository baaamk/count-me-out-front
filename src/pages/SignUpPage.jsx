import MobileLayout from "../layouts/MobileLayout";
import { Button, Input, FormSection } from "../components/common";
import { useForm } from "../hooks/useForm";
import { useNavigation } from "../hooks/useNavigation";
import { text } from "../constants";
import { isValidEmail, isValidPassword, isValidNickname } from "../utils/validation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, firestore } from "../config/firebase";
import { doc, setDoc } from "firebase/firestore";

export default function SignUpPage() {
  const { navigate, goToLogin } = useNavigation();
  
  const { values, errors, touched, handleChange, handleBlur, validate } = useForm(
    { nickname: "", email: "", password: "", confirmPassword: "" },
    {
      nickname: (value) => (!value.trim() ? null : (!isValidNickname(value) ? "닉네임을 입력해주세요" : null)),
      email: (value) => {
        if (!value.trim()) return null;
        return !isValidEmail(value) ? "올바른 이메일을 입력해주세요" : null;
      },
      password: (value) => (!value.trim() ? null : (!isValidPassword(value) ? "8자 이상, 영문과 숫자를 포함해주세요" : null)),
      confirmPassword: (value) => {
        if (!value.trim()) return null;
        return value !== values.password ? "비밀번호가 일치하지 않습니다" : null;
      },
    }
  );

  const handleDuplicateCheck = () => {
    if (!isValidEmail(values.email)) {
      alert("올바른 이메일을 입력해주세요");
      return;
    }
    // Firebase Auth는 자동으로 이메일 중복을 확인하므로 별도 처리 불필요
    alert("회원가입 시 이메일 중복이 자동으로 확인됩니다.");
  };

  const handleSignUp = async () => {
    if (!validate()) return;
    
    try {
      // Firebase Authentication으로 회원가입 (비밀번호는 자동으로 해시 처리되어 저장됨)
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      
      // Firestore에 사용자 정보 저장
      try {
        const userRef = doc(firestore, "users", userCredential.user.uid);
        await setDoc(userRef, {
          email: values.email,
          displayName: null,
          photoURL: null,
          createdAt: Date.now(),
          lastLoginAt: Date.now(),
          provider: "email",
          nickname: values.nickname || null,
        });
        console.log("사용자 정보가 Firestore에 저장되었습니다.");
      } catch (firestoreError) {
        console.error("Firestore 저장 실패:", firestoreError);
        // Firestore 저장 실패해도 회원가입은 계속 진행
      }
      
      // 회원가입 성공 시 완료 페이지로 이동
      navigate("/signup/complete");
    } catch (error) {
      console.error("회원가입 실패:", error);
      let errorMessage = "회원가입에 실패했습니다.";
      
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "이미 사용 중인 이메일입니다.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "올바른 이메일 형식이 아닙니다.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "비밀번호가 너무 약합니다. 8자 이상, 영문과 숫자를 포함해주세요.";
      }
      
      alert(errorMessage);
    }
  };

  return (
    <MobileLayout>
      <div className="flex flex-col gap-5 items-start pt-[60px] pb-10 px-6 bg-white min-h-screen w-full">
        <FormSection
          title={text.appName}
          description="회원가입하고 정산 내역을 저장하세요"
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

          <div className="flex flex-col gap-1 w-full">
            <div className={`flex h-[51px] items-center justify-between p-4 rounded-xl w-full transition-colors ${
              errors.email 
                ? "bg-red-50 border border-red-500" 
                : "bg-neutral-50 border border-[#e0e0e0]"
            }`}>
              <input
                type="email"
                placeholder="이메일"
                value={values.email}
                onChange={(e) => handleChange("email", e.target.value)}
                onBlur={() => handleBlur("email")}
                className={`flex-1 bg-transparent border-0 outline-none text-base text-[#1a1a1a] placeholder:text-gray-500 ${
                  errors.email ? "text-red-900" : ""
                }`}
              />
              <button
                onClick={handleDuplicateCheck}
                className="bg-[#f2f2f2] flex items-center justify-center px-3 py-2 rounded-lg shrink-0 hover:bg-[#e6e6e6] transition-colors"
              >
                <span className="font-medium text-xs text-[#4d4d4d]">중복확인</span>
              </button>
            </div>
            {errors.email && (
              <p className="text-xs text-red-500 px-1">{errors.email}</p>
            )}
          </div>

          <Input
            type="password"
            placeholder="비밀번호 (8자 이상)"
            value={values.password}
            onChange={(e) => handleChange("password", e.target.value)}
            onBlur={() => handleBlur("password")}
            error={!!errors.password}
            errorMessage={errors.password}
            size="md"
            className="p-4"
          />

          <Input
            type="password"
            placeholder="비밀번호 확인"
            value={values.confirmPassword}
            onChange={(e) => handleChange("confirmPassword", e.target.value)}
            onBlur={() => handleBlur("confirmPassword")}
            error={!!errors.confirmPassword}
            errorMessage={errors.confirmPassword}
            size="md"
            className="p-4"
          />
        </FormSection>

        <div className="flex flex-col gap-2 items-center justify-center p-2.5 w-full">
          <p className="font-normal text-xs text-[#999999]">
            회원가입 시 이용약관 및 개인정보처리방침에 동의하게 됩니다
          </p>
        </div>

        <Button variant="primary" size="xl" onClick={handleSignUp} className="w-full">
          {text.signup}
        </Button>

        <div className="flex flex-col gap-2 items-center justify-center p-2.5 text-sm w-full">
          <p className="font-normal text-gray-500">이미 계정이 있으신가요?</p>
          <button
            onClick={goToLogin}
            className="font-semibold text-[#333333] hover:opacity-70 transition-opacity"
          >
            {text.login}
          </button>
        </div>
      </div>
    </MobileLayout>
  );
}

