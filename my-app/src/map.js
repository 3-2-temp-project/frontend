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
      "은평구",
      "영등포구",
      "용산구",
      "동대문구",
      "동작구",
      "광진구",
      "마포구",
      "서초구",
      "강동구",
      "성북구",
      "도봉구",
      "노원구",
      "강서구",
      "양천구",
      "구로구",
      "금천구",
      "송파구",
      "강남구",
    ],
    "경기도": ["화성시 와우리", "수원시 팔달구", "수원시 장안구", "수원시"],
  };

  const LOCATION_COORDS = {
    "서울특별시 은평구": { lat: 37.6027, lng: 126.9292 },
    "서울특별시 영등포구": { lat: 37.5263, lng: 126.8962 },
    "서울특별시 용산구": { lat: 37.5311, lng: 126.9819 },
    "서울특별시 동대문구": { lat: 37.5744, lng: 127.0396 },
    "서울특별시 동작구": { lat: 37.5124, lng: 126.9398 },
    "서울특별시 광진구": { lat: 37.5384, lng: 127.0822 },
    "서울특별시 마포구": { lat: 37.5609, lng: 126.9084 },
    "서울특별시 서초구": { lat: 37.4836, lng: 127.0327 },
    "서울특별시 강동구": { lat: 37.5301, lng: 127.1238 },
    "서울특별시 성북구": { lat: 37.5894, lng: 127.0167 },
    "서울특별시 도봉구": { lat: 37.6688, lng: 127.0471 },
    "서울특별시 노원구": { lat: 37.6543, lng: 127.0565 },
    "서울특별시 강서구": { lat: 37.5509, lng: 126.849 },
    "서울특별시 양천구": { lat: 37.5169, lng: 126.8664 },
    "서울특별시 구로구": { lat: 37.4954, lng: 126.8874 },
    "서울특별시 금천구": { lat: 37.4568, lng: 126.895 },
    "서울특별시 송파구": { lat: 37.5145, lng: 127.1066 },
    "서울특별시 강남구": { lat: 37.5173, lng: 127.0473 },
    "경기도 화성시 와우리": { lat: 37.2092, lng: 126.9769 },
    "경기도 수원시 팔달구": { lat: 37.292, lng: 127.0107 },
    "경기도 수원시 장안구": { lat: 37.2951, lng: 126.9739 },
    "경기도 수원시": { lat: 37.2636, lng: 127.0286 },
  };

  // ─────────────────────────────
  // state
  // ─────────────────────────────
  const source = location.state?.source;
  const urlLat = searchParams.get("lat");
  const urlLng = searchParams.get("lng");
  const chatbotRestaurants = location.state?.restaurants;

  const initialProvince = "all";
  const initialDistrict = "all";

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
      // listData: [{ res_id, res_name, lat, lng, ...}]
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
      // 1) 식당 상세 (좌표 기반 조회)
      const detailRes = await apiGet(
        `/restaurant/detail?lat=${restaurant.lat}&lng=${restaurant.lng}`
      );
      const detail = detailRes.data || detailRes; // {res_id, res_name, address, ...}

      // 2) 이 식당의 리뷰 목록 (최신 3개 정도만)
      let reviewItems = [];
      let reviewTotal = 0;
      try {
        const reviewRes = await apiGet(
          `/reviews/restaurant/${detail.res_id}?page=1&per_page=3&order=recent`
        );
        const rdata = reviewRes.data || reviewRes; // {items, total, ...}
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

    // 줌 컨트롤
    const zoomControl = new window.kakao.maps.ZoomControl();
    map.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);
    map.setZoomable(true);

    setMapInstance(map);

    // ⭐ 챗봇 추천인 경우 → 추천된 맛집만 표시
    const markersToShow =
      source === "chatbot" && chatbotRestaurants?.length > 0
        ? chatbotRestaurants
        : markerData;

    // ⭐ 모든 마커의 범위 계산용 bounds
    const bounds = new window.kakao.maps.LatLngBounds();

    // 마커 생성
    markersToShow.forEach((resto) => {
      const markerPosition = new window.kakao.maps.LatLng(resto.lat, resto.lng);
      const marker = new window.kakao.maps.Marker({ position: markerPosition });

      marker.setMap(map);
      bounds.extend(markerPosition); // ← 화면 자동조절용 영역 포함

      // 마커 클릭 → 상세 + 리뷰
      window.kakao.maps.event.addListener(marker, "click", () => {
        map.panTo(markerPosition);
        fetchRestaurantDetailWithReviews(resto);
      });
    });

    // ⭐ 마커 여러 개일 때 자동으로 다 보이도록 조절
    /*if (markersToShow.length > 0) {
      map.setBounds(bounds);
    }*/

    // 지도 드래그 후 중심 이동 처리
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    let targetCoords = null;

    // 📌 1) 챗봇 추천 결과 → 평균 좌표 중심
    if (source === "chatbot" && chatbotRestaurants?.length > 0) {
      targetCoords = getAverageCoords(chatbotRestaurants);
    }

    // 📌 2) URL 기반 위치 지정
    else if (source === "geolocation" && urlLat && urlLng) {
      targetCoords = { lat: parseFloat(urlLat), lng: parseFloat(urlLng) };
    }

    // 📌 3) 기본 위치 (수원)
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
  // 3) 지역 변경 시 지도 이동 (fallback 없음)
  // ─────────────────────────────
  useEffect(() => {
    if (!mapInstance) return;

    const currentKey = `${selectedProvince} ${selectedDistrict}`;

    let targetCoords = null;

    if (LOCATION_COORDS[currentKey]) {
      targetCoords = LOCATION_COORDS[currentKey];
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
