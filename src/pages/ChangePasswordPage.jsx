import MobileLayout from "../layouts/MobileLayout";
import { Button, Input, PageHeader, Card } from "../components/common";
import { useForm } from "../hooks/useForm";
import { useNavigation } from "../hooks/useNavigation";
import { isValidPassword } from "../utils/validation";
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { auth } from "../config/firebase";

export default function ChangePasswordPage() {
  const { goBack, navigate } = useNavigation();
  
  const { values, errors, handleChange, handleBlur, validate } = useForm(
    { currentPassword: "", newPassword: "", confirmPassword: "" },
    {
      currentPassword: (value) => (!value ? "현재 비밀번호를 입력해주세요" : null),
      newPassword: (value) => (!isValidPassword(value) ? "8자 이상, 영문과 숫자를 포함해주세요" : null),
      confirmPassword: (value) => {
        if (!value) return "새 비밀번호 확인을 입력해주세요";
        if (value !== values.newPassword) return "새 비밀번호가 일치하지 않습니다";
        return null;
      },
    }
  );

  const handleChangePassword = async () => {
    if (!validate()) return;

    const user = auth.currentUser;
    if (!user) {
      alert("로그인이 필요합니다.");
      navigate("/login");
      return;
    }

    try {
      // 현재 비밀번호로 재인증 (보안을 위해 필요)
      const credential = EmailAuthProvider.credential(user.email, values.currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // 새 비밀번호로 변경 (자동으로 해시 처리됨)
      await updatePassword(user, values.newPassword);
      
      alert("비밀번호가 변경되었습니다.");
      navigate("/mypage");
    } catch (error) {
      console.error("비밀번호 변경 실패:", error);
      let errorMessage = "비밀번호 변경에 실패했습니다.";
      
      if (error.code === "auth/wrong-password") {
        errorMessage = "현재 비밀번호가 올바르지 않습니다.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "새 비밀번호가 너무 약합니다. 8자 이상, 영문과 숫자를 포함해주세요.";
      } else if (error.code === "auth/requires-recent-login") {
        errorMessage = "보안을 위해 다시 로그인해주세요.";
        navigate("/login");
        return;
      }
      
      alert(errorMessage);
    }
  };

  return (
    <MobileLayout>
      <div className="flex flex-col gap-5 items-center px-4 py-4 bg-neutral-50 min-h-screen w-full">
        <PageHeader title="비밀번호 변경" onBack={goBack} />

        <div className="flex flex-col gap-2 px-1 w-full max-w-[358px]">
          <p className="font-medium text-[13px] text-gray-500">
            안전한 계정 보호를 위해 비밀번호를 변경하세요.
          </p>
          <p className="font-medium text-[13px] text-gray-500">
            8자 이상, 영문과 숫자를 포함하는 비밀번호를 사용해주세요.
          </p>
        </div>

        <Card className="flex flex-col gap-4 h-[316px] items-start p-6 w-full max-w-[358px]">
          <div className="flex flex-col gap-2 w-full">
            <label className="font-semibold text-sm text-[#1a1a1a]">현재 비밀번호</label>
            <Input
              type="password"
              value={values.currentPassword}
              onChange={(e) => handleChange("currentPassword", e.target.value)}
              onBlur={() => handleBlur("currentPassword")}
              placeholder="현재 비밀번호 입력"
              error={!!errors.currentPassword}
              errorMessage={errors.currentPassword}
              size="md"
              className="max-w-[310px]"
            />
          </div>

          <div className="flex flex-col gap-2 w-full">
            <label className="font-semibold text-sm text-[#1a1a1a]">새 비밀번호</label>
            <Input
              type="password"
              value={values.newPassword}
              onChange={(e) => handleChange("newPassword", e.target.value)}
              onBlur={() => handleBlur("newPassword")}
              placeholder="새 비밀번호 (영문+숫자 8자 이상)"
              error={!!errors.newPassword}
              errorMessage={errors.newPassword}
              size="md"
              className="max-w-[310px]"
            />
          </div>

          <div className="flex flex-col gap-2 w-full">
            <label className="font-semibold text-sm text-[#1a1a1a]">새 비밀번호 확인</label>
            <Input
              type="password"
              value={values.confirmPassword}
              onChange={(e) => handleChange("confirmPassword", e.target.value)}
              onBlur={() => handleBlur("confirmPassword")}
              placeholder="한 번 더 입력해주세요"
              error={!!errors.confirmPassword}
              errorMessage={errors.confirmPassword}
              size="md"
              className="max-w-[310px]"
            />
          </div>
        </Card>

        <Button
          variant="blue"
          size="lg"
          onClick={handleChangePassword}
          className="w-full max-w-[358px] rounded-[14px]"
        >
          비밀번호 변경하기
        </Button>
      </div>
    </MobileLayout>
  );
}

