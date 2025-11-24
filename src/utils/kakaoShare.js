/**
 * 카카오톡 공유 유틸리티
 * Web Share API를 사용하여 공유 기능 제공
 */

/**
 * 카카오톡 공유 (Web Share API 사용)
 * @param {string} title - 공유할 제목
 * @param {string} text - 공유할 텍스트
 * @param {string} url - 공유할 URL
 */
export const shareToKakaoTalk = async (title, text, url) => {
  // Web Share API 사용 (모바일에서 지원)
  if (navigator.share) {
    try {
      await navigator.share({
        title: title,
        text: text,
        url: url,
      });
      return true;
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("공유 실패:", error);
      }
      return false;
    }
  } else {
    // Web Share API를 지원하지 않는 경우 링크 복사
    try {
      await navigator.clipboard.writeText(url);
      alert("링크가 복사되었습니다. 카카오톡에서 붙여넣기 하세요.");
      return true;
    } catch (err) {
      console.error("링크 복사 실패:", err);
      // Fallback: 텍스트 영역 사용
      const textArea = document.createElement("textarea");
      textArea.value = url;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      alert("링크가 복사되었습니다. 카카오톡에서 붙여넣기 하세요.");
      return true;
    }
  }
};

