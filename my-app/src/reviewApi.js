// src/reviewApi.js
const API_BASE = "http://localhost:5000";

// 로그인된 사용자의 리뷰 목록
export async function getMyReviews(page = 1, perPage = 5) {
  const url = `${API_BASE}/reviews/me?page=${page}&per_page=${perPage}`;
  console.log("getMyReviews URL:", url);

  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
  });

  let data = {};
  try {
    data = await res.json();
  } catch (e) {
    data = {};
  }

  if (!res.ok) {
    const msg = data.message || `리뷰 조회 실패: ${res.status}`;
    throw new Error(msg);
  }

  return data; // { items, page, per_page, total, pages }
}

// ✅ 내 리뷰 하나 삭제
export async function deleteMyReview(reviewId) {
  const url = `${API_BASE}/reviews/my/${reviewId}`;
  console.log("deleteMyReview URL:", url);

  const res = await fetch(url, {
    method: "DELETE",
    credentials: "include",
  });

  let data = {};
  try {
    data = await res.json();
  } catch (e) {
    data = {};
  }

  if (!res.ok) {
    const msg = data.message || `리뷰 삭제 실패: ${res.status}`;
    throw new Error(msg);
  }

  return data; // { message: "리뷰가 삭제되었습니다." } 예상
}
