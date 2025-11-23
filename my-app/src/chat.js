// 세션 ID 유지 (리프레시해도 1개 유지)
let sessionId = localStorage.getItem("chatSessionId");

if (!sessionId) {
  sessionId = crypto.randomUUID(); // 고유 세션 ID 생성
  localStorage.setItem("chatSessionId", sessionId);
}

// 챗봇 서버 URL (FastAPI 서버)
const CHATBOT_URL = "http://localhost:8000";

// 챗봇 서버로 직접 요청하는 함수
export async function askChat(message) {
  try {
    const response = await fetch(`${CHATBOT_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session_id: sessionId,
        query: message,
      }),
    });

    if (!response.ok)
      throw new Error(`서버 오류: ${response.status}`);

    const data = await response.json();

    return {
      answer: data.response || data.answer || data.reply || "응답 없음",
      items: data.items || [],
    };

  } catch (error) {
    console.error("askChat 오류:", error);
    throw error;
  }
}
