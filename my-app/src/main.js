import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./main.css";

import { askChat } from './api/chat'; // 챗봇 API 함수. 경로 수정

function Main() {
  const [chatOpen, setChatOpen] = useState(false);
  const navigate = useNavigate();

  // 챗봇 메시지 관리를 위한 state 추가
  const [messages, setMessages] = useState([
    { id: 1, text: "안녕하세요! 무엇을 도와드릴까요?", sender: 'bot' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // === '내 위치 근처 찾기' 로직 (Geolocation 요청 및 서버 POST) ===
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

  // 메시지 전송을 처리하는 함수
  //handleSendMessage 함수를 'askChat'을 사용하도록 수정
    const handleSendMessage = async () => {
        const userInput = inputValue.trim();
        if (userInput === "" || isLoading) return; 

        // 사용자가 입력한 메시지를 객체로 만듦
        const newUserMessage = {
            id: Date.now(),
            text: userInput,
            sender: 'user'
        };

        // UI에 사용자 메시지를 즉시 반영
        setMessages(prevMessages => [...prevMessages, newUserMessage]);
        setInputValue('');
        setIsLoading(true); // 로딩 시작

        try {
            // fetch 대신 'askChat' 함수 호출
            // askChat 함수가 세션 ID, API 경로 등을 모두 알아서 처리
            const response = await askChat(userInput); // (필터는 나중에 필요시 추가)

            // 응답 데이터 키 'response.answer'
            const botMessage = {
                id: Date.now() + 1,
                text: response.answer,
                sender: 'bot'
            };

            // UI에 봇의 응답 메시지 추가
            setMessages(prevMessages => [...prevMessages, botMessage]);

            
            //'items' 필드가 있는지, 그리고 0개 이상인지 확인
            if (response.items && response.items.length > 0) {
                console.log("AI가 식당을 추천했습니다. Map 페이지로 이동합니다.", response.items);
                
                // 4. Map.js로 데이터와 함께 이동
                navigate('/map', { 
                    state: { 
                        source: 'chatbot', // 챗봇을 통해 진입했음을 알림
                        restaurants: response.items // AI가 추천해준 식당 목록
                    } 
                });
            }
            // 'items'가 없으면 (단순 대화면) 아무것도 하지 않고 함수 종료

        } catch (error) {
            console.error("챗봇 API 연동 오류:", error);
            const errorMessage = {
                id: Date.now() + 1,
                text: "죄송합니다. 서버와 통신 중 오류가 발생했습니다.",
                sender: 'bot'
            };
            setMessages(prevMessages => [...prevMessages, errorMessage]);
        } finally {
            setIsLoading(false); // 로딩 종료
        }
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
          onClick={findNearMe} //함수 연결 (위치 요청 + 서버 저장)
        >
          내 위치 근처 찾기
        </button>
        <button 
          className="choice-btn"
          onClick={goToMap} //기존 함수 유지 (단순 페이지 이동)
        >
          위치 지정해서 찾기
        </button>
      </div>

      {/* 채팅창 */}
      {chatOpen && (
        <div className="chat-box">
          <div className="chat-header">챗봇</div>
          <div className="chat-body">
            {/* 하드코딩된 메시지 대신 state를 기반으로 동적 렌더링 */}
            {messages.map(message => (
              <div 
                key={message.id} 
                className={`chat-message ${message.sender === 'user' ? 'right' : 'left'}`}
              >
                {message.text}
              </div>
            ))}
            {isLoading && (
                            <div className="chat-message left"><span>생각 중... 🤔</span></div>
                        )}
          </div>
          <div className="chat-input-area">
            <input 
              type="text" 
              placeholder="메시지를 입력하세요..." 
              value={inputValue} // 입력값을 state와 연결
              onChange={(e) => setInputValue(e.target.value)} // 입력할 때마다 state 업데이트
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            disabled={isLoading}
            />
            <button onClick={handleSendMessage} disabled={isLoading}>
                                        {isLoading ? '...' : '전송'}
                                    </button>          
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