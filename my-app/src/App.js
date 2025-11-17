// src/App.js
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Main from './main.js';
import Map from './map.js';
import Register from './register.js';
import Login from './login.js';
import MyInfo from './MyInfo.js';   // ✅ 새로 만든 내 정보 컴포넌트
import './main.css';
import './map.css'

function App() {
  return (
    <Router>
      <Routes>
        {/* 기본 메인 페이지 */}
        <Route path="/" element={<Main />} />
        <Route path="/main" element={<Main />} />   {/* /main 도 접근 가능 */}

        {/* 지도 페이지 */}
        <Route path="/map" element={<Map />} />

        {/* 회원가입 / 로그인 */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        {/* 내 정보 페이지 */}
        <Route path="/me" element={<MyInfo />} />
      </Routes>
    </Router>
  );
}

export default App;
