// 세션 ID 유지 (리프레시해도 1개 유지)
let sessionId = localStorage.getItem("chatSessionId");

if (!sessionId) {
  sessionId = crypto.randomUUID();
  localStorage.setItem("chatSessionId", sessionId);
}

const CHATBOT_URL = "http://localhost:8000";

export async function askChat(message) {
  try {
    const response = await fetch(`${CHATBOT_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        query: message,
      }),
    });

    if (!response.ok) throw new Error(`서버 오류: ${response.status}`);

    const data = await response.json();

    // 🔥 answer은 이제 서버에서 제공하지 않음
    return {
      items: data.items || [],
      type: data.type || "noop"
    };

  } catch (error) {
    console.error("askChat 오류:", error);
    throw error;
  }
}
