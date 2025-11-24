// src/reviewApi.js
const API_BASE = "http://localhost:5000";

// 공통 JSON 응답 헬퍼
async function handleJsonResponse(res) {
  let data = {};
  try {
    data = await res.json();
  } catch (e) {
    data = {};
  }

  if (!res.ok) {
    const msg = data.message || `요청 실패: ${res.status}`;
    throw new Error(msg);
  }

  return data; // 보통 { message, data: {...} } 또는 그냥 {...}
}

// =====================
// 1) 로그인된 사용자의 리뷰 목록
// =====================
export async function getMyReviews(page = 1, perPage = 5) {
  const url = `${API_BASE}/reviews/me?page=${page}&per_page=${perPage}`;
  console.log("getMyReviews URL:", url);

  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
  });

  const body = await handleJsonResponse(res);

  // 🔥 백엔드가 { message, data: {...} } 형태면 body.data 를,
  // 옛날처럼 바로 { items: [...] } 주면 body 를 그대로 사용
  const payload = body.data || body;

  // MyInfo.js 에서 data.items 로 쓰고 있으니까
  // 여기서 이미 언랩해서 넘겨주자
  return payload; // { items, page, per_page, total, pages }
}

// =====================
// 2) 내 리뷰 하나 삭제
// =====================
export async function deleteMyReview(reviewId) {
  const url = `${API_BASE}/reviews/my/${reviewId}`;
  console.log("deleteMyReview URL:", url);

  const res = await fetch(url, {
    method: "DELETE",
    credentials: "include",
  });

  const body = await handleJsonResponse(res);
  return body; // { message: "리뷰가 삭제되었습니다." } 예상
}
