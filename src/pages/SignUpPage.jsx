import MobileLayout from "../layouts/MobileLayout";
import { Button, Input, FormSection } from "../components/common";
import { useForm } from "../hooks/useForm";
import { useNavigation } from "../hooks/useNavigation";
import { text } from "../constants";
import { isValidEmail, isValidPassword, isValidNickname } from "../utils/validation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, firestore } from "../config/firebase";
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useState } from "react";

export default function SignUpPage() {
  const { navigate, goToLogin } = useNavigation();
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);
  const [isNicknameAvailable, setIsNicknameAvailable] = useState(null); // null: 미확인, true: 사용가능, false: 중복
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isEmailAvailable, setIsEmailAvailable] = useState(null);
  
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

  const handleEmailDuplicateCheck = async () => {
    if (!isValidEmail(values.email)) {
      alert("올바른 이메일을 입력해주세요");
      setIsEmailAvailable(false);
      return;
    }
    
    setIsCheckingEmail(true);
    try {
      // Firebase Auth는 이메일 중복을 직접 확인할 수 없으므로, 
      // 회원가입 시점에 확인됩니다. 여기서는 형식만 확인합니다.
      setIsEmailAvailable(true);
      alert("이메일 형식이 올바릅니다. 회원가입 시 중복이 자동으로 확인됩니다.");
    } catch (error) {
      console.error("이메일 확인 실패:", error);
      setIsEmailAvailable(false);
      alert("이메일 확인 중 오류가 발생했습니다.");
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const handleNicknameDuplicateCheck = async () => {
    if (!values.nickname || !values.nickname.trim()) {
      alert("닉네임을 입력해주세요");
      setIsNicknameAvailable(false);
      return;
    }

    if (!isValidNickname(values.nickname)) {
      alert("올바른 닉네임을 입력해주세요");
      setIsNicknameAvailable(false);
      return;
    }

    setIsCheckingNickname(true);
    try {
      const nickname = values.nickname.trim();
      const usersRef = collection(firestore, "users");
      const q = query(usersRef, where("nickname", "==", nickname));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setIsNicknameAvailable(true);
        alert("사용 가능한 닉네임입니다.");
      } else {
        setIsNicknameAvailable(false);
        alert("이미 사용 중인 닉네임입니다. 다른 닉네임을 사용해주세요.");
      }
    } catch (error) {
      console.error("닉네임 중복 확인 실패:", error);
      setIsNicknameAvailable(false);
      alert("닉네임 확인 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsCheckingNickname(false);
    }
  };

  const handleSignUp = async () => {
    if (!validate()) return;
    
    // 닉네임 중복 확인이 안 된 경우
    if (isNicknameAvailable === null || isNicknameAvailable === false) {
      alert("닉네임 중복 확인을 해주세요.");
      return;
    }
    
    // 회원가입 시점에 닉네임 중복을 다시 한 번 확인 (경쟁 조건 방지)
    try {
      const nickname = values.nickname.trim();
      const usersRef = collection(firestore, "users");
      const q = query(usersRef, where("nickname", "==", nickname));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        setIsNicknameAvailable(false);
        alert("이미 사용 중인 닉네임입니다. 다른 닉네임을 사용해주세요.");
        return;
      }
    } catch (checkError) {
      console.error("닉네임 최종 확인 실패:", checkError);
      // 확인 실패해도 계속 진행 (이미 중복 확인을 했으므로)
    }
    
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
          nickname: values.nickname.trim() || null,
        });
        console.log("사용자 정보가 Firestore에 저장되었습니다.");
      } catch (firestoreError) {
        console.error("Firestore 저장 실패:", firestoreError);
        // Firestore 저장 실패 시 사용자 계정 삭제
        try {
          await userCredential.user.delete();
          alert("회원가입 중 오류가 발생했습니다. 다시 시도해주세요.");
          return;
        } catch (deleteError) {
          console.error("사용자 계정 삭제 실패:", deleteError);
        }
        alert("회원가입 중 오류가 발생했습니다. 고객센터로 문의해주세요.");
        return;
      }
      
      // 회원가입 성공 시 완료 페이지로 이동
      navigate("/signup/complete");
    } catch (error) {
      console.error("회원가입 실패:", error);
      let errorMessage = "회원가입에 실패했습니다.";
      
      if (error?.code === "auth/email-already-in-use") {
        errorMessage = "이미 사용 중인 이메일입니다.";
        setIsEmailAvailable(false);
      } else if (error?.code === "auth/invalid-email") {
        errorMessage = "올바른 이메일 형식이 아닙니다.";
        setIsEmailAvailable(false);
      } else if (error?.code === "auth/weak-password") {
        errorMessage = "비밀번호가 너무 약합니다. 8자 이상, 영문과 숫자를 포함해주세요.";
      } else if (error?.code === "auth/network-request-failed") {
        errorMessage = "네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.";
      } else if (error?.code === "auth/too-many-requests") {
        errorMessage = "너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.";
      } else if (error?.message) {
        errorMessage = `회원가입 실패: ${error.message}`;
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
          <div className="flex flex-col gap-1 w-full">
            <div className={`flex h-[51px] items-center justify-between p-4 rounded-xl w-full transition-colors ${
              errors.nickname || isNicknameAvailable === false
                ? "bg-red-50 border border-red-500" 
                : isNicknameAvailable === true
                ? "bg-green-50 border border-green-500"
                : "bg-neutral-50 border border-[#e0e0e0]"
            }`}>
              <input
                type="text"
                placeholder="닉네임"
                value={values.nickname}
                onChange={(e) => {
                  handleChange("nickname", e.target.value);
                  setIsNicknameAvailable(null); // 닉네임 변경 시 중복 확인 상태 초기화
                }}
                onBlur={() => handleBlur("nickname")}
                className={`flex-1 bg-transparent border-0 outline-none text-base text-[#1a1a1a] placeholder:text-gray-500 ${
                  errors.nickname || isNicknameAvailable === false ? "text-red-900" : ""
                }`}
              />
              <button
                onClick={handleNicknameDuplicateCheck}
                disabled={isCheckingNickname || !values.nickname?.trim()}
                className={`flex items-center justify-center px-3 py-2 rounded-lg shrink-0 transition-colors ${
                  isCheckingNickname || !values.nickname?.trim()
                    ? "bg-[#e6e6e6] text-gray-400 cursor-not-allowed"
                    : "bg-[#f2f2f2] hover:bg-[#e6e6e6]"
                }`}
              >
                <span className="font-medium text-xs text-[#4d4d4d]">
                  {isCheckingNickname ? "확인중..." : "중복확인"}
                </span>
              </button>
            </div>
            {errors.nickname && (
              <p className="text-xs text-red-500 px-1">{errors.nickname}</p>
            )}
            {isNicknameAvailable === true && (
              <p className="text-xs text-green-600 px-1">✓ 사용 가능한 닉네임입니다.</p>
            )}
            {isNicknameAvailable === false && !errors.nickname && (
              <p className="text-xs text-red-500 px-1">이미 사용 중인 닉네임입니다.</p>
            )}
          </div>

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
                onClick={handleEmailDuplicateCheck}
                disabled={isCheckingEmail || !values.email?.trim()}
                className={`flex items-center justify-center px-3 py-2 rounded-lg shrink-0 transition-colors ${
                  isCheckingEmail || !values.email?.trim()
                    ? "bg-[#e6e6e6] text-gray-400 cursor-not-allowed"
                    : "bg-[#f2f2f2] hover:bg-[#e6e6e6]"
                }`}
              >
                <span className="font-medium text-xs text-[#4d4d4d]">
                  {isCheckingEmail ? "확인중..." : "중복확인"}
                </span>
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

