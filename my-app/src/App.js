import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Main from './main.js';
import Map from './map.js';
import Register from './register.js';
import Login from './login.js';
import './main.css';



function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Main />} /> {/* 기본 경로 localhost:3000까지*/}
        <Route path="/Main" element={<Main />} /> {/* /Main 도 가능 여기는 localhost:3000/Main  */}
        <Route path="/Map" element={<Map />} />
        <Route path="/Register" element={<Register />} />
        <Route path="/Login" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;
