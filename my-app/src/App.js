import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Main from './main.js';
import Map from './map.js';
import './main.css';

//import Chatbot from './chatbot.js';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Main />} /> {/* 기본 경로 localhost:3000까지*/}
        <Route path="/Main" element={<Main />} /> {/* /Main 도 가능 여기는 localhost:3000/Main  */}
        <Route path="/Map" element={<Map />} />
      </Routes>
    </Router>
  );
}

export default App;
