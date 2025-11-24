// src/main.js
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./main.css";
import { askChat } from "./chat";
import { logout } from './authApi';

const API_BASE_URL = "http://localhost:5000";

function Main() {
  const navigate = useNavigate();
  const chatEndRef = useRef(null);

  // ─────────────────────────────
  // 상태 관리
  // ─────────────────────────────
  const [chatOpen, setChatOpen] = useState(false);
  const [searchTab, setSearchTab] = useState("current");
  const [addressInput, setAddressInput] = useState("");
  const [searchError, setSearchError] = useState("");

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState('');
  
  const [isServerOnline, setIsServerOnline] = useState(null);

  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "buttons",
      text: "안녕하세요! 공맛집입니다! 😋\n원하시는 지역이나 메뉴를 말씀해주세요.",
      sender: "bot",
      options: ["수원시", "화성시"]
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // ─────────────────────────────
  // 초기 로딩: 세션 초기화 + 서버 상태 체크
  // ─────────────────────────────
  useEffect(() => {

    const storedUserId = sessionStorage.getItem("currentUserId");
    if (storedUserId) {
        setIsLoggedIn(true);
        setUserId(storedUserId);
    }

    // ✅ 페이지 새로고침 시 챗봇 세션 초기화
    localStorage.removeItem("chatSessionId");

    const checkServerStatus = async () => {
      try {
        await fetch(API_BASE_URL, { method: "GET" });
        setIsServerOnline(true);
      } catch (error) {
        console.error(error);
        setIsServerOnline(false);
      }
    };

    checkServerStatus();
  }, []);


  // 메시지 변경 시 챗봇 영역 자동 스크롤
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatOpen]);

  // ─────────────────────────────
  // 챗봇 메시지 전송
  // ─────────────────────────────
  const handleSendMessage = async () => {
    const userInput = inputValue.trim();
    if (userInput === "" || isLoading) return;

    const newUserMessage = { id: Date.now(), text: userInput, sender: "user" };
    setMessages((prev) => [...prev, newUserMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await askChat(userInput);

      // 기본 봇 응답
      const botMessage = {
        id: Date.now() + 1,
        text: response.answer || "응답 없음",
        sender: "bot",
      };
      setMessages((prev) => [...prev, botMessage]);

      // 추천 결과가 있을 때만 지도 버튼 메시지 추가
      if (
        response.items &&
        response.items.length > 0 &&
        response.answer &&
        response.answer.includes("추천드릴게요")
      ) {
        const mapPrompt = {
          id: Date.now() + 2,
          text: "추천된 식당들을 지도에서 확인해보세요! 👇",
          sender: "bot",
          showMapButton: true,
          restaurants: response.items,
        };
        setMessages((prevMessages) => [...prevMessages, mapPrompt]);
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: "죄송합니다. 서버 통신 중 오류가 발생했습니다.",
          sender: "bot",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
        await logout(); 
        
        sessionStorage.removeItem("currentUserId");
        
        setIsLoggedIn(false);
        setUserId('');
        alert("로그아웃 되었습니다.");
        navigate('/'); 

    } catch (error) {
        console.error("로그아웃 실패:", error);
    }
  };

  // ─────────────────────────────
  // 현재 위치 기반 찾기
  // ─────────────────────────────
  const handleFindNearMe = () => {
    if (!navigator.geolocation) {
      alert("이 브라우저는 위치 정보(Geolocation)를 지원하지 않습니다.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        try {
          const response = await fetch(`${API_BASE_URL}/location`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ lat, lng }),
          });
          if (!response.ok) throw new Error("서버 위치 저장 실패");

          navigate(`/map?lat=${lat}&lng=${lng}`, {
            state: { source: "geolocation" },
          });
        } catch (error) {
          console.error(error);
          alert("서버 통신 오류가 발생했습니다.");
          navigate(`/map?lat=${lat}&lng=${lng}`, {
            state: { source: "geolocation" },
          });
        }
      },
      (error) => {
        console.error(error);
        alert("위치 정보를 가져올 수 없습니다.");
        navigate("/map", { state: { source: "geolocation" } });
      }
    );
  };

  // ─────────────────────────────
  // 주소 검색 + Kakao API
  // ─────────────────────────────
  const handleSearchAddress = async () => {
    if (addressInput.trim() === "") {
      setSearchError("주소를 입력해주세요.");
      return;
    }
    setSearchError("");

    const KAKAO_API_KEY = "cb5e37cbdbc7daee55c8160e0c2da967";

    try {
      const kakaoResponse = await fetch(
        `https://dapi.kakao.com/v2/local/search/address.json?query=${addressInput}`,
        { headers: { Authorization: `KakaoAK ${KAKAO_API_KEY}` } }
      );
      if (!kakaoResponse.ok) throw new Error("Kakao API 호출 실패");

      const data = await kakaoResponse.json();
      if (data.documents.length === 0) {
        setSearchError("유효한 주소를 찾을 수 없습니다.");
        return;
      }

      const doc = data.documents[0];
      const lat = doc.y;
      const lng = doc.x;
      const province = doc.address.region_1depth_name;
      const district = doc.address.region_2depth_name;

      const ALLOWED_PROVINCES = ["서울특별시", "경기도"];
      if (!ALLOWED_PROVINCES.includes(province)) {
        setSearchError("현재 서울/경기 지역만 서비스 중입니다.");
        return;
      }

      const serverResponse = await fetch(`${API_BASE_URL}/location`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ lat, lng }),
      });
      if (!serverResponse.ok) throw new Error("서버 위치 저장 실패");

      navigate("/map", {
        state: {
          source: "address",
          province: province,
          district: district.split(" ")[0],
        },
      });
    } catch (error) {
      console.error(error);
      setSearchError(error.message);
      alert(`오류 발생: ${error.message}`);
    }
  };

  // ─────────────────────────────
  // 렌더링
  // ─────────────────────────────
  return (
    <div className="app-wrapper">
      {/* 상단 네비게이션 */}
      <header className="navbar">
        <div className="nav-content">
          <div
            className="logo-area"
            style={{ display: "flex", alignItems: "center", gap: "10px" }}
          >
            <div className="logo">
              공맛집 <span>Official</span>
            </div>
            <div
              className={`server-status-dot ${
                isServerOnline === true ? "online" : "offline"
              }`}
              title={
                isServerOnline === true
                  ? "서버 연결됨 (5000)"
                  : "서버 연결 안됨"
              }
            ></div>
          </div>
          <nav className="nav-links">
            {isLoggedIn ? (
              <>
                <Link to="/me" style={{ marginRight: '10px' }}>내 정보</Link>
                <span style={{ fontWeight: 'bold', color: '#0073e6', marginRight: '10px' }}>
                    {userId}님
                </span>
                <button 
                    onClick={handleLogout}
                    style={{ 
                        background: 'transparent', 
                        border: 'none', 
                        cursor: 'pointer', 
                        fontSize: '1rem', 
                        color: '#333',
                        padding: 0
                    }}
                >로그아웃</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-link">
                  로그인
                  </Link>
                <Link to="/register" className="btn-primary-outline">
                  회원가입
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* 메인 히어로 + 검색 패널 */}
      <main className={`hero-section ${chatOpen ? "card-shift" : ""}`}>
        <div className="hero-content">
          <div className="hero-text">
            <span className="hero-badge">공무원 인증 맛집 플랫폼</span>
            <h1>
              오늘 점심,
              <br />
              <strong>실패 없는 맛집</strong>에서.
            </h1>
            <p>
              광고에 속지 마세요.
              <br />
              공무원들이 직접 검증한 데이터로 서울/경기 진짜 맛집을 찾아드립니다.
            </p>
            <div className="stat-box">
              <div>
                <strong>1,204+</strong>
                <span>인증 식당</span>
              </div>
              <div className="divider"></div>
              <div>
                <strong>98%</strong>
                <span>만족도</span>
              </div>
            </div>
          </div>

          <div className="search-panel">
            <div className="panel-header">
              <h2>맛집 찾기</h2>
              <p>어디서 식사하시나요?</p>
            </div>

            <div className="search-tabs">
              <button
                className={`tab-btn ${
                  searchTab === "current" ? "active" : ""
                }`}
                onClick={() => setSearchTab("current")}
              >
                내 주변
              </button>
              <button
                className={`tab-btn ${
                  searchTab === "address" ? "active" : ""
                }`}
                onClick={() => setSearchTab("address")}
              >
                주소 검색
              </button>
            </div>

            <div className="panel-body">
              {searchTab === "current" ? (
                <div className="tab-content fade-in">
                  <p className="info-text">
                    현재 위치를 기반으로 가장 가까운
                    <br />
                    인증 맛집을 보여드립니다.
                  </p>
                  <button
                    onClick={handleFindNearMe}
                    className="action-btn full-width"
                  >
                    현재 위치로 찾기
                  </button>
                </div>
              ) : (
                <div className="tab-content fade-in">
                  <p className="info-text">
                    원하시는 지역(시/구)을 입력해주세요.
                  </p>
                  <div className="input-group">
                    <input
                      type="text"
                      value={addressInput}
                      onChange={(e) => setAddressInput(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleSearchAddress()
                      }
                      placeholder="예) 서울특별시 강남구, 화성시 와우리"
                    />
                    <button
                      onClick={handleSearchAddress}
                      className="search-icon-btn"
                    >
                      🔍
                    </button>
                  </div>
                  {searchError && (
                    <p className="error-msg">{searchError}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* 챗봇 영역 */}
      <div className={`chatbot-container ${chatOpen ? "open" : ""}`}>
        {chatOpen && (
          <div className="chatbot-window">
            <div className="chat-header">
              <div className="bot-profile">
                <div className="bot-avatar">🤖</div>
                <div>
                  <span className="bot-name">공맛집 AI</span>
                  <span className="bot-status">Online</span>
                </div>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                className="close-chat"
              >
                ✖
              </button>
            </div>

            <div className="chat-messages">
              {messages.map((msg, idx) => {
                const isLast = idx === messages.length - 1;

                return (
                  <div
                    key={msg.id}
                    className={`message-row ${msg.sender}`}
                  >
                    {msg.sender === "bot" && (
                      <div className="sender-icon">🤖</div>
                    )}
                    <div className="message-bubble">
                      {msg.text.split("\n").map((line, i) => (
                        <React.Fragment key={i}>
                          {line}
                          <br />
                        </React.Fragment>
                      ))}

                      {/* ✅ 마지막 메시지일 때만 지도 버튼 표시 */}
                      {msg.showMapButton && isLast && (
                        <button
                          className="map-link-btn"
                          onClick={() =>
                            navigate("/map", {
                              state: {
                                source: "chatbot",
                                restaurants: msg.restaurants,
                              },
                            })
                          }
                        >
                          지도에서 식당 보기 🗺️
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {isLoading && (
                <div className="message-row bot">
                  <div className="sender-icon">🤖</div>
                  <div className="message-bubble loading">
                    <span>.</span>
                    <span>.</span>
                    <span>.</span>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            <div className="chat-input">
              <input
                type="text"
                placeholder="메시지 입력..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && handleSendMessage()
                }
                disabled={isLoading}
              />
              <button onClick={handleSendMessage} disabled={isLoading}>
                ➤
              </button>
            </div>
          </div>
        )}

        <button
          className="chatbot-toggle-btn"
          onClick={() => setChatOpen(!chatOpen)}
        >
          {chatOpen ? "🔽" : "💬"}
        </button>
      </div>
    </div>
  );
}

export default Main;
