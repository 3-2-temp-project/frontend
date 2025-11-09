import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import './login.css';
function Login() {
    // ✨ 2. useLocation 훅을 사용해 Register.js가 보낸 state를 받음
    const location = useLocation();

    // ✨ 3. useState의 초기값으로 Register.js에서 받은 값을 사용
    // location.state가 존재하고, 그 안에 userId가 있으면 그 값을, 없으면 빈 문자열('')을 사용
    const [userId, setUserId] = useState(location.state?.userId || '');
    const [password, setPassword] = useState(location.state?.password || '');
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        // (로그인 API 호출 로직 ... )
        try {
            // const response = await fetch(`${API_BASE_URL}/auth/login`, ...);
            // ...
            // navigate('/main'); // 로그인 성공 시 메인 지도로 이동
        } catch (err) {
            setError("로그인에 실패했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-page">
            <form onSubmit={handleLogin}>
                <h1 className="login-title">로그인</h1>
                <div className="login-inputs">
                    <div>
                        <h5>아이디</h5>
                        <input 
                            type="text" 
                            placeholder="아이디(example@naver.com)"
                            className="input-field" 
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)} 
                        />
                    </div>
                    <div>
                        <h5>비밀번호</h5>
                        <input 
                            type="password" 
                            placeholder="비밀번호"
                            className="input-field"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)} 
                        />
                    </div>
                </div>
                <div className="error-message">{error}</div>
                <button type="submit" className="submit-btn" disabled={isLoading}>
                    {isLoading ? "로그인 중..." : "로그인"}
                </button>
            </form>
        </div>
    );
}

export default Login;