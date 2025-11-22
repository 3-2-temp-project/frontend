// src/login.js
import React, { useState } from "react";
import { login } from "./authApi";
import { useNavigate, Link } from "react-router-dom";
import "./login.css";

function Login() {
  const navigate = useNavigate();

  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async () => {
    if (!userId || !password) {
      setErrorMsg("아이디와 비밀번호를 모두 입력해주세요.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");
      const res = await login(userId, password);
      
      // 성공 시 알림 없이 바로 이동하거나, 필요하면 alert 사용
      // alert(res.message || "로그인 성공!"); 
      navigate("/me");
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "아이디 또는 비밀번호가 일치하지 않습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 엔터키 입력 시 로그인 처리
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="auth-container">
      {/* 배경 장식 */}
      <div className="bg-circle circle-1"></div>
      <div className="bg-circle circle-2"></div>

      <div className="auth-card login-card-size">
        
        {/* 헤더 영역 */}
        <div className="auth-header">
          <Link to="/" className="brand-logo">
            공맛집 <span>Official</span>
          </Link>
          <h1 className="page-title">로그인</h1>
          <p className="page-subtitle">서비스 이용을 위해 로그인해주세요.</p>
        </div>

        {/* 입력 폼 영역 */}
        <div className="auth-body">
          
          <div className="input-group">
            <label>아이디</label>
            <div className="input-wrapper">
              <span className="input-icon">👤</span>
              <input
                className="auth-input with-icon"
                placeholder="아이디를 입력하세요"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
          </div>

          <div className="input-group">
            <label>비밀번호</label>
            <div className="input-wrapper">
              <span className="input-icon">🔒</span>
              <input
                type="password"
                className="auth-input with-icon"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
          </div>

          {/* 에러 메시지 표시 */}
          {errorMsg && <p className="error-message">{errorMsg}</p>}

          <button
            type="button"
            className="submit-btn"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>

          <div className="bottom-links">
            계정이 없으신가요? <Link to="/register">회원가입</Link>
          </div>
          
          <div className="home-link">
             <Link to="/">← 메인으로 돌아가기</Link>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Login;