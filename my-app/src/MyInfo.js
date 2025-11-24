// src/MyInfo.js
import React, { useEffect, useState } from "react";
import { getMe, logout } from "./authApi";
import { getMyReviews, deleteMyReview } from "./reviewApi";
import { useNavigate, Link } from "react-router-dom";
import "./login.css";

function MyInfo() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  const [myReviews, setMyReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState(null);

  const navigate = useNavigate();

  // 내 정보 조회
  const fetchMe = async () => {
    try {
      setLoading(true);
      const data = await getMe();
      console.log("GET /auth/me 응답:", data);
      setMe(data);
    } catch (err) {
      console.error(err);
      setMe(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  // me가 있으면 세션 기반으로 내 리뷰 조회
  useEffect(() => {
    if (!me) return;

    const fetchMyReviews = async () => {
      try {
        setReviewsLoading(true);
        setReviewsError(null);

        const data = await getMyReviews(1, 5);
        console.log("내 리뷰 응답:", data);
        setMyReviews(data.items || []);
      } catch (err) {
        console.error("내 리뷰 조회 에러:", err);
        setReviewsError(err.message);
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchMyReviews();
  }, [me]);

  // ✅ 리뷰 삭제 핸들러
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("이 리뷰를 삭제하시겠습니까?")) return;

    try {
      const res = await deleteMyReview(reviewId);
      console.log("리뷰 삭제 성공:", res);
      // 화면에서 바로 제거
      setMyReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (err) {
      console.error("리뷰 삭제 에러:", err);
      alert(err.message || "리뷰 삭제 중 오류가 발생했습니다.");
    }
  };

  const handleLogout = async () => {
    if (!window.confirm("정말 로그아웃 하시겠습니까?")) return;
    try {
      await logout();
      setMe(null);
      navigate("/login");
    } catch (err) {
      console.error(err);
      alert("로그아웃 중 오류가 발생했습니다.");
    }
  };

  // 로딩/비로그인 처리
  if (loading) {
    return (
      <div className="auth-container">
        <div
          className="auth-card"
          style={{ textAlign: "center", padding: "50px" }}
        >
          <p style={{ color: "#64748b" }}>정보를 불러오는 중입니다... ⏳</p>
        </div>
      </div>
    );
  }

  if (!me) {
    return (
      <div className="auth-container">
        <div className="bg-circle circle-1"></div>
        <div className="bg-circle circle-2"></div>

        <div className="auth-card">
          <div className="auth-header">
            <h1 className="page-title">로그인 필요</h1>
            <p className="page-subtitle">
              내 정보를 확인하려면 로그인이 필요합니다.
            </p>
          </div>
          <div className="auth-body">
            <button className="submit-btn" onClick={() => navigate("/login")}>
              로그인 하러 가기
            </button>
            <div className="home-link">
              <Link to="/">← 메인으로 돌아가기</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 메인 렌더링
  return (
    <div className="auth-container">
      <div className="bg-circle circle-1"></div>
      <div className="bg-circle circle-2"></div>

      <div className="auth-card">
        <div className="auth-header">
          <Link to="/" className="brand-logo">
            공맛집 <span>Official</span>
          </Link>
          <h1 className="page-title">내 정보</h1>
          <p className="page-subtitle">
            반갑습니다,{" "}
            <strong>{me.user_nickname || me.user_id || "회원"}</strong>님! 👋
          </p>
        </div>

        <div className="auth-body">
          <div className="input-group">
            <label>아이디</label>
            <div className="input-wrapper">
              <span className="input-icon"></span>
              <input
                className="auth-input with-icon"
                value={me.user_id}
                readOnly
                disabled
              />
            </div>
          </div>

          <div className="input-group">
            <label>닉네임</label>
            <div className="input-wrapper">
              <span className="input-icon"></span>
              <input
                className="auth-input with-icon"
                value={me.user_nickname}
                readOnly
                disabled
              />
            </div>
          </div>

          <div className="input-group">
            <label>이메일</label>
            <div className="input-wrapper">
              <span className="input-icon"></span>
              <input
                className="auth-input with-icon"
                value={me.email}
                readOnly
                disabled
              />
            </div>
          </div>

          {/* 내가 작성한 리뷰 */}
          <div style={{ marginTop: "30px" }}>
            <h2 style={{ fontSize: "18px", marginBottom: "10px" }}>
              내가 작성한 리뷰
            </h2>

            {reviewsLoading && (
              <p style={{ color: "#64748b", fontSize: "14px" }}>
                리뷰를 불러오는 중입니다...
              </p>
            )}

            {reviewsError && (
              <p style={{ color: "#ef4444", fontSize: "14px" }}>
                {reviewsError}
              </p>
            )}

            {!reviewsLoading &&
              !reviewsError &&
              myReviews.length === 0 && (
                <p style={{ color: "#64748b", fontSize: "14px" }}>
                  아직 작성한 리뷰가 없습니다.
                </p>
              )}

            {!reviewsLoading &&
              !reviewsError &&
              myReviews.length > 0 && (
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {myReviews.map((r) => (
                    <li
                      key={r.id}
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: "12px",
                        padding: "12px 14px",
                        marginBottom: "10px",
                        background: "#f8fafc",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "6px",
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 600 }}>
                            {`식당 #${r.res_id}`}
                          </span>
                          <span
                            style={{ fontSize: "13px", marginLeft: "8px" }}
                          >
                            ⭐ {r.rating}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteReview(r.id)}
                          style={{
                            border: "none",
                            background: "transparent",
                            color: "#ef4444",
                            fontSize: "13px",
                            cursor: "pointer",
                          }}
                        >
                          삭제
                        </button>
                      </div>
                      <p
                        style={{
                          fontSize: "14px",
                          marginBottom: "4px",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {r.content}
                      </p>
                      {r.created_at && (
                        <span
                          style={{
                            fontSize: "12px",
                            color: "#94a3b8",
                          }}
                        >
                          {new Date(r.created_at).toLocaleString()}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
          </div>

          <div style={{ marginTop: "30px" }}>
            <button className="submit-btn logout-btn" onClick={handleLogout}>
              로그아웃
            </button>
          </div>

          <div className="home-link">
            <Link to="/">← 메인으로 돌아가기</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyInfo;
