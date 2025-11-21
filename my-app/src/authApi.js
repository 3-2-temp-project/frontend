// src/authApi.js

const API_BASE = "http://localhost:5000/auth";

// 공통: 응답 처리 헬퍼
async function handleJsonResponse(res) {
  let data;
  try {
    data = await res.json();
  } catch (e) {
    data = {};
  }

  if (!res.ok) {
    const msg = data.message || data.error || "요청에 실패했습니다.";
    throw new Error(msg);
  }
  return data;
}

// =========================
// 이메일 인증 / 회원가입
// =========================

// 1) 인증 코드 보내기
export async function sendCode(email) {
  const res = await fetch(`${API_BASE}/send-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
    // ❌ credentials: "include" 제거 (세션 필요 없음 + CORS 문제 방지)
  });
  return handleJsonResponse(res);
}

// 2) 인증 코드 검증
export async function verifyCode(email, code) {
  const res = await fetch(`${API_BASE}/verify-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code }),
    // credentials: "include",  // 세션이 꼭 필요하지 않으면 제거
  });
  return handleJsonResponse(res);
}

// 3) 회원가입
export async function signup(form) {
  const res = await fetch(`${API_BASE}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
    // credentials: "include",  // 세션 안 쓰면 제거
  });
  return handleJsonResponse(res);
}

// 4) 로그인
export async function login(user_id, password) {
  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // ✅ 세션 쿠키 주고받기 (필수)
    body: JSON.stringify({ user_id, password }),
  });
  return handleJsonResponse(res); // { message: "로그인 성공!" } 예상
}

// 5) 로그아웃
export async function logout() {
  const res = await fetch(`${API_BASE}/logout`, {
    method: "POST",
    credentials: "include", // ✅ 현재 세션 쿠키와 함께 요청
  });
  return handleJsonResponse(res); // { message: "로그아웃 되었습니다." } 예상
}

// 6) 현재 로그인 정보 조회
export async function getMe() {
  const res = await fetch(`${API_BASE}/me`, {
    method: "GET",
    credentials: "include", // ✅ 세션이 있어야 나옴
  });

  if (res.status === 401) {
    // 로그인 안 되어 있음
    return null;
  }
  return handleJsonResponse(res); // { user_id, user_nickname, email } 예상
}
