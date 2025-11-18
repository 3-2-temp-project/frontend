// src/register.js
import React, { useState } from "react";
import "./register.css";
import { sendCode, verifyCode, signup } from "./authApi";
import { useNavigate } from "react-router-dom";

function Register() {
  const navigate = useNavigate();

  // ------------------------------------
  // 1. 상태(state)
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

  // ------------------------------------
  // 2. 입력값 변경
  // ------------------------------------
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ------------------------------------
  // 3. 이메일 인증번호 발송
  // ------------------------------------
  const handleSendCode = async () => {
    if (!form.email) {
      alert("이메일을 입력해주세요.");
      return;
    }

    try {
      const res = await sendCode(form.email);
      alert(res.message || "인증코드를 전송했습니다.");
      setIsCodeSent(true); // ✅ 여기서 true → 아래 인증번호 입력칸 보임
      setIsVerified(false); // 새 코드 보낼 땐 다시 false로 초기화
    } catch (err) {
      console.error(err);
      alert(err.message || "인증코드 전송 중 오류가 발생했습니다.");
    }
  };

  // ------------------------------------
  // 4. 인증번호 확인
  // ------------------------------------
  const handleVerifyCode = async () => {
    if (!code) {
      alert("인증번호를 입력해주세요.");
      return;
    }

    try {
      const res = await verifyCode(form.email, code);
      console.log("verifyCode response:", res);
      // ✅ 여기까지 예외 없이 왔으면 인증 성공으로 간주
      setIsVerified(true);
      alert(res.message || "이메일 인증이 완료되었습니다.");
    } catch (err) {
      console.error(err);
      alert(err.message || "인증번호 검증 중 오류가 발생했습니다.");
      setIsVerified(false);
    }
  };

  // ------------------------------------
  // 5. 회원가입
  // ------------------------------------
  const handleSignup = async () => {
    if (!isVerified) {
      alert("이메일 인증이 완료되어야 회원가입이 가능합니다.");
      return;
    }

    if (!form.user_id || !form.user_name || !form.user_nickname || !form.password) {
      alert("이름, 아이디, 비밀번호, 닉네임을 모두 입력해주세요.");
      return;
    }

    try {
      const res = await signup(form);
      alert(res.message || "회원가입 완료!");
      // 필요하면 여기서 로그인 페이지로 이동
      // navigate("/login");
    } catch (err) {
      console.error(err);
      alert(err.message || "회원가입 중 오류가 발생했습니다.");
    }
  };

  // ------------------------------------
  // 6. 렌더링 (디자인)
  // ------------------------------------
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

        <h1 className="auth-title">환영합니다</h1>
        <p className="auth-subtitle">새 계정을 만들어 시작하세요</p>

        <div className="auth-section-title">회원가입</div>
        <p className="auth-section-desc">
          계정 정보를 입력하여 회원가입을 진행해주세요.
        </p>

        {/* 이름 */}
        <div className="form-group">
          <label className="form-label">이름</label>
          <div className="input-wrapper">
            <span className="input-icon">👤</span>
            <input
              name="user_name"
              className="auth-input"
              placeholder="홍길동"
              value={form.user_name}
              onChange={handleInputChange}
            />
          </div>
        </div>

        {/* 아이디 */}
        <div className="form-group">
          <label className="form-label">아이디</label>
          <div className="input-wrapper">
            <span className="input-icon">🔖</span>
            <input
              name="user_id"
              className="auth-input"
              placeholder="사용자 아이디"
              value={form.user_id}
              onChange={handleInputChange}
            />
          </div>
        </div>

        {/* 비밀번호 */}
        <div className="form-group">
          <label className="form-label">비밀번호</label>
          <div className="input-wrapper">
            <span className="input-icon">🔒</span>
            <input
              type="password"
              name="password"
              className="auth-input"
              placeholder="8자 이상"
              value={form.password}
              onChange={handleInputChange}
            />
          </div>
        </div>

        {/* 닉네임 */}
        <div className="form-group">
          <label className="form-label">닉네임</label>
          <div className="input-wrapper">
            <span className="input-icon">🏷</span>
            <input
              name="user_nickname"
              className="auth-input"
              placeholder="닉네임"
              value={form.user_nickname}
              onChange={handleInputChange}
            />
          </div>
        </div>

        {/* 이메일 + 인증번호 발송 */}
        <div className="form-group">
          <label className="form-label">이메일</label>
          <div className="email-row">
            <div className="input-wrapper email-flex">
              <span className="input-icon">✉</span>
              <input
                name="email"
                className="auth-input"
                placeholder="your@email.com"
                value={form.email}
                onChange={handleInputChange}
              />
            </div>
            <button
              type="button"
              className="send-code-btn"
              onClick={handleSendCode}
            >
              인증번호 발송
            </button>
          </div>
        </div>

        {/* 인증번호 입력칸 (코드 발송 후 표시) */}
        {isCodeSent && (
          <div className="form-group">
            <label className="form-label">인증번호</label>
            <div className="input-wrapper">
              <span className="input-icon">✅</span>
              <input
                className="auth-input"
                placeholder="이메일로 받은 인증번호"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="verify-btn"
              onClick={handleVerifyCode}
            >
              인증번호 확인
            </button>
          </div>
        )}

        {isVerified && (
          <p className="verify-success-text">이메일 인증이 완료되었습니다.</p>
        )}

        <button className="submit-btn" type="button" onClick={handleSignup}>
          회원가입
        </button>
      </div>
    </div>
  );
}

export default Register;
