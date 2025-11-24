import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./register.css";
import { sendCode, verifyCode, signup } from "./authApi";

function Register() {
  const navigate = useNavigate();

  // 🔐 유효성 검사 정규식
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;              // 이메일 형식
  const USER_ID_REGEX = /^[a-zA-Z0-9]+$/;                        // 아이디: 영문 + 숫자
  const PASSWORD_REGEX =
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;           // 8자 이상, 영문/숫자/특수문자

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
  // 헬퍼
  // ------------------------------------
  const showMessage = (type, text) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg({ type: "", text: "" }), 3000);
  };

  // ------------------------------------
  // 핸들러
  // ------------------------------------
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // 아이디: 영문/숫자만 허용
    if (name === "user_id") {
      if (value === "" || USER_ID_REGEX.test(value)) {
        setForm((prev) => ({ ...prev, [name]: value }));
      } else {
        showMessage("error", "아이디는 영문과 숫자만 사용할 수 있습니다.");
      }
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // 이메일 인증번호 발송
  const handleSendCode = async () => {
    console.log("[SendCode] 클릭됨, email =", form.email);

    if (!form.email) {
      showMessage("error", "이메일을 입력해주세요.");
      return;
    }

    if (!EMAIL_REGEX.test(form.email)) {
      showMessage("error", "올바른 이메일 형식을 입력해주세요.");
      return;
    }

    try {
      const res = await sendCode(form.email);
      console.log("[SendCode] 성공", res);

      const msg = res?.message || "인증코드가 발송되었습니다.";
      showMessage("success", msg);
      setIsCodeSent(true);
      setIsVerified(false); // 새 코드 보내면 다시 미인증 상태
    } catch (err) {
      console.error("[SendCode] 에러", err);
      const msg = err?.message || "전송 중 오류가 발생했습니다.";
      showMessage("error", msg);
      setIsCodeSent(false);
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
      console.log("[VerifyCode] 응답:", res);

      const msg = res?.message || "인증이 완료되었습니다.";
      showMessage("success", msg);

      // ✅ 성공하면 확실하게 인증 완료 처리
      setIsVerified(true);
    } catch (err) {
      console.error("[VerifyCode] 에러", err);
      const msg = err?.message || "인증번호가 올바르지 않습니다.";
      showMessage("error", msg);
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

    if (!USER_ID_REGEX.test(form.user_id)) {
      showMessage("error", "아이디는 영문과 숫자만 사용할 수 있습니다.");
      return;
    }

    if (!PASSWORD_REGEX.test(form.password)) {
      showMessage(
        "error",
        "비밀번호는 8자 이상이며 영문, 숫자, 특수문자를 모두 포함해야 합니다."
      );
      return;
    }

    try {
      await signup(form);
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

            <div className="input-group">
              <label>아이디</label>
              <input
                name="user_id"
                placeholder="영문/숫자 조합 (예: gomatjib01)"
                value={form.user_id}
                onChange={handleInputChange}
              />
            </div>

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
                  className={`sub-btn ${isVerified ? "disabled" : ""}`}
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
                    placeholder="코드 4자리"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                  <button
                    type="button"
                    className="sub-btn dark"
                    onClick={handleVerifyCode}
                  >
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

          {/* 🔙 메인으로 돌아가기 링크 */}
          <div className="home-link">
            <Link to="/">← 메인으로 돌아가기</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
