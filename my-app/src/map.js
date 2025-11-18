import React, { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import "./main.css";

// 🔥 백엔드 기본 주소
const API_BASE = "http://localhost:5000"; // 필요하면 수정

// 🔥 공통 GET / POST 유틸 (세션 위해 credentials: "include" 필수)
async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "GET",
    credentials: "include",
  });
  return res.json();
}

async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  return res.json();
}

function Map() {
  const mapContainer = useRef(null);
  const navigate = useNavigate();

  // 위치 정보 데이터 정의
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

  // 위치 좌표 데이터
  const LOCATION_COORDS = {
    // --- 서울 ---
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

    // --- 경기 ---
    "경기도 화성시 와우리": { lat: 37.2092, lng: 126.9769 },
    "경기도 수원시 팔달구": { lat: 37.292, lng: 127.0107 },
    "경기도 수원시 장안구": { lat: 37.2951, lng: 126.9739 },
    "경기도 수원시": { lat: 37.2636, lng: 127.0286 },
  };

  // URL 쿼리 (챗봇에서 "지도로 이동"할 때 lat/lng 붙여주는 용도)
  const [searchParams] = useSearchParams();
  const urlLat = searchParams.get("lat");
  const urlLng = searchParams.get("lng");

  // URL에 lat, lng가 있으면 'all' 모드, 없으면 기본값(서울특별시)
  const initialProvince = urlLat ? "all" : PROVINCES[0];
  const initialDistrict = urlLat ? "all" : DISTRICTS_BY_PROVINCE[PROVINCES[0]][0];

  const [selectedProvince, setSelectedProvince] = useState(initialProvince);
  const [selectedDistrict, setSelectedDistrict] = useState(initialDistrict);

  // === 지도 및 필터 관련 상태 ===
  const [mapInstance, setMapInstance] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [infowindow, setInfowindow] = useState(null);
  const [activeFilter, setActiveFilter] = useState("전체");

  const [restaurants, setRestaurants] = useState([]); // 🔥 백엔드에서 받아온 식당 리스트
  const foodCategories = ["전체", "한식", "중식", "일식", "양식", "카페"];

  // 시/도 변경
  const handleProvinceChange = (e) => {
    const newProvince = e.target.value;
    setSelectedProvince(newProvince);

    if (newProvince === "all") {
      setSelectedDistrict("all");
    } else {
      const newDistricts = DISTRICTS_BY_PROVINCE[newProvince];
      if (newDistricts && newDistricts.length > 0) {
        setSelectedDistrict(newDistricts[0]);
      }
    }
  };

  // 식당 리스트 클릭 시 지도 이동 + 정보창
  const handleRestaurantClick = (restaurant) => {
    if (!mapInstance || !infowindow) return;

    const { lat, lng } = restaurant;
    const moveLatLng = new window.kakao.maps.LatLng(lat, lng);
    mapInstance.panTo(moveLatLng);

    const targetMarker = markers.find(
      (marker) =>
        marker.getPosition().getLat() === lat &&
        marker.getPosition().getLng() === lng
    );

    if (!targetMarker) return;

    const content = `
      <div style="padding:15px; width:280px; font-family: 'Malgun Gothic', sans-serif;">
        <h4 style="margin:0 0 8px 0; font-size:16px;">${restaurant.res_name}</h4>
        <p style="font-size:12px; margin:0 0 4px 0; color:#666;">
          <strong>카테고리:</strong> ${restaurant.category || "-"}
        </p>
        <p style="font-size:12px; margin:0 0 4px 0; color:#666;">
          <strong>주소:</strong> ${restaurant.address || "-"}
        </p>
        <p style="font-size:12px; margin:0 0 4px 0; color:#666;">
          <strong>평점:</strong> ${restaurant.score ?? "-"}
        </p>
      </div>
    `;
    infowindow.setContent(content);
    infowindow.open(mapInstance, targetMarker);
  };

  // 1) 카카오맵 스크립트 로드 + 지도 객체 1번만 생성
  useEffect(() => {
    const initMap = () => {
      const center = new window.kakao.maps.LatLng(37.5665, 126.978); // 기본 서울
      const options = { center, level: 4 };
      const map = new window.kakao.maps.Map(mapContainer.current, options);
      const iw = new window.kakao.maps.InfoWindow({
        removable: true,
        zIndex: 1,
      });

      setMapInstance(map);
      setInfowindow(iw);
    };

    if (window.kakao && window.kakao.maps) {
      window.kakao.maps.load(initMap);
    } else {
      const script = document.createElement("script");
      script.src =
        "//dapi.kakao.com/v2/maps/sdk.js?appkey=920ae06c68357b930c999434271d8194&autoload=false";
      script.async = true;
      script.onload = () => {
        window.kakao.maps.load(initMap);
      };
      document.head.appendChild(script);
    }
  }, []);

  // 2) 지도 준비되면 백엔드에서 마커 데이터 받아오기
  useEffect(() => {
    if (!mapInstance) return;

    async function loadData() {
      try {
        // 🔥 URL에 lat/lng 있으면 세션에 현재 위치 저장 (radius 검색 대비)
        if (urlLat && urlLng) {
          await apiPost("/location", {
            lat: parseFloat(urlLat),
            lng: parseFloat(urlLng),
          });
        }

        const data = await apiGet("/restaurants/markers");
        // data: [{res_id, res_name, lat, lng, address, category, score}, ...]
        setRestaurants(data || []);

        // 카카오 마커 생성
        const createdMarkers = (data || []).map((resto) => {
          const markerPosition = new window.kakao.maps.LatLng(
            resto.lat,
            resto.lng
          );
          const marker = new window.kakao.maps.Marker({ position: markerPosition });
          marker.category = resto.category || "기타";
          marker.setMap(mapInstance);

          // 마커 클릭 시 정보창 오픈
          window.kakao.maps.event.addListener(marker, "click", () => {
            if (!infowindow) return;

            const content = `
              <div style="padding:15px; width:280px; font-family: 'Malgun Gothic', sans-serif;">
                <h4 style="margin:0 0 8px 0; font-size:16px;">${resto.res_name}</h4>
                <p style="font-size:12px; margin:0 0 4px 0; color:#666;">
                  <strong>카테고리:</strong> ${resto.category || "-"}
                </p>
                <p style="font-size:12px; margin:0 0 4px 0; color:#666;">
                  <strong>주소:</strong> ${resto.address || "-"}
                </p>
                <p style="font-size:12px; margin:0 0 4px 0; color:#666;">
                  <strong>평점:</strong> ${resto.score ?? "-"}
                </p>
              </div>
            `;
            infowindow.setContent(content);
            infowindow.open(mapInstance, marker);
          });

          return marker;
        });

        setMarkers(createdMarkers);
      } catch (err) {
        console.error("지도/마커 로드 실패:", err);
      }
    }

    loadData();
  }, [mapInstance, urlLat, urlLng, infowindow]);

  // 3) 시/도, 구 변경 or URL 좌표에 따라 지도 중심만 이동
  useEffect(() => {
    if (!mapInstance) return;

    let targetCoords;

    if (selectedProvince === "all" && urlLat && urlLng) {
      targetCoords = {
        lat: parseFloat(urlLat),
        lng: parseFloat(urlLng),
      };
    } else {
      const currentKey = `${selectedProvince} ${selectedDistrict}`;
      targetCoords =
        LOCATION_COORDS[currentKey] || LOCATION_COORDS["서울특별시 은평구"];
    }

    const center = new window.kakao.maps.LatLng(
      targetCoords.lat,
      targetCoords.lng
    );
    mapInstance.setCenter(center);
  }, [mapInstance, selectedProvince, selectedDistrict, urlLat, urlLng]);

  // 4) 필터 변경 시 마커 표시/숨김
  useEffect(() => {
    if (!mapInstance || markers.length === 0) return;

    markers.forEach((marker) => {
      if (activeFilter === "전체" || marker.category === activeFilter) {
        marker.setMap(mapInstance);
      } else {
        marker.setMap(null);
      }
    });
  }, [activeFilter, markers, mapInstance]);

  // 현재 필터에 맞는 식당 목록
  const filteredRestaurants =
    activeFilter === "전체"
      ? restaurants
      : restaurants.filter((r) => r.category === activeFilter);

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* 왼쪽: 지도 영역 */}
      <div className="Map" style={{ width: "60%", padding: "20px" }}>
        <div
          style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}
        >
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: "8px 12px",
              marginRight: "16px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              backgroundColor: "#fff",
              cursor: "pointer",
            }}
          >
            뒤로가기
          </button>
          <h1 style={{ marginRight: "20px", fontSize: "1.5em" }}>현재 위치:</h1>

          {/* 시/도 콤보박스 */}
          <select
            value={selectedProvince}
            onChange={handleProvinceChange}
            style={{
              padding: "8px",
              marginRight: "10px",
              color: selectedProvince === "all" ? "#999" : "#000",
            }}
          >
            <option value="all">--전체--</option>
            {PROVINCES.map((province) => (
              <option key={province} value={province}>
                {province}
              </option>
            ))}
          </select>

          {/* 시/군/구 콤보박스 */}
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            style={{
              padding: "8px",
              color: selectedDistrict === "all" ? "#999" : "#000",
            }}
            disabled={selectedProvince === "all"}
          >
            {selectedProvince === "all" ? (
              <option value="all">--전체--</option>
            ) : (
              DISTRICTS_BY_PROVINCE[selectedProvince] &&
              DISTRICTS_BY_PROVINCE[selectedProvince].map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))
            )}
          </select>
        </div>

        <div
          id="kakao-map"
          ref={mapContainer}
          style={{ width: "100%", height: "calc(100% - 70px)" }}
        />
      </div>

      {/* 오른쪽: 필터 + 리스트 */}
      <div
        className="Sidebar"
        style={{ width: "40%", padding: "20px", borderLeft: "1px solid #eee" }}
      >
        {/* 검색 필터 */}
        <div className="FilterContainer" style={{ marginBottom: "20px" }}>
          {foodCategories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveFilter(category)}
              style={{
                padding: "8px 16px",
                marginRight: "8px",
                border: "1px solid #ddd",
                borderRadius: "16px",
                cursor: "pointer",
                backgroundColor:
                  activeFilter === category ? "#2c7a7b" : "#fff",
                color: activeFilter === category ? "#fff" : "#000",
              }}
            >
              {category}
            </button>
          ))}
        </div>

        {/* 식당 리스트 */}
        <div className="RestaurantList">
          {filteredRestaurants.map((restaurant) => (
            <div
              key={restaurant.res_id}
              onClick={() => handleRestaurantClick(restaurant)}
              style={{
                padding: "15px",
                borderBottom: "1px solid #f0f0f0",
                cursor: "pointer",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "1.1em" }}>
                {restaurant.res_name}
              </h3>
              <p style={{ margin: "5px 0 0", color: "#888" }}>
                {restaurant.category}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Map;