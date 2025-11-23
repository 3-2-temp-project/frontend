// src/review.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./review.css";

const API_BASE = "http://localhost:5000";

function Review() {
  const { id } = useParams(); // URL 의 res_id
  const navigate = useNavigate();

  // --- state ---
  const [restaurant, setRestaurant] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─────────────────────────────
  // 초기 데이터 로딩
  //   1) restaurant_info (마커 목록에서 해당 res_id 찾기)
  //   2) 리뷰 목록 (/reviews/reviews/restaurant/<id>)
  // ─────────────────────────────
  useEffect(() => {
    const resId = Number(id);
    if (!resId) return;

    setIsLoading(true);

    (async () => {
      try {
        // 1. 식당 정보: /restaurants/markers 에서 res_id 로 검색
        const markerRes = await fetch(`${API_BASE}/restaurants/markers`, {
          method: "GET",
          credentials: "include",
        });

        if (markerRes.ok) {
          const markers = await markerRes.json();
          const info = markers.find(
            (r) => String(r.res_id) === String(resId)
          );
          setRestaurant(info || null);
        } else {
          console.error(
            "식당 정보 로딩 실패:",
            markerRes.status,
            await markerRes.text()
          );
        }

        // 2. 리뷰 목록: GET /reviews/reviews/restaurant/<res_id>
        const reviewRes = await fetch(
          `${API_BASE}/reviews/reviews/restaurant/${resId}`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (reviewRes.ok) {
          const reviewJson = await reviewRes.json();
          setReviews(reviewJson.items || []);
        } else {
          console.error(
            "리뷰 목록 로딩 실패:",
            reviewRes.status,
            await reviewRes.text()
          );
        }
      } catch (err) {
        console.error("리뷰 페이지 데이터 로딩 실패:", err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  // ─────────────────────────────
  // 리뷰 등록
  //   POST /reviews/reviews
  //   body: { res_id, user_id, rating, content }
  // ─────────────────────────────
  const handleSubmit = async () => {
    if (!content.trim()) {
      alert("리뷰 내용을 입력해주세요.");
      return;
    }

    const resId = Number(id);
    if (!resId) {
      alert("식당 정보가 올바르지 않습니다.");
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(`${API_BASE}/reviews/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          res_id: resId,
          user_id: 1, // TODO: 로그인 연동 후 실제 user_id 로 교체
          rating,
          content,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || "리뷰 등록 실패");
      }

      alert("리뷰가 등록되었습니다!");
      // 지금은 등록 후 이전 페이지(지도)로 이동
      navigate(-1);
    } catch (error) {
      console.error("리뷰 전송 오류:", error);
      alert("서버 통신 오류가 발생했습니다.\n" + (error.message || ""));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─────────────────────────────
  // 렌더링
  // ─────────────────────────────
  if (isLoading) {
    return (
      <div className="review-container loading">
        로딩 중입니다...
      </div>
    );
  }

  return (
    <div className="review-container">
      {/* 상단: 식당 정보 + 뒤로가기 */}
      <div className="review-header">
        <button onClick={() => navigate(-1)} className="back-btn">
          ← 뒤로
        </button>

        {restaurant && (
          <div className="restaurant-summary">
            <h2>{restaurant.res_name}</h2>
            <p>
              {restaurant.address} · {restaurant.category || "카테고리 미정"}
            </p>
          </div>
        )}
      </div>

      {/* 리뷰 작성 카드 */}
      <div className="review-form-card">
        <h3>리뷰 작성하기</h3>

        <div className="star-rating-input">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={`star ${star <= rating ? "filled" : ""}`}
              onClick={() => setRating(star)}
            >
              ★
            </span>
          ))}
          <span className="rating-score">{rating}점</span>
        </div>

        <textarea
          className="review-textarea"
          placeholder="솔직한 후기를 남겨주세요."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        <button
          className="submit-review-btn"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? "등록 중..." : "등록하기"}
        </button>
      </div>

      {/* 하단: 리뷰 목록 */}
      <div className="review-list-section">
        <h3>전체 리뷰 ({reviews.length})</h3>

        {reviews.length === 0 ? (
          <p className="no-reviews">첫 리뷰의 주인공이 되어보세요!</p>
        ) : (
          <div className="review-list">
            {reviews.map((review) => {
              const createdAt = review.created_at
                ? new Date(review.created_at).toLocaleDateString()
                : "";

              return (
                <div key={review.id} className="review-item">
                  <div className="review-item-header">
                    <span className="review-author">
                      User {review.user_id}
                    </span>
                    <span className="review-score">
                      {"★".repeat(review.rating)}
                      <span style={{ color: "#ccc" }}>
                        {"★".repeat(5 - review.rating)}
                      </span>
                    </span>
                  </div>
                  <p className="review-content">{review.content}</p>
                  {createdAt && (
                    <p
                      style={{
                        fontSize: "0.8rem",
                        color: "#999",
                        marginTop: "5px",
                      }}
                    >
                      {createdAt}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Review;