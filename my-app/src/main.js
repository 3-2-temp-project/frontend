import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./main.css";

import { askChat } from './chat';

function Main() {
  const [chatOpen, setChatOpen] = useState(false);
  const navigate = useNavigate();

  // ✅ 페이지 새로고침 시 세션 초기화
  useEffect(() => {
    localStorage.removeItem("chatSessionId");
  }, []);

  // 챗봇 메시지 관리
  const [messages, setMessages] = useState([
    { id: 1, text: "안녕하세요! 공맛집입니다! 원하시는 지역을 말씀해주세요.", sender: 'bot' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // === '내 위치 근처 찾기' 로직 (Geolocation 요청 및 서버 POST) ===
  const findNearMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          try {
            // 서버로 위치 전송
            const response = await fetch('/location', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ lat, lng }),
            });

            if (!response.ok) throw new Error(`서버 위치 저장 실패: ${response.status}`);


            console.log("위치 저장 성공 및 Map 페이지로 이동");
            navigate(`/map?lat=${lat}&lng=${lng}`);

          } catch (error) {
            console.error("위치 정보 전송 오류:", error);
            alert("서버 통신 오류가 발생했습니다. 위치 정보 없이 이동합니다.");
            navigate(`/map?lat=${lat}&lng=${lng}`);
          }
        },
        (error) => {
          console.error("위치 정보를 가져오는 데 실패:", error);
          alert("위치 정보를 가져올 수 없습니다. '위치 지정해서 찾기'를 이용해주세요.");
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      alert("이 브라우저는 위치 정보(Geolocation)를 지원하지 않습니다.");
    }
  };

  // === '위치 지정해서 찾기' 로직 ===
  const goToMap = () => {
    navigate("/map");
  };

  // 메시지 전송을 처리하는 함수
  const handleSendMessage = async () => {
    const userInput = inputValue.trim();
    if (userInput === "" || isLoading) return;

    // 사용자 메시지 추가
    const newUserMessage = {
      id: Date.now(),
      text: userInput,
      sender: 'user'
    };
    setMessages(prev => [...prev, newUserMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // FastAPI 호출
      const response = await askChat(userInput);

      // 🧠 기본 봇 응답
      const botMessage = {
        id: Date.now() + 1,
        text: response.answer || "응답 없음",
        sender: 'bot'
      };
      setMessages(prev => [...prev, botMessage]);

      // 🗺️ 지도 보기 버튼 메시지는 'items'가 존재하고 길이가 1개 이상일 때만 추가
      // "지도 보기" 버튼은 추천 결과가 포함된 응답일 때만 추가
      if (
        response.items &&
        response.items.length > 0 &&
        response.answer &&
        response.answer.includes("추천드릴게요") // 👈 추천 결과 문구 포함 시에만 버튼 추가
      ) {
        console.log("추천 결과가 완성되어 지도 버튼을 표시합니다.", response.items);

        const mapPrompt = {
          id: Date.now() + 2,
          text: "추천된 식당들을 지도에서 보시겠어요?",
          sender: 'bot',
          showMapButton: true,
          restaurants: response.items
        };

        setMessages(prevMessages => [...prevMessages, mapPrompt]);
      }


    } catch (error) {
      console.error("⚠️ 챗봇 API 연동 오류:", error);
      setMessages(prev => [
        ...prev,
        { id: Date.now() + 1, text: "죄송합니다. 서버 통신 중 오류가 발생했습니다.", sender: 'bot' }
      ]);
    } finally {
      setIsLoading(false);
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
        
        {/* 버튼 영역 */}
      <button className="local-btn" onClick={findNearMe}>
        내 위치 근처 찾기
      </button>
      <button className="choice-btn" onClick={goToMap}>
        위치 지정해서 찾기
      </button>
      </div>

      {/* 챗봇 창 */}
    {chatOpen && (
      <div className="chat-box">
        <div className="chat-header">공맛집 챗봇 🍽️</div>

        <div className="chat-body">
          {/* 메시지 렌더링 */}
          {messages.map((message, index) => {
            const isUser = message.sender === "user";
            const isLastMessage = index === messages.length - 1;
            const showMapButton =
              message.showMapButton && isLastMessage; // ✅ 마지막 메시지에만 버튼 표시

            return (
              <div
                key={message.id}
                className={`chat-message ${isUser ? "right" : "left"}`}
              >
                {message.text}

                {/* ✅ 지도 보기 버튼 (마지막 메시지에서만 렌더링) */}
                {showMapButton && (
                  <button
                    className="map-btn"
                    onClick={() =>
                      navigate("/map", {
                        state: {
                          source: "chatbot",
                          restaurants: message.restaurants,
                        },
                      })
                    }
                  >
                    지도에서 보기 🗺️
                  </button>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="chat-message left">
              <span>생각 중... 🤔</span>
            </div>
          )}
        </div>

        {/* 입력창 */}
        <div className="chat-input-area">
          <input
            type="text"
            placeholder="메시지를 입력하세요..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            disabled={isLoading}
          />
          <button onClick={handleSendMessage} disabled={isLoading}>
            {isLoading ? "..." : "전송"}
          </button>
        </div>
      </div>
    )}

    {/* 챗봇 열기 버튼 */}
    <button onClick={() => setChatOpen(!chatOpen)} className="chat-btn">
      💬
    </button>
  </div>
  );
}

export default Main;