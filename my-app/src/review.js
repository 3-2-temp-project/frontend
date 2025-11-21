import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./review.css";

const API_BASE = "http://localhost:5000";

function Review() {
    const { id } = useParams(); // URL의 식당 ID (예: 1)
    const navigate = useNavigate();

    // --- State ---
    const [restaurant, setRestaurant] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [rating, setRating] = useState(5);    // 별점 (DB컬럼: rating)
    const [content, setContent] = useState(""); // 내용 (DB컬럼: content)
    const [isLoading, setIsLoading] = useState(true);

    // --- 초기 데이터 로딩 ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                
                // 1. 식당 상세 정보 (이름, 주소 표시용)
                // (주의: map.js와 동일하게 'restaurant_info' 테이블을 조회하는 API)
                const resInfo = await fetch(`${API_BASE}/restaurant/detail?id=${id}`); 
                if (resInfo.ok) {
                    const infoData = await resInfo.json();
                    setRestaurant(infoData);
                }

                // 2. ✨ 이 식당의 리뷰 목록 가져오기
                // (server.js의 GET /reviews/:res_id API 호출)
                const resReviews = await fetch(`${API_BASE}/reviews/restaurant${id}`);
                if (resReviews.ok) {
                    const reviewData = await resReviews.json();
                    setReviews(reviewData.items || []); // API 응답 형태에 따라 조정
                }

            } catch (error) {
                console.error("데이터 로딩 실패:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [id]);

    // --- 리뷰 등록 핸들러 ---
    const handleSubmit = async () => {
        if (!content.trim()) {
            alert("리뷰 내용을 입력해주세요.");
            return;
        }

        try {
            // ✨ DB 컬럼명에 맞춰서 데이터 전송
            const response = await fetch(`${API_BASE}/reviews`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    res_id: id,      // DB컬럼: res_id
                    user_id: 1,      // DB컬럼: user_id (임시로 1번 유저)
                    rating: rating,  // DB컬럼: rating
                    content: content // DB컬럼: content
                }),
            });

            if (response.ok) {
                alert("리뷰가 등록되었습니다!");
                navigate(-1); // 지도 페이지로 돌아가기
            } else {
                alert("리뷰 등록에 실패했습니다.");
            }
        } catch (error) {
            console.error("리뷰 전송 오류:", error);
            alert("서버 통신 오류가 발생했습니다.");
        }
    };

    if (isLoading) {
        return <div className="review-container loading">로딩 중...</div>;
    }

    return (
        <div className="review-container">
            {/* 1. 상단: 식당 정보 */}
            <div className="review-header">
                <button onClick={() => navigate(-1)} className="back-btn">← 뒤로</button>
                {restaurant && (
                    <div className="restaurant-summary">
                        {/* DB 컬럼명에 따라 name 또는 res_name 확인 필요 */}
                        <h2>{restaurant.name || restaurant.res_name}</h2>
                        <p>{restaurant.address} · {restaurant.category}</p>
                    </div>
                )}
            </div>

            {/* 2. 중단: 리뷰 작성 폼 */}
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

            {/* 3. 하단: 리뷰 목록 */}
            <div className="review-list-section">
                <h3>전체 리뷰 ({reviews.length})</h3>
                
                {reviews.length === 0 ? (
                    <p className="no-reviews">첫 리뷰의 주인공이 되어보세요!</p>
                ) : (
                    <div className="review-list">
                        {reviews.map((review) => (
                            <div key={review.id} className="review-item">
                                <div className="review-item-header">
                                    <span className="review-author">User {review.user_id}</span>
                                    <span className="review-score">
                                        {/* ✨ DB 컬럼 rating 사용 */}
                                        {"★".repeat(review.rating)} 
                                        <span style={{color:'#ccc'}}>{"★".repeat(5 - review.rating)}</span>
                                    </span>
                                </div>
                                {/* ✨ DB 컬럼 content 사용 */}
                                <p className="review-content">{review.content}</p>
                                <p style={{fontSize:'0.8rem', color:'#999', marginTop:'5px'}}>
                                    {new Date(review.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Review;