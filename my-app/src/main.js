import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./main.css";
import { askChat } from './chat';

function Main() {
  const [chatOpen, setChatOpen] = useState(false);
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  

  // ✅ 페이지 새로고침 시 세션 초기화
  useEffect(() => {
    localStorage.removeItem("chatSessionId");
  }, []);

  // 초기 챗봇 메시지: "지역 선택" 버튼부터 시작
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "buttons",
      sender: "bot",
      text: "안녕하세요! 공맛집입니다! ✨\n\n원하시는 지역을 선택해주세요.",
      options: ["수원시", "화성시"]
    }
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
            const response = await fetch('http://localhost:5000/location', {
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
  // 메시지 전송을 처리하는 함수
const handleSendMessage = async (customMessage = null) => {
  const userInput = (customMessage ?? inputValue).trim();
  if (userInput === "" || isLoading) return;

  // 사용자 메시지 출력
  setMessages(prev => [
    ...prev,
    { id: Date.now(), text: userInput, sender: "user" }
  ]);

  setInputValue("");

  // ==============================
  // 🔵 1단계 — 지역 선택
  // ==============================
  if (currentStep === 1) {
    setMessages(prev => [
      ...prev,
      { id: Date.now() + 1, sender: "bot", text: `${userInput} 선택 완료!` },
      {
        id: Date.now() + 2,
        type: "buttons",
        sender: "bot",
        text: "몇 명이 식사하시나요?",
        options: ["1명", "2명", "3명", "4명 이상"],
      }
    ]);
    setCurrentStep(2);
    return;
  }

  // ==============================
  // 🔵 2단계 — 인원 선택
  // ==============================
  if (currentStep === 2) {
    setMessages(prev => [
      ...prev,
      { id: Date.now() + 1, sender: "bot", text: `${userInput} 선택했습니다!` },
      {
        id: Date.now() + 2,
        type: "buttons",
        sender: "bot",
        text: "어떤 종류의 음식을 찾고 계신가요?",
        options: ["한식", "중식", "일식", "양식", "카페"],
      }
    ]);
    setCurrentStep(3);
    return;
  }

  // ==============================
  // 🔵 3단계 — 음식 종류 선택 → 추천 요청
  // ==============================
  if (currentStep === 3) {
    setIsLoading(true);

    try {
      const response = await askChat(userInput);

      // 1) progress 단계면 SQL 준비 중 상태 → 메시지 출력 X
      if (response.type === "progress") {
        setIsLoading(false);
        return;
      }

      // 2) 추천 조회 안내 메시지
      setMessages(prev => [
        ...prev,
        { id: Date.now(), sender: "bot", text: "추천을 찾고 있어요... 🔍" },
      ]);

      // 3) 추천 없음
      if (!response.items || response.items.length === 0) {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: "bot",
            text: "조건에 맞는 맛집을 찾지 못했어요 😢",
          }
        ]);
        return;
      }

      // 4) 추천 있음
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 2,
          sender: "bot",
          text: "추천 결과예요! 👇"
        },
        {
          id: Date.now() + 3,
          sender: "bot",
          showMapButton: true,
          text: "지도로 결과를 보시겠어요?",
          restaurants: response.items
        }
      ]);

      setCurrentStep(4);

    } catch (err) {
      setMessages(prev => [
        ...prev,
        { id: Date.now(), sender: "bot", text: "서버 오류가 발생했습니다." }
      ]);
    } finally {
      setIsLoading(false);
    }

    return;
  }
};


  return (
    <div className="main-container">
      <div className="top-nav">
        <Link to="/me">내 정보</Link>
        <Link to="/login">로그인</Link>
        <Link to="/register">회원가입</Link>
      </div>
      {/* 중앙 카드 */}
      <div className={`card ${chatOpen ? "card-shift" : ""}`}>
        <span className="badge">공무원 인증</span>
        <h1 className="title">공무원 인증 맛집 플랫폼</h1>
        <p className="description">
          <span className="highlight">공무원</span>이 직접 인증한 진짜 맛집을{" "}
          <br></br>
          <span className="highlight underline">내 위치</span>
          <span> 또는 </span>
          <span className="highlight underline">원하는 지역</span>에서 찾아보세요!
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

            // 1) 버튼 메시지일 경우
            if (message.type === "buttons") {
              return (
                <div key={message.id} className="chat-message left">
                  <div>{message.text}</div>
                  <div className="button-message">
                    {message.options.map((opt) => (
                      <button
                        key={opt}
                        className="chat-option-btn"
                        onClick={() => handleSendMessage(opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              );
            }

            // 2) 일반 메시지일 경우
            return (
              <div
                key={message.id}
                className={`chat-message ${isUser ? "right" : "left"}`}
              >
                {message.text}

                {/* 지도 버튼 렌더링 */}
                {message.showMapButton && isLastMessage && (
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