// src/map.js
import React, { useEffect, useRef, useState } from "react";
import { useLocation, useSearchParams, useNavigate } from "react-router-dom";
import "./map.css";

const API_BASE = "http://localhost:5000";

// 공통 API 헬퍼
async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`API GET Error: ${res.status}`);
  return res.json();
}

async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API POST Error: ${res.status}`);
  return res.json();
}

function getAverageCoords(restaurants) {
  if (!restaurants || restaurants.length === 0) return null;

  const avgLat =
    restaurants.reduce((sum, r) => sum + parseFloat(r.lat), 0) /
    restaurants.length;

  const avgLng =
    restaurants.reduce((sum, r) => sum + parseFloat(r.lng), 0) /
    restaurants.length;

  return { lat: avgLat, lng: avgLng };
}

function Map() {
  const mapContainer = useRef(null);
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // ─────────────────────────────
  // 상수 데이터
  // ─────────────────────────────
  const PROVINCES = ["서울특별시", "경기도"];
  const DISTRICTS_BY_PROVINCE = {
    "서울특별시": [
      "강남구", "강동구", "강북구", "강서구", "관악구", "광진구", "구로구", "금천구",
      "노원구", "도봉구", "동대문구", "동작구", "마포구", "서대문구", "서초구", "성동구",
      "성북구", "송파구", "양천구", "영등포구", "용산구", "은평구", "종로구", "중구", "중랑구"
    ],
    "경기도": [
      "수원시", "성남시", "고양시", "용인시", "부천시", "안산시", "안양시", "남양주시",
      "화성시", "평택시", "의정부시", "시흥시", "파주시", "김포시", "광명시", "광주시",
      "군포시", "하남시", "오산시", "양주시", "이천시", "구리시", "안성시", "포천시",
      "의왕시", "양평군", "여주시", "동두천시", "과천시", "가평군", "연천군"
    ]
  };

  const LOCATION_COORDS = {
    // 서울특별시 좌표
    "서울특별시 강남구": { lat: 37.5173, lng: 127.0473 },
    "서울특별시 강동구": { lat: 37.5301, lng: 127.1238 },
    "서울특별시 강북구": { lat: 37.6398, lng: 127.0256 },
    "서울특별시 강서구": { lat: 37.5509, lng: 126.8495 },
    "서울특별시 관악구": { lat: 37.4784, lng: 126.9516 },
    "서울특별시 광진구": { lat: 37.5384, lng: 127.0822 },
    "서울특별시 구로구": { lat: 37.4954, lng: 126.8874 },
    "서울특별시 금천구": { lat: 37.4568, lng: 126.8950 },
    "서울특별시 노원구": { lat: 37.6543, lng: 127.0565 },
    "서울특별시 도봉구": { lat: 37.6688, lng: 127.0471 },
    "서울특별시 동대문구": { lat: 37.5744, lng: 127.0396 },
    "서울특별시 동작구": { lat: 37.5124, lng: 126.9398 },
    "서울특별시 마포구": { lat: 37.5609, lng: 126.9084 },
    "서울특별시 서대문구": { lat: 37.5791, lng: 126.9368 },
    "서울특별시 서초구": { lat: 37.4836, lng: 127.0327 },
    "서울특별시 성동구": { lat: 37.5634, lng: 127.0371 },
    "서울특별시 성북구": { lat: 37.5894, lng: 127.0167 },
    "서울특별시 송파구": { lat: 37.5145, lng: 127.1066 },
    "서울특별시 양천구": { lat: 37.5169, lng: 126.8664 },
    "서울특별시 영등포구": { lat: 37.5263, lng: 126.8962 },
    "서울특별시 용산구": { lat: 37.5311, lng: 126.9819 },
    "서울특별시 은평구": { lat: 37.6027, lng: 126.9292 },
    "서울특별시 종로구": { lat: 37.5735, lng: 126.9788 },
    "서울특별시 중구": { lat: 37.5641, lng: 126.9979 },
    "서울특별시 중랑구": { lat: 37.6063, lng: 127.0925 },
    
    // 경기도 좌표
    "경기도 수원시": { lat: 37.2636, lng: 127.0286 },
    "경기도 성남시": { lat: 37.4201, lng: 127.1262 },
    "경기도 고양시": { lat: 37.6584, lng: 126.8320 },
    "경기도 용인시": { lat: 37.2410, lng: 127.1776 },
    "경기도 부천시": { lat: 37.5034, lng: 126.7660 },
    "경기도 안산시": { lat: 37.3219, lng: 126.8309 },
    "경기도 안양시": { lat: 37.3943, lng: 126.9568 },
    "경기도 남양주시": { lat: 37.6361, lng: 127.2167 },
    "경기도 화성시": { lat: 37.1995, lng: 126.8311 },
    "경기도 평택시": { lat: 36.9921, lng: 127.1128 },
    "경기도 의정부시": { lat: 37.7381, lng: 127.0337 },
    "경기도 시흥시": { lat: 37.3799, lng: 126.8028 },
    "경기도 파주시": { lat: 37.7599, lng: 126.7800 },
    "경기도 김포시": { lat: 37.6152, lng: 126.7158 },
    "경기도 광명시": { lat: 37.4786, lng: 126.8644 },
    "경기도 광주시": { lat: 37.4294, lng: 127.2550 },
    "경기도 군포시": { lat: 37.3617, lng: 126.9352 },
    "경기도 하남시": { lat: 37.5393, lng: 127.2148 },
    "경기도 오산시": { lat: 37.1498, lng: 127.0773 },
    "경기도 양주시": { lat: 37.7853, lng: 127.0458 },
    "경기도 이천시": { lat: 37.2723, lng: 127.4349 },
    "경기도 구리시": { lat: 37.5943, lng: 127.1296 },
    "경기도 안성시": { lat: 37.0079, lng: 127.2797 },
    "경기도 포천시": { lat: 37.8948, lng: 127.2002 },
    "경기도 의왕시": { lat: 37.3449, lng: 126.9684 },
    "경기도 양평군": { lat: 37.4913, lng: 127.4874 },
    "경기도 여주시": { lat: 37.2976, lng: 127.6376 },
    "경기도 동두천시": { lat: 37.9034, lng: 127.0606 },
    "경기도 과천시": { lat: 37.4290, lng: 126.9875 },
    "경기도 가평군": { lat: 37.8314, lng: 127.5095 },
    "경기도 연천군": { lat: 38.0965, lng: 127.0748 },
  };

  // ─────────────────────────────
  // state
  // ─────────────────────────────
  const source = location.state?.source;
  const urlLat = searchParams.get("lat");
  const urlLng = searchParams.get("lng");
  const chatbotRestaurants = location.state?.restaurants;
  
  // ⭐ main.js에서 전달받은 지역 정보
  const stateProvince = location.state?.province;
  const stateDistrict = location.state?.district;

  // ⭐ 초기값 설정: main.js에서 전달받은 값이 있으면 그걸 사용
  const initialProvince = stateProvince || "all";
  const initialDistrict = stateDistrict || "all";

  const [selectedProvince, setSelectedProvince] = useState(initialProvince);
  const [selectedDistrict, setSelectedDistrict] = useState(initialDistrict);

  const [isLoading, setIsLoading] = useState(false);
  const [isListLoading, setIsListLoading] = useState(false);
  const [nearbyList, setNearbyList] = useState([]);
  const [radius, setRadius] = useState(0.5);

  const [mapInstance, setMapInstance] = useState(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);

  const [mapMarkers, setMapMarkers] = useState({});

  // ─────────────────────────────
  // 공통: 주변 맛집 목록 가져오기
  // ─────────────────────────────
  const fetchNearbyRestaurants = async () => {
    setIsListLoading(true);
    try {
      const listData = await apiGet(`/restaurants/nearby?radius=${radius}`);
      setNearbyList(listData);
    } catch (error) {
      console.error("주변 맛집 조회 오류:", error);
    } finally {
      setIsListLoading(false);
    }
  };

  // ─────────────────────────────
  // 식당 상세 + 리뷰 정보 한번에 가져오기
  // ─────────────────────────────
  const fetchRestaurantDetailWithReviews = async (restaurant) => {
    if (!restaurant) return;
    setIsLoading(true);
    try {
      const detailRes = await apiGet(
        `/restaurant/detail?lat=${restaurant.lat}&lng=${restaurant.lng}`
      );
      const detail = detailRes.data || detailRes;

      let reviewItems = [];
      let reviewTotal = 0;
      try {
        const reviewRes = await apiGet(
          `/reviews/restaurant/${detail.res_id}?page=1&per_page=3&order=recent`
        );
        const rdata = reviewRes.data || reviewRes;
        reviewItems = rdata.items || [];
        reviewTotal =
          typeof rdata.total === "number"
            ? rdata.total
            : reviewItems.length;
      } catch (e) {
        console.error("리뷰 정보 조회 오류:", e);
      }

      setSelectedRestaurant({
        ...detail,
        reviews: reviewItems,
        review_count: reviewTotal,
      });
    } catch (error) {
      console.error("식당 상세 조회 오류:", error);
      alert("정보를 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // ─────────────────────────────
  // 카카오 지도 초기화 + 마커 생성
  // ─────────────────────────────
  const initMap = (markerData, targetCoords) => {
    const center = new window.kakao.maps.LatLng(
      targetCoords.lat,
      targetCoords.lng
    );

    const options = {
      center,
      level: 4,
      draggable: true,
      scrollwheel: true,
    };

    const map = new window.kakao.maps.Map(mapContainer.current, options);

    const zoomControl = new window.kakao.maps.ZoomControl();
    map.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);
    map.setZoomable(true);

    setMapInstance(map);

    const markersToShow =
      source === "chatbot" && chatbotRestaurants?.length > 0
        ? chatbotRestaurants
        : markerData;

    const bounds = new window.kakao.maps.LatLngBounds();

    markersToShow.forEach((resto) => {
      const markerPosition = new window.kakao.maps.LatLng(resto.lat, resto.lng);
      const marker = new window.kakao.maps.Marker({ position: markerPosition });

      marker.setMap(map);
      bounds.extend(markerPosition);

      window.kakao.maps.event.addListener(marker, "click", () => {
        map.panTo(markerPosition);
        fetchRestaurantDetailWithReviews(resto);
      });
    });

    window.kakao.maps.event.addListener(map, "dragend", async () => {
      const newCenter = map.getCenter();
      try {
        await apiPost("/location", {
          lat: newCenter.getLat(),
          lng: newCenter.getLng(),
        });
      } catch (e) {
        console.error("위치 저장 실패:", e);
      }

      setSelectedProvince("all");
      setSelectedDistrict("all");

      if (source !== "chatbot") {
        fetchNearbyRestaurants();
      }
    });
  };

  // ─────────────────────────────
  // 1. 컴포넌트 마운트 시: 지도 + 마커 초기화
  // ─────────────────────────────
  useEffect(() => {
    let targetCoords = null;

    // 📌 1) 챗봇 추천 결과 → 평균 좌표 중심
    if (source === "chatbot" && chatbotRestaurants?.length > 0) {
      targetCoords = getAverageCoords(chatbotRestaurants);
    }
    // 📌 2) 주소 검색 결과 → 선택된 지역 좌표
    else if (source === "address" && stateProvince && stateDistrict) {
      const locationKey = `${stateProvince} ${stateDistrict}`;
      targetCoords = LOCATION_COORDS[locationKey] || { lat: 37.2636, lng: 127.0286 };
      console.log(`📍 주소 검색: ${locationKey}`, targetCoords);
    }
    // 📌 3) URL 기반 위치 지정 (현재 위치)
    else if (source === "geolocation" && urlLat && urlLng) {
      targetCoords = { lat: parseFloat(urlLat), lng: parseFloat(urlLng) };
    }
    // 📌 4) 기본 위치 (수원)
    else {
      targetCoords = { lat: 37.2636, lng: 127.0286 };
    }

    const fetchMarkersAndInitMap = async () => {
      setIsLoading(true);

      try {
        const markerData = await apiGet("/restaurants/markers");

        const loadKakao = () => {
          window.kakao.maps.load(() => initMap(markerData, targetCoords));
        };

        if (window.kakao && window.kakao.maps) loadKakao();
        else {
          const script = document.createElement("script");
          script.src =
            "//dapi.kakao.com/v2/maps/sdk.js?appkey=920ae06c68357b930c999434271d8194&autoload=false";
          script.async = true;
          document.head.appendChild(script);
          script.onload = () => window.kakao.maps.load(() => initMap(markerData, targetCoords));
        }

        if (source !== "chatbot") await fetchNearbyRestaurants();
        else setNearbyList(chatbotRestaurants);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMarkersAndInitMap();
  }, []);

  // ─────────────────────────────
  // 2) 반경 변경 시 갱신
  // ─────────────────────────────
  useEffect(() => {
    if (mapInstance && source !== "chatbot") fetchNearbyRestaurants();
  }, [radius, mapInstance, source]);

  // ─────────────────────────────
  // 3) 지역 변경 시 지도 이동
  // ─────────────────────────────
  useEffect(() => {
    if (!mapInstance) return;
    if (selectedProvince === "all") return; // "지역 전체" 선택 시 이동 안 함

    const currentKey = `${selectedProvince} ${selectedDistrict}`;
    let targetCoords = null;

    if (LOCATION_COORDS[currentKey]) {
      targetCoords = LOCATION_COORDS[currentKey];
      console.log(`🗺️ 지도 이동: ${currentKey}`, targetCoords);
    } else {
      const c = mapInstance.getCenter();
      targetCoords = { lat: c.getLat(), lng: c.getLng() };
    }

    mapInstance.setCenter(new window.kakao.maps.LatLng(targetCoords.lat, targetCoords.lng));
    setSelectedRestaurant(null);
  }, [selectedProvince, selectedDistrict, mapInstance]);

  // ─────────────────────────────
  // 핸들러들
  // ─────────────────────────────
  const handleGoToCurrentLocation = () => {
    if (!navigator.geolocation || !mapInstance) return;

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude: lat, longitude: lng } = position.coords;
      const newPos = new window.kakao.maps.LatLng(lat, lng);

      try {
        await apiPost("/location", { lat, lng });
      } catch (e) {
        console.error("위치 저장 실패:", e);
      }

      mapInstance.panTo(newPos);
      setSelectedProvince("all");
      setSelectedDistrict("all");
      fetchNearbyRestaurants();
    });
  };

  const handleProvinceChange = (e) => {
    const newProvince = e.target.value;
    setSelectedProvince(newProvince);

    if (newProvince === "all") {
      setSelectedDistrict("all");
    } else {
      const newDistricts = DISTRICTS_BY_PROVINCE[newProvince];
      if (newDistricts?.length > 0) {
        setSelectedDistrict(newDistricts[0]);
      }
    }
  };

  const handleRestaurantClick = (restaurant) => {
    if (!mapInstance) return;

    const moveLatLng = new window.kakao.maps.LatLng(
      restaurant.lat,
      restaurant.lng
    );
    mapInstance.panTo(moveLatLng);

    fetchRestaurantDetailWithReviews(restaurant);
  };

  // ─────────────────────────────
  // 렌더링
  // ─────────────────────────────
  return (
    <div className="map-wrapper">
      {/* 1. 지도 영역 */}
      <div className="map-section">
        <div className="floating-header">
          <button onClick={() => navigate(-1)} className="icon-btn back-btn">
            ←
          </button>
          <div className="search-bar">
            <select value={selectedProvince} onChange={handleProvinceChange}>
              <option value="all">지역 전체</option>
              {PROVINCES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <div className="divider-vertical"></div>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              disabled={selectedProvince === "all"}
            >
              {selectedProvince === "all" ? (
                <option value="all">지역 선택</option>
              ) : (
                DISTRICTS_BY_PROVINCE[selectedProvince].map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))
              )}
            </select>
            <button
              onClick={handleGoToCurrentLocation}
              className="location-btn"
              title="현위치로 이동"
            >
              🎯
            </button>
          </div>
        </div>

        <div
          id="kakao-map"
          ref={mapContainer}
          className="kakao-map-view"
        />

        {isLoading && (
          <div className="map-loading-overlay">지도 불러오는 중... 🗺️</div>
        )}

        {/* 하단 상세 패널 */}
        {selectedRestaurant && (
          <div className="detail-sheet fade-up">
            <button
              className="sheet-close-btn"
              onClick={() => setSelectedRestaurant(null)}
            >
              ×
            </button>

            <div className="sheet-content">
              <div className="sheet-header">
                <div className="sheet-title">
                  <h3>{selectedRestaurant.res_name}</h3>
                  <span className="badge-category">
                    {selectedRestaurant.category || "맛집"}
                  </span>
                </div>
                <div className="sheet-meta">
                  <span>⭐ {selectedRestaurant.score ?? "0.0"}</span>
                  <span className="meta-separator">•</span>
                  <span>📞 {selectedRestaurant.res_phone || "정보없음"}</span>
                </div>
                <p className="sheet-address">{selectedRestaurant.address}</p>
              </div>

              <div className="sheet-reviews">
                <h4>
                  리뷰 <span>{selectedRestaurant.review_count || 0}</span>
                </h4>

                {!selectedRestaurant.reviews ||
                selectedRestaurant.reviews.length === 0 ? (
                  <div className="empty-review">
                    <p>리뷰 페이지에서 자세히 볼 수 있습니다.</p>
                    <button
                      onClick={() =>
                        navigate(`/reviews/${selectedRestaurant.res_id}`)
                      }
                    >
                      리뷰 보러가기 ✍
                    </button>
                  </div>
                ) : (
                  <div className="review-list">
                    {selectedRestaurant.reviews.map((review) => (
                      <div key={review.id} className="review-item">
                        <div className="review-item-header">
                          <span className="review-author">
                            User {review.user_id}
                          </span>
                          <span className="review-score">
                            {"★".repeat(review.rating)}
                            <span style={{ color: "#ccc" }}>
                              {"★".repeat(5 - review.rating)}
                            </span>
                          </span>
                        </div>
                        <div className="review-text">{review.content}</div>
                      </div>
                    ))}
                    <button
                      className="more-review-btn"
                      onClick={() =>
                        navigate(`/reviews/${selectedRestaurant.res_id}`)
                      }
                    >
                      리뷰 더보기 +
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. 오른쪽 사이드바 */}
      <div className="sidebar-section">
        <div className="sidebar-header">
          <h2>주변 맛집 🍽️</h2>
          {source !== "chatbot" && (
            <div className="radius-tabs">
              {[0.5, 1.0, 3.0].map((km) => (
                <button
                  key={km}
                  className={radius === km ? "active" : ""}
                  onClick={() => setRadius(km)}
                >
                  {km}km
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="restaurant-list-container">
          {isListLoading ? (
            <div className="loading-state">
              <span>맛집 찾는 중... 🍳</span>
            </div>
          ) : nearbyList.length === 0 ? (
            <div className="empty-state">
              <p>
                {source === "chatbot"
                  ? "추천 식당 정보가 없습니다."
                  : "이 근처에는 인증된 맛집이 없네요 🥲"}
              </p>
            </div>
          ) : (
            nearbyList.map((restaurant) => (
              <div
                key={restaurant.res_id}
                className="restaurant-card"
                onClick={() => handleRestaurantClick(restaurant)}
              >
                <div className="card-icon">🍽️</div>
                <div className="card-info">
                  <h4>{restaurant.res_name}</h4>
                  <p>{restaurant.category}</p>
                  {restaurant.distance_km != null && (
                    <span className="distance-chip">
                      {restaurant.distance_km}km
                    </span>
                  )}
                </div>
                <div className="card-arrow">→</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Map;