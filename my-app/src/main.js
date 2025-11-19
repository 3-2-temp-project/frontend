import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./main.css";
import { askChat } from './chat';

const API_BASE_URL = 'http://localhost:5000';

function Main() {
  const [chatOpen, setChatOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.removeItem("chatSessionId");
  }, []);

  //'식당 찾기'
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [addressInput, setAddressInput] = useState('');
  const [searchError, setSearchError] = useState('');

  // 챗봇 관련
  const [messages, setMessages] = useState([{ id: 1, text: "안녕하세요! 공맛집입니다! 원하시는 지역을 말씀해주세요.", sender: 'bot' }]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const handleSendMessage = async () => {
    const userInput = inputValue.trim();
    if (userInput === "" || isLoading) return;

    // 사용자 메시지 추가
    const newUserMessage = {
      id: Date.now(), text: userInput, sender: 'user'};
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
  

  //'현위치 버튼 로직'(findNearMe->handleFindNearMe 함수 수정)
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
                // 1. 서버 세션에 현위치 저장
                const response = await fetch(`${API_BASE_URL}/location`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ lat, lng }),
                });
                if (!response.ok) throw new Error('서버 위치 저장 실패');

                // 2. Map.js로 이동 (geolocation 모드)
                navigate(`/map?lat=${lat}&lng=${lng}`, { 
                    state: { source: 'geolocation' } 
                });

            } catch (error) {
                console.error("위치 정보 전송 오류:", error);
                alert("서버 통신 오류가 발생했습니다.");
                navigate(`/map?lat=${lat}&lng=${lng}`, { 
                    state: { source: 'geolocation' } 
                });
            }
        },
        (error) => {
            alert("위치 정보를 가져올 수 없습니다.");
            navigate('/map', { state: { source: 'geolocation' } });
        }
    );
  };

  // '주소 검색' 로직 (Kakao API 사용)
  const handleSearchAddress = async () => {
    if (addressInput.trim() === '') {
        setSearchError("주소를 입력해주세요.");
        return;
    }
    setSearchError('');

    //Kakao 주소 검색 API 호출 (반드시 본인의 REST API 키 사용)
    const KAKAO_API_KEY = "cb5e37cbdbc7daee55c8160e0c2da967";
        
    try {
        const kakaoResponse = await fetch(
            `https://dapi.kakao.com/v2/local/search/address.json?query=${addressInput}`,
          {
            headers: { 'Authorization': `KakaoAK ${KAKAO_API_KEY}` }
          }
        );
        if (!kakaoResponse.ok) throw new Error('Kakao API 호출 실패');
            
        const data = await kakaoResponse.json();
        console.log("카카오 API 응답:", data);
        if (data.documents.length === 0) {
            setSearchError("유효한 주소를 찾을 수 없습니다.");
            return;
        }

        const doc = data.documents[0];
        const lat = doc.y; // 위도
        const lng = doc.x; // 경도
        const province = doc.address.region_1depth_name; // 예: "경기도"
        const district = doc.address.region_2depth_name; // 예: "화성시"

        console.log("검색된 지역:", province, district);

        // 유효성 검사 (map.js의 PROVINCES와 동일해야 함)
        /*
        const ALLOWED_PROVINCES = ["서울특별시", "경기도"];
        if (!ALLOWED_PROVINCES.includes(province)) {
            setSearchError("선택할 수 없는 지역입니다. (서울/경기만 가능)");
            return;
        }
        */
            
        // 서버 세션에 *검색된* 위치 저장
        const serverResponse = await fetch(`${API_BASE_URL}/location`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat, lng }),
        });
        if (!serverResponse.ok) throw new Error('서버 위치 저장 실패');

        // Map.js로 이동 (address 모드 + 콤보박스 초기값 전달)
        console.log("Map 페이지로 이동합니다!"); // 로그 확인
        navigate('/map', { 
            state: { 
                source: 'address',
                province: province,
                district: district.split(' ')[0] // 예: "수원시 장안구" -> "수원시"
            } 
        });

    } catch (error) {
        console.error("주소 검색 오류:", error);
        setSearchError(error.message);
        alert(`주소 검색 오류: ${error.message}\n기본 지도로 이동합니다.`);
        navigate('/map', { state: { source: 'address' } });
    }
  };
  

  return (
    <div className="main-container">
      <div className="top-nav">
        <Link to="/me">내 정보</Link>
        <Link to="/login">로그인</Link>
        <Link to="/register">회원가입</Link>
      </div>
      <div className={`card ${chatOpen ? "card-shift" : ""} ${isSearchOpen ? "search-open" : ""}`}>
        <span className="badge">공무원 인증</span>
        <h1 className="title">공무원 인증 맛집 플랫폼</h1>
        <p className="description">
          <span className="highlight">공무원</span>이 직접 인증한 진짜 맛집을{" "}
          <span className="highlight underline">내 위치</span> 또는 원하는 지역에서 찾아보세요!
        </p>
        
        <button className="find-restaurant-btn"
            onClick={() => setIsSearchOpen(!isSearchOpen)}>식당 찾기 🍽️
        </button>

        <div className="search-expansion-area">
            <button onClick={handleFindNearMe} className="expansion-btn">
                현위치 기준으로 찾기
            </button>

            <p style={{fontSize: '0.9rem', textAlign:'center', color: '#777', margin: '10px 0'}}>
                또는
            </p>

            <div style={{ display: 'flex', width: '100%', gap: '10px' }}>
                <input 
                    type="text"
                    value={addressInput}
                    onChange={(e) => setAddressInput(e.target.value)}
                    style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '8px' }}
                    placeholder="예) 서울특별시 강남구, 화성시 와우리 등"
                />
                <button onClick={handleSearchAddress} className="expansion-btn-search">검색</button>
            </div>
            {searchError && <p style={{ color: 'red', fontSize: '14px', textAlign: 'center' }}>{searchError}</p>}
        </div>
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