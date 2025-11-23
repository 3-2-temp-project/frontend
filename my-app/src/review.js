// src/review.js
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import "./review.css";

const API_BASE = "http://localhost:5000";

function Review() {
  const { id } = useParams(); // URL의 식당 ID (res_id)
  const navigate = useNavigate();
  const location = useLocation();

  // map에서 넘어온 식당 정보 (없으면 null)
  const initialRestaurant = location.state?.restaurant || null;

  const [restaurant, setRestaurant] = useState(initialRestaurant);
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // --- 식당 정보 없으면 markers에서 찾아오기 ---
  const fetchRestaurantInfo = useCallback(async () => {
    if (restaurant) return; // 이미 있으면 스킵

    try {
      const res = await fetch(`${API_BASE}/restaurants/markers`);
      if (!res.ok) {
        console.error("markers 요청 실패:", res.status);
        return;
      }
      const list = await res.json();
      const found = list.find((r) => String(r.res_id) === String(id));
      if (found) {
        setRestaurant(found);
      }
    } catch (err) {
      console.error("식당 정보 로딩 실패:", err);
    }
  }, [id, restaurant]);

  // --- 초기 로딩: 식당 정보 + 리뷰 목록 ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        await fetchRestaurantInfo(); // 식당 정보 채우기

        // ✨ Flask reviewRoute: GET /reviews/restaurant/<res_id>
        const resReviews = await fetch(
          `${API_BASE}/reviews/restaurant/${id}`
        );

        if (resReviews.ok) {
          const reviewData = await resReviews.json();
          setReviews(reviewData.items || []);
        } else {
          const errBody = await resReviews.text();
          console.error(
            "리뷰 목록 요청 실패:",
            resReviews.status,
            errBody
          );
        }
      } catch (error) {
        console.error("데이터 로딩 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, fetchRestaurantInfo]);

  // --- 리뷰 등록 ---
  const handleSubmit = async () => {
    if (!content.trim()) {
      alert("리뷰 내용을 입력해주세요.");
      return;
    }

    try {
      console.log("POST /reviews", {
        res_id: Number(id),
        user_id: 1,
        rating,
        content,
      });

      const response = await fetch(`${API_BASE}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // credentials: "include", // 세션 안 쓰면 굳이 필요 없음
        body: JSON.stringify({
          res_id: Number(id),
          user_id: 1,      // ⚠️ DB에 user_id=1 유저가 실제로 있어야 함
          rating,
          content,
        }),
      });

      if (response.ok) {
        const body = await response.json().catch(() => null);
        console.log("리뷰 등록 성공:", body);

        alert("리뷰가 등록되었습니다!");
        setContent("");
        setRating(5);

        // 등록 후 최신 리뷰 다시 불러오기
        const resReviews = await fetch(
          `${API_BASE}/reviews/restaurant/${id}`
        );
        if (resReviews.ok) {
          const reviewData = await resReviews.json();
          setReviews(reviewData.items || []);
        }
        return;
      }

      // 201/200 이 아닌 경우
      const errData = await response.json().catch(() => null);
      console.error(
        "리뷰 등록 실패:",
        response.status,
        errData
      );
      alert(
        (errData && errData.message) ||
          `리뷰 등록에 실패했습니다. (status: ${response.status})`
      );
    } catch (error) {
      console.error("리뷰 전송 오류:", error);
      alert(`서버 통신 오류가 발생했습니다.\n${error.message}`);
    }
  };

  if (isLoading) {
    return <div className="review-container loading">로딩 중...</div>;
  }

  return (
    <div className="review-container">
      {/* 상단: 식당 정보 */}
      <div className="review-header">
        <button onClick={() => navigate(-1)} className="back-btn">
          ← 뒤로
        </button>
        {restaurant && (
          <div className="restaurant-summary">
            <h2>{restaurant.res_name || restaurant.name}</h2>
            <p>
              {restaurant.address} · {restaurant.category || "맛집"}
            </p>
          </div>
        )}
      </div>

      {/* 리뷰 작성 폼 */}
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
        <button className="submit-review-btn" onClick={handleSubmit}>
          등록하기
        </button>
      </div>

      {/* 리뷰 목록 */}
      <div className="review-list-section">
        <h3>전체 리뷰 ({reviews.length})</h3>

        {reviews.length === 0 ? (
          <p className="no-reviews">첫 리뷰의 주인공이 되어보세요!</p>
        ) : (
          <div className="review-list">
            {reviews.map((review) => (
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
                {review.created_at && (
                  <p
                    style={{
                      fontSize: "0.8rem",
                      color: "#999",
                      marginTop: "5px",
                    }}
                  >
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Review;
