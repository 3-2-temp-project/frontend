import React, { useEffect, useRef, useState } from "react";
import { useLocation, useSearchParams, useNavigate } from "react-router-dom";
import "./map.css";

const API_BASE = "http://localhost:5000";

// API 헬퍼 함수
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

function Map() {
  const mapContainer = useRef(null);
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // --- 데이터 상수 ---
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

  // --- State ---
  const source = location.state?.source;
  const urlLat = searchParams.get("lat");
  const urlLng = searchParams.get("lng");
  const chatbotRestaurants = location.state?.restaurants;

  const initialProvince = urlLat ? "all" : PROVINCES[0];
  const initialDistrict = urlLat ? "all" : DISTRICTS_BY_PROVINCE[PROVINCES[0]][0];

  const [selectedProvince, setSelectedProvince] = useState(initialProvince);
  const [selectedDistrict, setSelectedDistrict] = useState(initialDistrict);

  const [isLoading, setIsLoading] = useState(false); // 지도/마커 로딩
  const [isListLoading, setIsListLoading] = useState(false); // 리스트 로딩
  const [nearbyList, setNearbyList] = useState([]);
  const [radius, setRadius] = useState(0.5);

  const [mapInstance, setMapInstance] = useState(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);

  // --- Logic ---

  const fetchNearbyRestaurants = async () => {
    setIsListLoading(true);
    try {
      const listData = await apiGet(`/restaurants/nearby?radius=${radius}`);
      setNearbyList(listData);
    } catch (error) {
      console.error(error);
    } finally {
      setIsListLoading(false);
    }
  };

  // 지도 초기화 함수
  const initMap = (markerData, targetCoords) => {
    const center = new window.kakao.maps.LatLng(targetCoords.lat, targetCoords.lng);
    const options = {
      center,
      level: 4,
      draggable: true,
      scrollwheel: true,
    };

    const map = new window.kakao.maps.Map(mapContainer.current, options);

    // 줌 컨트롤(+/-) 추가
    const zoomControl = new window.kakao.maps.ZoomControl();
    map.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);
    map.setZoomable(true);

    setMapInstance(map);

    // 마커 생성
    markerData.forEach((resto) => {
      const markerPosition = new window.kakao.maps.LatLng(resto.lat, resto.lng);
      const marker = new window.kakao.maps.Marker({ position: markerPosition });
      marker.setMap(map);

      window.kakao.maps.event.addListener(marker, "click", async () => {
        map.panTo(markerPosition);
        setIsLoading(true);
        try {
          const detailData = await apiGet(
            `/restaurant/detail?lat=${resto.lat}&lng=${resto.lng}`
          );
          setSelectedRestaurant(detailData);
        } catch (error) {
          console.error(error);
          alert("정보를 불러오지 못했습니다.");
        } finally {
          setIsLoading(false);
        }
      });
    });

    // 지도 드래그 후 중심 이동 시 위치 저장 + 주변 맛집 갱신
    window.kakao.maps.event.addListener(map, "dragend", async () => {
      const newCenter = map.getCenter();
      await apiPost("/location", { lat: newCenter.getLat(), lng: newCenter.getLng() });
      setSelectedProvince("all");
      setSelectedDistrict("all");
      fetchNearbyRestaurants();
    });
  };

  // 1. 초기화 (마운트 시 1번만 실행)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    let targetCoords;

    if (source === "geolocation" && urlLat && urlLng) {
      targetCoords = { lat: parseFloat(urlLat), lng: parseFloat(urlLng) };
    } else {
      const currentKey = `${selectedProvince} ${selectedDistrict}`;
      targetCoords =
        LOCATION_COORDS[currentKey] || LOCATION_COORDS["서울특별시 은평구"];
    }

    const fetchMarkersAndInitMap = async () => {
      setIsLoading(true);
      try {
        const markerData = await apiGet("/restaurants/markers");

        const loadKakao = () => {
          window.kakao.maps.load(() => initMap(markerData, targetCoords));
        };

        if (window.kakao && window.kakao.maps) {
          loadKakao();
        } else {
          const script = document.createElement("script");
          script.src =
            "//dapi.kakao.com/v2/maps/sdk.js?appkey=920ae06c68357b930c999434271d8194&autoload=false";
          script.async = true;
          document.head.appendChild(script);
          script.onload = () => {
            window.kakao.maps.load(() => initMap(markerData, targetCoords));
          };
        }

        if (source !== "chatbot") {
          await fetchNearbyRestaurants();
        }
      } catch (error) {
        console.error(error);
        if (window.kakao && window.kakao.maps) {
          window.kakao.maps.load(() => initMap([], targetCoords));
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchMarkersAndInitMap();
  }, []);

  // 2. 반경 변경 시 주변 맛집 갱신
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (mapInstance && source !== "chatbot") {
      fetchNearbyRestaurants();
    }
  }, [radius, mapInstance, source]);

  // 3. 챗봇에서 넘어온 추천 식당 리스트 연동
  useEffect(() => {
    if (source === "chatbot" && chatbotRestaurants) {
      setNearbyList(chatbotRestaurants);
    }
  }, [source, chatbotRestaurants]);

  // 4. 지역 선택 시 지도 중심 이동
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!mapInstance) return;

    let targetCoords;
    if (selectedProvince === "all" && urlLat && urlLng) {
      targetCoords = { lat: parseFloat(urlLat), lng: parseFloat(urlLng) };
    } else {
      const currentKey = `${selectedProvince} ${selectedDistrict}`;
      targetCoords =
        LOCATION_COORDS[currentKey] || LOCATION_COORDS["서울특별시 은평구"];
    }

    const center = new window.kakao.maps.LatLng(targetCoords.lat, targetCoords.lng);
    mapInstance.setCenter(center);
    setSelectedRestaurant(null);
  }, [selectedProvince, selectedDistrict]);

  // --- 핸들러 ---

  const handleGoToCurrentLocation = () => {
    if (!navigator.geolocation || !mapInstance) return;

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude: lat, longitude: lng } = position.coords;
      const newPos = new window.kakao.maps.LatLng(lat, lng);

      await apiPost("/location", { lat, lng });
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

  const handleRestaurantClick = async (restaurant) => {
    if (!mapInstance) return;

    const moveLatLng = new window.kakao.maps.LatLng(
      restaurant.lat,
      restaurant.lng
    );
    mapInstance.panTo(moveLatLng);

    try {
      const detailData = await apiGet(
        `/restaurant/detail?lat=${restaurant.lat}&lng=${restaurant.lng}`
      );
      setSelectedRestaurant(detailData);
    } catch (error) {
      console.error(error);
    }
  };

  // --- 렌더링 ---
  return (
    <div className="map-wrapper">
      {/* 1. 지도 영역 (왼쪽) */}
      <div className="map-section">
        {/* 플로팅 헤더 */}
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

        {/* 지도 로딩 오버레이 */}
        {isLoading && (
          <div className="map-loading-overlay">
            지도 불러오는 중... 🗺️
          </div>
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
                  <h3>{selectedRestaurant.name}</h3>
                  <span className="badge-category">
                    {selectedRestaurant.category || "맛집"}
                  </span>
                </div>
                <div className="sheet-meta">
                  <span>⭐ {selectedRestaurant.score ?? "0.0"}</span>
                  <span>📞 {selectedRestaurant.phone || "정보없음"}</span>
                </div>
                <p className="sheet-address">{selectedRestaurant.address}</p>
              </div>

              <div className="sheet-reviews">
                <h4>
                  리뷰{" "}
                  <span>{selectedRestaurant.review_count || 0}</span>
                </h4>
                {!selectedRestaurant.reviews ||
                selectedRestaurant.reviews.length === 0 ? (
                  <div className="empty-review">
                    <p>아직 작성된 리뷰가 없습니다.</p>
                    <button
                      onClick={() =>
                        navigate(`/reviews/${selectedRestaurant.res_id}`)
                      }
                    >
                      첫 리뷰 작성하기 ✍️
                    </button>
                  </div>
                ) : (
                  <div className="review-list">
                    {selectedRestaurant.reviews.map((review) => (
                      <div key={review.id} className="review-item">
                        <div className="review-author">{review.author}</div>
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

      {/* 2. 사이드바 (오른쪽) */}
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
                  <h4>{restaurant.name}</h4>
                  <p>{restaurant.category}</p>
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
