import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./main.css";

function Main() {
  const [chatOpen, setChatOpen] = useState(false);
  const navigate = useNavigate();

  // === 1. '내 위치 근처 찾기' 로직 (Geolocation 요청 및 서버 POST) ===
  const findNearMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => { // 비동기 처리를 위해 async 추가
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          try {
            // 백엔드 API 호출: 위치 정보를 서버에 POST로 전송
            const response = await fetch('/location', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ lat, lng }),
            });

            if (!response.ok) {
                // 서버 응답이 성공(2xx)이 아닐 경우 오류 발생
                throw new Error(`서버 위치 저장 실패: ${response.status}`);
            }

            console.log("위치 저장 성공 및 Map 페이지로 이동");
            
            // API 호출 및 위치 저장 성공 후 Map 페이지로 이동 (좌표 전달)
            navigate(`/map?lat=${lat}&lng=${lng}`);

          } catch (error) {
            console.error("위치 정보 전송 및 저장 오류:", error);
            alert("서버 통신 오류가 발생했습니다. 위치 정보 없이 Map 페이지로 이동합니다.");
            // 오류가 나더라도 일단 맵 페이지로 이동 (사용자 경험 유지)
            navigate(`/map?lat=${lat}&lng=${lng}`); 
          }
        },
        (error) => {
          // Geolocation 획득 실패 (사용자 거부 등)
          console.error("위치 정보를 가져오는 데 실패했습니다.", error);
          alert("위치 정보를 가져올 수 없습니다. '위치 지정해서 찾기'를 이용해 주세요.");
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      alert("이 브라우저에서는 위치 정보(Geolocation)를 지원하지 않습니다.");
    }
  };

  // === 2. '위치 지정해서 찾기' 로직 (단순 라우팅) ===
  const goToMap = () => {
    // '/map' 경로로 단순 이동 (좌표 전달 없음)
    navigate("/map"); 
  };

  return (
    <div className="main-container">
      {/* 중앙 카드 */}
      <div className={`card ${chatOpen ? "card-shift" : ""}`}>
        <span className="badge">공무원 인증</span>
        <h1 className="title">공무원 인증 맛집 플랫폼</h1>
        <p className="description">
          <span className="highlight">공무원</span>이 직접 인증한 진짜 맛집을{" "}
          <span className="highlight underline">내 위치</span> 또는 원하는 지역에서 찾아보세요!
        </p>
        
        {/* 버튼 연결 수정 */}
        <button 
          className="local-btn"
          onClick={findNearMe} // 👈 새로운 함수 연결 (위치 요청 + 서버 저장)
        >
          내 위치 근처 찾기
        </button>
        <button 
          className="choice-btn"
          onClick={goToMap} // 👈 기존 함수 유지 (단순 페이지 이동)
        >
          위치 지정해서 찾기
        </button>
      </div>

      {/* 채팅창 */}
      {chatOpen && (
        <div className="chat-box">
          <div className="chat-header">챗봇</div>
          <div className="chat-body">
            <div className="chat-message left">안녕하세요! 무엇을 도와드릴까요?</div>
            <div className="chat-message right">근처 맛집 알려줘</div>
          </div>
          <div className="chat-input-area">
            <input type="text" placeholder="메시지를 입력하세요..." />
            <button>전송</button>
          </div>
        </div>
      )}

      {/* 챗봇 버튼 */}
      <button onClick={() => setChatOpen(!chatOpen)} className="chat-btn">
        💬
      </button>
    </div>
  );
}

export default Main;