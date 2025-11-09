import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // ✨ 1. navigate 훅 import
import './register.css';

// ✨ API 기본 URL (main.js의 fetch와 동일하게 http:// 사용)
const API_BASE_URL = 'http://localhost:5000';

function Register() {
    const navigate = useNavigate(); // ✨ 2. navigate 함수 초기화

    // --- State 정의 ---
    // 폼 입력값 state
    const [userId, setUserId] = useState('');
    const [userName, setUserName] = useState('');
    const [userNickname, setUserNickname] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordCheck, setPasswordCheck] = useState('');
    const [code, setCode] = useState(''); // 이메일 인증 코드

    // API 및 UI 상태 state
    const [isLoading, setIsLoading] = useState(false);
    const [isCodeSent, setIsCodeSent] = useState(false); // 인증번호가 발송되었는지
    const [isVerified, setIsVerified] = useState(false); // 이메일 인증이 성공했는지
    const [error, setError] = useState(''); // 오류 메시지
    const [success, setSuccess] = useState(''); // 성공 메시지

    // --- API 호출 함수 ---

    // 1. 인증번호 받기
    const handleSendCode = async () => {
        setIsLoading(true);
        setError('');
        setSuccess('');
        try {
            const response = await fetch(`${API_BASE_URL}/auth/send-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email }),
            });
            const data = await response.json();

            if (!response.ok) throw new Error(data.message || '인증코드 전송 실패');

            setSuccess(data.message); // "인증코드 전송 완료"
            setIsCodeSent(true); // 인증번호 입력창 표시

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // 2. 인증번호 확인
    const handleVerifyCode = async () => {
        setIsLoading(true);
        setError('');
        setSuccess('');
        try {
            const response = await fetch(`${API_BASE_URL}/auth/verify-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email, code: code }),
            });
            const data = await response.json();

            if (!response.ok || data.message !== "인증 성공") {
                throw new Error(data.message || '인증 실패');
            }

            setSuccess(data.message); // "인증 성공"
            setIsVerified(true); // 인증 성공 상태로 변경
            // (선택) 인증 성공 시 입력창 비활성화
            // document.getElementById('email-input').disabled = true;
            // document.getElementById('code-input').disabled = true;

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // 3. 최종 회원가입
    const handleSubmit = async (e) => {
        e.preventDefault(); // 폼 기본 동작(새로고침) 방지
        setError('');
        setSuccess('');

        // --- 프론트엔드 유효성 검사 ---
        if (password !== passwordCheck) {
            setError("비밀번호가 일치하지 않습니다.");
            return;
        }
        if (!isVerified) {
            setError("이메일 인증을 완료해주세요.");
            return;
        }
        // (필요시 다른 유효성 검사 추가)

        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    user_name: userName,
                    user_nickname: userNickname,
                    email: email,
                    password: password
                }),
            });
            const data = await response.json();

            if (!response.ok) throw new Error(data.message || '회원가입 실패');

            // ✨ 3. 회원가입 성공! (요청하신 부분)
            alert(data.message); // "회원가입 완료!" 알림
            
            // Login.js로 아이디와 비밀번호를 state로 넘겨주며 이동
            navigate('/login', {
                state: {
                    userId: userId,     // 방금 가입한 아이디
                    password: password  // 방금 가입한 비밀번호
                }
            });

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="register-page">
            <form onSubmit={handleSubmit}>
                <div><h1 className='register-title'> 회원가입</h1></div>
                
                <div className='register'>
                    <div>
                        {/* 아이디 */}
                        <div>
                            <h5> 아이디 </h5>
                            <input type='text' className="input-field" name='register_id' placeholder="아이디"
                                   value={userId} onChange={(e) => setUserId(e.target.value)} required />
                            <button type="button" className="dupIdCheck-btn">중복확인</button>
                        </div>
                        
                        {/* 닉네임 */}
                        <div>
                            <h5> 닉네임 </h5>
                            <input type='text' className="input-field" name='register_nickname' placeholder="닉네임"
                                   value={userNickname} onChange={(e) => setUserNickname(e.target.value)} required />
                        </div>

                        {/* 비밀번호 */}
                        <div>
                            <h5> 비밀번호 </h5>
                            <input type='password' className="input-field" name='register_password' placeholder="비밀번호"
                                   value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </div>

                        {/* 비밀번호 확인 */}
                        <div>
                            <h5> 비밀번호 확인 </h5>
                            <input type='password' className="input-field" name='register_pswCheck' placeholder="비밀번호 확인"
                                   value={passwordCheck} onChange={(e) => setPasswordCheck(e.target.value)} required />
                        </div>
                    
                        {/* 이름 */}
                        <div>
                            <h5> 이름 </h5>
                            <input type='text' className="input-field" name='register_name' placeholder="이름"
                                   value={userName} onChange={(e) => setUserName(e.target.value)} required />
                        </div>

                        {/* 이메일 */}
                        <div>
                            <h5> 이메일 </h5>
                            <input id="email-input" type='email' className="input-field1" name='register_email' placeholder="이메일"
                                   value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isVerified} />
                            <button type="button" className="dupIdCheck-btn" onClick={handleSendCode} disabled={isVerified || isLoading}>
                                {isCodeSent ? "재전송" : "인증번호 받기"}
                            </button>
                        </div>

                        {/* 인증번호 입력창 (isCodeSent가 true일 때만 보임) */}
                        {isCodeSent && (
                            <div>
                                <h5> 인증번호 </h5>
                                <input id="code-input" type='text' className="input-field" name='register_code' placeholder="인증번호 6자리"
                                       value={code} onChange={(e) => setCode(e.target.value)} required disabled={isVerified} />
                                <button type="button" className="dupIdCheck-btn" onClick={handleVerifyCode} disabled={isVerified || isLoading}>
                                    {isVerified ? "인증완료" : "인증 확인"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* 오류/성공 메시지 표시 */}
                {error && <div style={{ color: 'red', textAlign: 'center', marginTop: '10px' }}>{error}</div>}
                {success && <div style={{ color: 'blue', textAlign: 'center', marginTop: '10px' }}>{success}</div>}

                <div>
                    <button type="submit" className="submit-btn" disabled={isLoading || !isVerified}>
                        {isLoading ? "가입 중..." : "가입하기"}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default Register;