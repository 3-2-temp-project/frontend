import React, { useEffect, useState } from "react";
import { getMe, logout } from "./authApi";
import { useNavigate, Link } from "react-router-dom";
import "./login.css"; // ✅ 최신 스타일이 적용된 CSS 파일 import

function MyInfo() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchMe = async () => {
    try {
      setLoading(true);
      const data = await getMe(); 
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

  // ---------------------------------------------------------
  // 렌더링 헬퍼: 로딩 중 & 비로그인 상태도 디자인 통일
  // ---------------------------------------------------------
  if (loading) {
    return (
      <div className="auth-container">
         <div className="auth-card" style={{textAlign:'center', padding:'50px'}}>
            <p style={{color:'#64748b'}}>정보를 불러오는 중입니다... ⏳</p>
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
            <p className="page-subtitle">내 정보를 확인하려면 로그인이 필요합니다.</p>
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

  // ---------------------------------------------------------
  // 메인 렌더링 (로그인 된 상태)
  // ---------------------------------------------------------
  return (
    <div className="auth-container">
      {/* 배경 장식 */}
      <div className="bg-circle circle-1"></div>
      <div className="bg-circle circle-2"></div>

      <div className="auth-card">
        {/* 헤더 */}
        <div className="auth-header">
          <Link to="/" className="brand-logo">
            공맛집 <span>Official</span>
          </Link>
          <h1 className="page-title">내 정보</h1>
          <p className="page-subtitle">
            반갑습니다, <strong>{me.user_name}</strong>님! 👋
          </p>
        </div>

        {/* 본문 */}
        <div className="auth-body">
          
          <div className="input-group">
            <label>아이디</label>
            <div className="input-wrapper">
              <span className="input-icon"></span>
              <input className="auth-input with-icon" value={me.user_id} readOnly disabled />
            </div>
          </div>

          <div className="input-group">
            <label>닉네임</label>
            <div className="input-wrapper">
              <span className="input-icon"></span>
              <input className="auth-input with-icon" value={me.user_nickname} readOnly disabled />
            </div>
          </div>

          <div className="input-group">
            <label>이메일</label>
            <div className="input-wrapper">
              <span className="input-icon"></span>
              <input className="auth-input with-icon" value={me.email} readOnly disabled />
            </div>
          </div>

          <div style={{ marginTop: '30px' }}>
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