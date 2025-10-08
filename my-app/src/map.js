import React, { useEffect, useRef, useState } from "react";
import "./main.css";

// 카카오맵 API 로딩이 완료되면 전역 변수 'kakao'가 생깁니다.
// TypeScript를 사용한다면 'declare var kakao: any;' 선언이 필요할 수 있습니다.
//const { kakao } = window;

function Map() {
    // 1. 지도를 담을 DOM 요소의 ref를 만듭니다.
    const mapContainer = useRef(null); 

    // === [1. 위치 정보 데이터 정의] ===
    const PROVINCES = ["서울특별시", "경기도"];
    const DISTRICTS_BY_PROVINCE = {
        "서울특별시": ["은평구"],
        "경기도": ["화성시 와우리"],
    };

    // ★★★★ 위치 좌표 데이터 (은평구청과 화성시청 좌표) ★★★★
    const LOCATION_COORDS = {
        "서울특별시 은평구": { lat: 37.6027, lng: 126.9292 }, // 은평구청 근처
        "경기도 화성시 와우리": { lat: 37.1994, lng: 126.8317 }, // 화성시청 근처
    };

    // === [2. 상태(State) 정의] ===
    // 초기값은 "서울특별시"와 해당 지역의 첫 번째 구인 "은평구"로 설정합니다.
    const [selectedProvince, setSelectedProvince] = useState(PROVINCES[0]);
    const [selectedDistrict, setSelectedDistrict] = useState(DISTRICTS_BY_PROVINCE[PROVINCES[0]][0]);

    // === [3. 이벤트 핸들러] ===
    const handleProvinceChange = (e) => {
    const newProvince = e.target.value;
    setSelectedProvince(newProvince);
    
    // 시/도 변경 시, 해당 시/도의 첫 번째 구/군/읍/면/동으로 District도 자동 업데이트
    const newDistricts = DISTRICTS_BY_PROVINCE[newProvince];
    if (newDistricts && newDistricts.length > 0) {
        setSelectedDistrict(newDistricts[0]);
    }
  };

    // === [4. useEffect: 지도 초기화 및 업데이트] ===
    useEffect(() => {
    // 현재 선택된 위치의 좌표를 가져옵니다.
    const currentKey = `${selectedProvince} ${selectedDistrict}`;
    const targetCoords = LOCATION_COORDS[currentKey] || { lat: 33.450701, lng: 126.570667 }; // 기본값은 제주도로 설정

    // 지도를 초기화하고 표시하는 함수
    const initMap = () => {
      const kakaoMaps = window.kakao.maps; 
      
      // 선택된 좌표로 지도의 중심을 설정
      const center = new kakaoMaps.LatLng(targetCoords.lat, targetCoords.lng); 
      
      const options = {
        center: center,
        level: 3,
      };

      // 지도 객체를 생성합니다.
      const map = new kakaoMaps.Map(mapContainer.current, options);
      
      // 마커를 생성하고 지도 중심에 표시
      const marker = new kakaoMaps.Marker({
          position: center
      });
      marker.setMap(map);
    };

    // 카카오맵 스크립트 로드 처리
    if (window.kakao && window.kakao.maps) {
      window.kakao.maps.load(initMap); 
    } else {
      const script = document.createElement("script");
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=920ae06c68357b930c999434271d8194&autoload=false`;
      script.async = true;

      script.onload = () => {
        window.kakao.maps.load(initMap); 
      };
      
      document.head.appendChild(script);
    }
    
  }, [selectedProvince, selectedDistrict]); // 👈 ★★★ 종속성 추가: 이 값들이 변하면 Hook이 다시 실행됩니다.

    return (
        <div className="Map">
        {/* 4. [수정] 헤더 및 콤보박스 표시 영역 */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
            <h1 style={{ marginRight: '20px', fontSize: '1.5em' }}>현재 위치:</h1>
            
            {/* 시/도 콤보박스 */}
            <select 
                value={selectedProvince} 
                onChange={handleProvinceChange} // 👈 시/도 변경 시 구/군도 업데이트
                style={{ padding: '8px', marginRight: '10px' }}
            >
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
                style={{ padding: '8px' }}
            >
                {/* 현재 선택된 시/도에 맞는 구/군 목록만 렌더링 */}
                {DISTRICTS_BY_PROVINCE[selectedProvince].map((district) => (
                    <option key={district} value={district}>
                        {district}
                    </option>
                ))}
            </select>
        </div>
        {/* 4. 지도를 표시할 영역 (ref와 style 지정 필수) */}
        {/* 지도 영역 */}
        <div 
            id="kakao-map" 
            ref={mapContainer} 
            style={{ width: '60%', height: '500px' }} 
        />
        </div>
    );
}

export default Map;