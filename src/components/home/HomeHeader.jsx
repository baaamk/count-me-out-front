// src/components/home/HomeHeader.jsx

/**
 * 홈 페이지 헤더 컴포넌트
 * @param {boolean} isLoggedIn - 로그인 여부
 * @param {function} onLoginClick - 로그인 버튼 클릭 핸들러
 * @param {function} onMyPageClick - 마이페이지 버튼 클릭 핸들러
 */
export default function HomeHeader({ isLoggedIn, onLoginClick, onMyPageClick }) {
  return (
    <div className="self-stretch px-5 py-3 bg-white inline-flex justify-between items-center overflow-hidden">
      <div className="justify-start text-zinc-900 text-xl font-bold font-['Inter']">
        나는 빼줘
      </div>
      <div
        className="w-20 h-8 px-3 py-1.5 bg-zinc-100 rounded-2xl flex justify-center items-center overflow-hidden cursor-pointer hover:bg-zinc-200 transition-colors"
        onClick={isLoggedIn ? onMyPageClick : onLoginClick}
      >
        <div className="justify-start text-zinc-800 text-xs font-medium font-['Inter']">
          {isLoggedIn ? "마이페이지" : "로그인"}
        </div>
      </div>
    </div>
  );
}

