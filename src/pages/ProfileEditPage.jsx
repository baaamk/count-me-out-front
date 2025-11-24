import MobileLayout from "../layouts/MobileLayout";
import { Button, Input, PageHeader, Card } from "../components/common";
import { useForm } from "../hooks/useForm";
import { useNavigation } from "../hooks/useNavigation";
import { isValidNickname, isValidEmail } from "../utils/validation";
import { useState, useEffect, useRef } from "react";
import { auth, firestore } from "../config/firebase";
import { onAuthStateChanged, updateEmail, sendEmailVerification } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function ProfileEditPage() {
  const { goBack, navigate } = useNavigation();
  const fileInputRef = useRef(null);
  
  const { values, errors, handleChange, handleBlur, validate } = useForm(
    { nickname: "" },
    {
      nickname: (value) => (!isValidNickname(value) ? "닉네임을 입력해주세요" : null),
    }
  );
  
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [emailValue, setEmailValue] = useState("");
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(true);

  // 사용자 정보 로드
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/login");
        return;
      }

      try {
        // Firestore에서 사용자 정보 가져오기
        const userRef = doc(firestore, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          handleChange("nickname", userData.nickname || user.displayName || "");
          setEmailValue(userData.email || user.email || "");
          setPhotoPreview(userData.photoURL || user.photoURL || null);
          setIsEmailVerified(user.emailVerified || false);
        } else {
          // Firestore에 문서가 없으면 기본값 설정
          handleChange("nickname", user.displayName || "");
          setEmailValue(user.email || "");
          setPhotoPreview(user.photoURL || null);
          setIsEmailVerified(user.emailVerified || false);
        }
      } catch (error) {
        console.error("사용자 정보 조회 실패:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleChangePhoto = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 크기 검증 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("파일 크기는 5MB 이하여야 합니다.");
      return;
    }

    // 파일 타입 검증
    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 업로드 가능합니다.");
      return;
    }

    setProfilePhoto(file);

    // 미리보기 생성
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmailValue(value);
    
    // 이메일 형식 검증
    if (value && !isValidEmail(value)) {
      setEmailError("올바른 이메일 형식을 입력해주세요");
    } else {
      setEmailError("");
    }
  };

  const handleEmailBlur = () => {
    // 포커스가 벗어날 때 이메일 형식 검증
    if (emailValue && !isValidEmail(emailValue)) {
      setEmailError("올바른 이메일 형식을 입력해주세요");
    } else {
      setEmailError("");
    }
  };

  const handleChangeEmail = () => {
    if (isEditingEmail) {
      // 인증 버튼 클릭 시 이메일 형식 검증
      if (!emailValue || !emailValue.trim()) {
        setEmailError("이메일을 입력해주세요");
        return;
      }
      
      const trimmedEmail = emailValue.trim();
      const isValid = isValidEmail(trimmedEmail);
      
      console.log("이메일 검증:", trimmedEmail, "결과:", isValid);
      
      if (!isValid) {
        setEmailError("올바른 이메일 형식을 입력해주세요");
        return;
      }
      
      // 검증 통과 시 에러 메시지 제거
      setEmailError("");
      
      // 인증 메일 전송
      handleSendVerificationEmail();
    } else {
      // 변경 버튼 클릭 시 편집 모드 활성화
      setIsEditingEmail(true);
      setEmailError("");
    }
  };

  const handleSendVerificationEmail = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    try {
      // 이메일 업데이트
      await updateEmail(user, emailValue.trim());
      
      // 인증 메일 전송
      await sendEmailVerification(user);
      
      alert("인증 메일이 전송되었습니다. 메일을 확인해주세요.");
      
      // Firestore에 이메일 업데이트
      const userRef = doc(firestore, "users", user.uid);
      await updateDoc(userRef, {
        email: emailValue.trim(),
      });

      setIsEditingEmail(false);
      setEmailError("");
      
      // 이메일 인증 상태는 Firebase Auth에서 자동으로 업데이트됨
      // 사용자가 메일을 확인하면 emailVerified가 true로 변경됨
    } catch (error) {
      console.error("이메일 인증 메일 전송 실패:", error);
      let errorMessage = "인증 메일 전송에 실패했습니다.";
      
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "이미 사용 중인 이메일입니다.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "올바른 이메일 형식을 입력해주세요.";
      } else if (error.code === "auth/requires-recent-login") {
        errorMessage = "보안을 위해 다시 로그인해주세요.";
        navigate("/login");
        return;
      }
      
      setEmailError(errorMessage);
      alert(errorMessage);
    }
  };

  const handleChangePassword = () => {
    // TODO: 비밀번호 변경 페이지로 이동
    navigate("/mypage/password/change");
  };

  const handleSave = async () => {
    if (!validate()) return;

    const user = auth.currentUser;
    if (!user) {
      alert("로그인이 필요합니다.");
      navigate("/login");
      return;
    }

    try {
      const userRef = doc(firestore, "users", user.uid);
      const userSnap = await getDoc(userRef);

      const updateData = {
        nickname: values.nickname.trim(),
      };

      // 프로필 사진이 있으면 업로드 (Firebase Storage 사용 가능하지만, 일단 URL만 저장)
      // 실제로는 Firebase Storage에 업로드하고 URL을 가져와야 함
      if (photoPreview && photoPreview.startsWith("data:")) {
        // data URL은 임시로 저장하지 않음 (너무 큼)
        // 실제로는 Firebase Storage에 업로드 필요
        console.log("프로필 사진 업로드는 Firebase Storage 연동 필요");
      }

      if (userSnap.exists()) {
        await updateDoc(userRef, updateData);
      } else {
        await import("firebase/firestore").then(({ setDoc }) => {
          return setDoc(userRef, {
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            createdAt: Date.now(),
            lastLoginAt: Date.now(),
            provider: "email",
            ...updateData,
          });
        });
      }

      alert("프로필이 저장되었습니다.");
      navigate("/mypage");
    } catch (error) {
      console.error("프로필 저장 실패:", error);
      alert("프로필 저장에 실패했습니다. 다시 시도해주세요.");
    }
  };

  return (
    <MobileLayout>
      <div className="flex flex-col gap-5 items-center px-4 py-4 bg-neutral-50 min-h-screen w-full">
        <PageHeader title="프로필 수정" onBack={goBack} />

        <Card className="flex flex-col gap-4 items-center p-6 w-full max-w-[358px]">
          <div className="bg-[#d9ebff] flex items-center justify-center rounded-full size-24 shrink-0 overflow-hidden">
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="프로필"
                className="w-full h-full object-cover"
              />
            ) : (
              <p className="text-3xl">💸</p>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="hidden"
          />
          <button
            onClick={handleChangePhoto}
            className="font-semibold text-sm text-[#3366cc] hover:opacity-70 transition-opacity"
          >
            프로필 사진 변경
          </button>
        </Card>

        <Card className="flex flex-col gap-4 items-start p-6 w-full max-w-[358px]">
          <div className="flex flex-col gap-2 w-full">
            <label className="font-semibold text-sm text-[#1a1a1a]">닉네임</label>
            <Input
              type="text"
              value={values.nickname}
              onChange={(e) => handleChange("nickname", e.target.value)}
              onBlur={() => handleBlur("nickname")}
              error={!!errors.nickname}
              errorMessage={errors.nickname}
              placeholder="닉네임을 입력해주세요"
              size="md"
              className="max-w-[310px]"
            />
            <p className="font-medium text-xs text-gray-500">
              친구들이 알아볼 수 있는 이름이에요
            </p>
          </div>

          <div className="flex flex-col gap-2 w-full">
            <label className="font-semibold text-sm text-[#1a1a1a]">이메일</label>
            <div className="flex flex-col gap-1 w-full">
              <div className="flex gap-2 items-center w-full bg-[#f2f2f2] rounded-xl px-1 py-1 pr-2">
                <Input
                  type="email"
                  value={emailValue}
                  onChange={handleEmailChange}
                  onBlur={handleEmailBlur}
                  disabled={!isEditingEmail}
                  error={!!emailError}
                  size="md"
                  className="flex-1 border-0 bg-transparent"
                />
                <Button
                  variant="blue"
                  size="sm"
                  onClick={handleChangeEmail}
                  className="h-8 whitespace-nowrap shrink-0"
                >
                  {isEditingEmail ? "인증" : "변경"}
                </Button>
              </div>
              {emailError && (
                <p className="font-medium text-xs text-red-500 px-1">{emailError}</p>
              )}
            </div>
          </div>

          <div className="bg-neutral-200 h-px w-full max-w-[310px]" />

          <div className="flex items-center justify-between w-full max-w-[310px]">
            <label className="font-semibold text-[15px] text-[#1a1a1a]">비밀번호</label>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleChangePassword}
              className="h-8 whitespace-nowrap shrink-0"
            >
              변경
            </Button>
          </div>
        </Card>

        <Button
          variant="blue"
          size="lg"
          onClick={handleSave}
          className="w-full max-w-[358px] rounded-[14px]"
        >
          저장하기
        </Button>
      </div>
    </MobileLayout>
  );
}

