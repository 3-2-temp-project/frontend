// src/MyInfo.js
import React, { useEffect, useState } from "react";
import { getMe, logout } from "./authApi";
import { useNavigate } from "react-router-dom";
import "./register.css"; // 스타일 재사용

function MyInfo() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchMe = async () => {
    try {
      setLoading(true);
      const data = await getMe(); // null 또는 { user_id, user_nickname, email ... }
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

  const handleLogout = async () => {
    try {
      const res = await logout();
      alert(res.message || "로그아웃 되었습니다.");
      setMe(null);
    } catch (err) {
      console.error(err);
      alert(err.message || "로그아웃 중 오류가 발생했습니다.");
    }
  };

  if (loading) {
    return (
      <div className="auth-wrapper">
        <div className="auth-card">
          <p>불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!me) {
    return (
      <div className="auth-wrapper">
        <div className="auth-card">
          {/* 🔙 뒤로 가기 버튼 */}
          <button
            type="button"
            className="back-btn"
            onClick={() => navigate("/")}
          >
            ← 메인으로
          </button>

          <h1 className="auth-title">내 정보</h1>
          <p className="auth-subtitle">로그인이 필요합니다.</p>

          <button
            className="submit-btn"
            type="button"
            onClick={() => navigate("/login")}
          >
            로그인 하러 가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        {/* 🔙 뒤로 가기 버튼 */}
        <button
          type="button"
          className="back-btn"
          onClick={() => navigate("/")}
        >
          ← 메인으로
        </button>

        <h1 className="auth-title">내 정보</h1>

        <div className="form-group">
          <label className="form-label">아이디</label>
          <div className="input-wrapper">
            <span className="input-icon">🔖</span>
            <input className="auth-input" value={me.user_id} disabled />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">닉네임</label>
          <div className="input-wrapper">
            <span className="input-icon">🏷</span>
            <input className="auth-input" value={me.user_nickname} disabled />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">이메일</label>
          <div className="input-wrapper">
            <span className="input-icon">✉</span>
            <input className="auth-input" value={me.email} disabled />
          </div>
        </div>

        <button className="submit-btn" type="button" onClick={handleLogout}>
          로그아웃
        </button>
      </div>
    </div>
  );
}

export default MyInfo;
