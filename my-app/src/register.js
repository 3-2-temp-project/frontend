import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./register.css";
import { sendCode, verifyCode, signup } from "./authApi";

function Register() {
  const navigate = useNavigate();

  // ------------------------------------
  // 상태 관리
  // ------------------------------------
  const [form, setForm] = useState({
    user_id: "",
    user_name: "",
    user_nickname: "",
    email: "",
    password: "",
  });

  const [code, setCode] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

  // ------------------------------------
  // 핸들러
  // ------------------------------------
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const showMessage = (type, text) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg({ type: "", text: "" }), 3000);
  };

  // 이메일 인증번호 발송
  const handleSendCode = async () => {
    if (!form.email) {
      showMessage("error", "이메일을 입력해주세요.");
      return;
    }
    try {
      const res = await sendCode(form.email);
      showMessage("success", res.message || "인증코드가 발송되었습니다.");
      setIsCodeSent(true);
      setIsVerified(false);
    } catch (err) {
      console.error(err);
      showMessage("error", err.message || "전송 중 오류가 발생했습니다.");
    }
  };

  // 인증번호 확인
  const handleVerifyCode = async () => {
    if (!code) {
      showMessage("error", "인증번호를 입력해주세요.");
      return;
    }
    try {
      const res = await verifyCode(form.email, code);
      showMessage("success", "인증이 완료되었습니다.");
      setIsVerified(!!res.ok);
    } catch (err) {
      console.error(err);
      showMessage("error", err.message || "인증번호가 올바르지 않습니다.");
      setIsVerified(false);
    }
  };

  // 회원가입 제출
  const handleSignup = async () => {
    if (!isVerified) {
      showMessage("error", "이메일 인증을 완료해주세요.");
      return;
    }
    if (!form.user_id || !form.user_name || !form.user_nickname || !form.password) {
      showMessage("error", "모든 필드를 입력해주세요.");
      return;
    }

    try {
      const res = await signup(form);
      alert("회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.");
      navigate("/login");
    } catch (err) {
      console.error(err);
      showMessage("error", err.message || "회원가입 처리에 실패했습니다.");
    }
  };

  // ------------------------------------
  // 렌더링
  // ------------------------------------
  return (
    <div className="auth-container">
      {/* 배경 장식용 원 */}
      <div className="bg-circle circle-1"></div>
      <div className="bg-circle circle-2"></div>

      <div className="auth-card">
        <div className="auth-header">
          <Link to="/" className="brand-logo">
            공맛집 <span>Official</span>
          </Link>
          <h1 className="page-title">회원가입</h1>
          <p className="page-subtitle">
            공무원 인증 맛집 플랫폼에 오신 것을 환영합니다.
          </p>
        </div>

        <div className="auth-body">
          {/* 섹션 1: 기본 정보 */}
          <div className="input-section">
            <h3 className="section-label">기본 정보</h3>
            
            <div className="input-group">
              <label>이름</label>
              <input
                name="user_name"
                placeholder="실명 입력"
                value={form.user_name}
                onChange={handleInputChange}
              />
            </div>

            {/* 아이디 */}
            <div className="input-group">
              <label>아이디</label>
              <input
                name="user_id"
                placeholder="User ID"
                value={form.user_id}
                onChange={handleInputChange}
              />
            </div>

            {/* 닉네임 */}
            <div className="input-group">
              <label>닉네임</label>
              <input
                name="user_nickname"
                placeholder="활동명"
                value={form.user_nickname}
                onChange={handleInputChange}
              />
            </div>

            <div className="input-group">
              <label>비밀번호</label>
              <input
                type="password"
                name="password"
                placeholder="8자 이상 영문/숫자/특수문자"
                value={form.password}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="divider"></div>

          {/* 섹션 2: 인증 */}
          <div className="input-section">
            <h3 className="section-label">본인 인증</h3>
            
            <div className="input-group">
              <label>이메일 주소</label>
              <div className="input-with-btn">
                <input
                  name="email"
                  type="email"
                  placeholder="example@korea.kr"
                  value={form.email}
                  onChange={handleInputChange}
                  disabled={isVerified}
                />
                <button 
                  type="button" 
                  className={`sub-btn ${isVerified ? 'disabled' : ''}`}
                  onClick={handleSendCode}
                  disabled={isVerified}
                >
                  {isCodeSent ? "재전송" : "인증번호 전송"}
                </button>
              </div>
            </div>

            {isCodeSent && !isVerified && (
              <div className="input-group fade-in">
                <label>인증번호</label>
                <div className="input-with-btn">
                  <input
                    placeholder="코드 6자리"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                  <button type="button" className="sub-btn dark" onClick={handleVerifyCode}>
                    확인
                  </button>
                </div>
              </div>
            )}

            {isVerified && (
              <div className="success-message fade-in">
                ✅ 이메일 인증이 완료되었습니다.
              </div>
            )}
          </div>

          {/* 상태 메시지 표시줄 */}
          {statusMsg.text && (
            <div className={`status-message ${statusMsg.type}`}>
              {statusMsg.text}
            </div>
          )}

          <div className="auth-actions">
            <button className="submit-btn" onClick={handleSignup}>
              가입하기
            </button>
            <div className="bottom-links">
              이미 계정이 있으신가요? <Link to="/login">로그인</Link>
            </div>
          </div>
          
          {/* 🔙 메인으로 돌아가기 링크 추가 */}
          <div className="home-link">
             <Link to="/">← 메인으로 돌아가기</Link>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Register;