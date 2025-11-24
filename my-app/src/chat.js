// 세션 ID 유지
let sessionId = localStorage.getItem("chatSessionId");

if (!sessionId) {
  sessionId = crypto.randomUUID();
  localStorage.setItem("chatSessionId", sessionId);
}

// 챗봇 서버 URL
const CHATBOT_URL = "http://localhost:8000";

// 챗봇 서버로 요청하는 함수
export async function askChat(payload) {
  console.log("📤 askChat() 호출됨 → payload =", payload);

  const response = await fetch(`${CHATBOT_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: sessionId,
      location: payload.location,
      category: payload.category
    }),
  });

  const data = await response.json();
  console.log("📩 서버 응답:", data);

  return {
    items: data.items || []
  };
}
