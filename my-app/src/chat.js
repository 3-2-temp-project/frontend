// ✅ 브라우저 새로고침할 때마다 새로운 세션 ID 생성
let sessionId = localStorage.getItem("chatSessionId");

if (!sessionId) {
  sessionId = crypto.randomUUID(); // 고유 세션 ID 생성
  localStorage.setItem("chatSessionId", sessionId);
}

export async function askChat(message) {
  try {
    const response = await fetch("http://localhost:5000/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: message,
        session_id: sessionId, // ✅ 고유 세션 ID 사용
      }),
    });

    if (!response.ok) 
      throw new Error(`서버 오류: ${response.status}`);

    const data = await response.json();
    return {
      answer: data.response || data.reply || "응답 없음",
      items: data.items || [],
    };
  } catch (error) {
    console.error("askChat 오류:", error);
    throw error;
  }
}
