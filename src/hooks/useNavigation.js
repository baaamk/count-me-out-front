import { useNavigate } from "react-router-dom";

/**
 * 네비게이션 커스텀 훅
 * @returns {Object} 네비게이션 함수들
 */
export function useNavigation() {
  const navigate = useNavigate();

  const goBack = () => navigate(-1);
  const goHome = () => navigate("/");
  const goToLogin = () => navigate("/login");
  const goToSignup = () => navigate("/signup");
  const goToMyPage = () => navigate("/mypage");

  return {
    navigate,
    goBack,
    goHome,
    goToLogin,
    goToSignup,
    goToMyPage,
  };
}

