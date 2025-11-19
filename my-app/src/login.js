// src/login.js
import React, { useState } from "react";
import "./login.css";
import { login } from "./authApi";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!userId || !password) {
      alert("아이디와 비밀번호를 모두 입력해주세요.");
      return;
    }

    try {
      setLoading(true);
      const res = await login(userId, password);
      alert(res.message || "로그인 성공!");

      // 로그인 성공 후 내 정보 페이지로 이동
      navigate("/me");
    } catch (err) {
      console.error(err);
      alert(err.message || "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

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

        <h1 className="auth-title">로그인</h1>
        <p className="auth-subtitle">아이디와 비밀번호를 입력하세요</p>

        <div className="form-group">
          <label className="form-label">아이디</label>
          <div className="input-wrapper">
            <span className="input-icon">🔖</span>
            <input
              className="auth-input"
              placeholder="user_id"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">비밀번호</label>
          <div className="input-wrapper">
            <span className="input-icon">🔒</span>
            <input
              type="password"
              className="auth-input"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <button
          type="button"
          className="submit-btn"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </div>
    </div>
  );
}

export default Login;
