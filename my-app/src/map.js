import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import "./main.css";

// 카카오맵 API 로딩이 완료되면 전역 변수 'kakao'가 생깁니다.
// TypeScript를 사용한다면 'declare var kakao: any;' 선언이 필요할 수 있습니다.
//const { kakao } = window;

function Map() {

    const mapContainer = useRef(null); 

    // 위치 정보 데이터 정의
    const PROVINCES = ["서울특별시", "경기도"];
    const DISTRICTS_BY_PROVINCE = {
        "서울특별시": ["은평구"],
        "경기도": ["화성시 와우리"],
    };

    // 위치 좌표 데이터 (은평구청과 화성시청 좌표)
    const LOCATION_COORDS = {
        "서울특별시 은평구": { lat: 37.6027, lng: 126.9292 }, // 은평구청 근처
        "경기도 화성시 와우리": { lat: 37.1994, lng: 126.8317 }, // 화성시청 근처
    };

    // useSearchParams 훅을 state 초기화 *전에* 호출
    const [searchParams] = useSearchParams();
    const urlLat = searchParams.get('lat');
    const urlLng = searchParams.get('lng');

    // URL 파라미터 유무에 따라 콤보박스 초기 상태 결정
    // 'current'는 "현위치 모드"를 의미하는 특수 값입니다.
    const initialProvince = urlLat ? "current" : PROVINCES[0];
    const initialDistrict = urlLat ? "" : DISTRICTS_BY_PROVINCE[PROVINCES[0]][0];

    // === [상태(State) 정의] ===
    // 초기값은 "서울특별시"와 해당 지역의 첫 번째 구인 "은평구"로 설정합니다.
    //const [selectedProvince, setSelectedProvince] = useState(PROVINCES[0]);
    //const [selectedDistrict, setSelectedDistrict] = useState(DISTRICTS_BY_PROVINCE[PROVINCES[0]][0]);
    
    //useState의 초기값을 위에서 정한 initial 값으로 변경
    const [selectedProvince, setSelectedProvince] = useState(initialProvince);
    const [selectedDistrict, setSelectedDistrict] = useState(initialDistrict);

    // === 지도 및 필터 관련 상태 ===
    const [mapInstance, setMapInstance] = useState(null); // 지도 객체를 저장할 state
    const [markers, setMarkers] = useState([]); // 생성된 마커들을 저장할 state
    const [activeFilter, setActiveFilter] = useState("전체"); // 활성화된 필터 버튼 state
    const [infowindow, setInfowindow] = useState(null); // 정보창(infowindow) 객체를 관리할 state
    
    const foodCategories = ["전체", "한식", "중식", "일식", "양식", "카페"];

    
    // === 식당 목업(Mock) 데이터 ===
    const MOCK_RESTAURANTS = [
        { id: 1, name: "오레노라멘 은평점", category: "일식", lat: 37.6033, lng: 126.9325, address: "서울 은평구 연서로 214", phone: "02-356-1234" },
        { id: 2, name: "카페 온더웨이", category: "카페", lat: 37.6015, lng: 126.9080, address: "서울 은평구 통일로 83길", phone: "02-388-5678" },        // (데이터베이스 연동 후에는 이 부분이 DB 데이터로 대체됩니다)
        { id: 3, name: "은평면옥", category: "한식", lat: 37.6050, lng: 126.9210, address: "서울 은평구 불광로 10", phone: "02-123-4567" },
    ];

    // 이벤트 핸들러
    const handleProvinceChange = (e) => {
        const newProvince = e.target.value;
        setSelectedProvince(newProvince);
        
        // '현위치' 모드가 아닐 때만 두 번째 콤보박스 값을 변경
        if (newProvince === "current") {
            setSelectedDistrict("");
        } else {
            const newDistricts = DISTRICTS_BY_PROVINCE[newProvince]; // 시/도 변경 시, 해당 시/도의 첫 번째 구/군/읍/면/동으로 District도 자동 업데이트
            if (newDistricts && newDistricts.length > 0) {
                setSelectedDistrict(newDistricts[0]);
            }
        }

    };

    // === [새로 추가된 부분 3] 식당 리스트 클릭 시 지도 이동 및 정보창 표시 핸들러 ===
    const handleRestaurantClick = (restaurant) => {
        if (!mapInstance || !infowindow) return;

        const { lat, lng } = restaurant;
        const moveLatLng = new window.kakao.maps.LatLng(lat, lng);

        // 지도의 중심을 부드럽게 이동시킵니다.
        mapInstance.panTo(moveLatLng);

        // 해당 식당의 마커를 찾습니다.
        const targetMarker = markers.find(marker =>
            marker.getPosition().getLat() === lat && marker.getPosition().getLng() === lng
        );

        if (targetMarker) {
            const content = `
                <div style="padding:15px; width:280px; font-family: 'Malgun Gothic', sans-serif;">
                    <h4 style="margin:0 0 8px 0; font-size:16px;">${restaurant.name}</h4>
                    <p style="font-size:12px; margin:0 0 4px 0; color:#666;"><strong>카테고리:</strong> ${restaurant.category}</p>
                    <p style="font-size:12px; margin:0 0 4px 0; color:#666;"><strong>주소:</strong> ${restaurant.address}</p>
                    <p style="font-size:12px; margin:0; color:#666;"><strong>전화번호:</strong> ${restaurant.phone}</p>
                </div>
            `;
            infowindow.setContent(content);
            infowindow.open(mapInstance, targetMarker);
        }
    };



    // === [useEffect: 지도 초기화 및 업데이트] ===
    useEffect(() => {
        let targetCoords; // 지도의 중심이 될 좌표

        // ✨ 6. state 값을 기준으로 분기 처리 (state가 이미 URL을 반영함)
        if (selectedProvince === "current" && urlLat && urlLng) {
            // "현 위치 찾기" 모드
            targetCoords = { lat: parseFloat(urlLat), lng: parseFloat(urlLng) };
        } else {
            // "위치 지정" 모드
            const currentKey = `${selectedProvince} ${selectedDistrict}`;
            targetCoords = LOCATION_COORDS[currentKey] || { lat: 33.450701, lng: 126.570667 };
        }

        // 지도를 초기화하고 표시하는 함수
        const initMap = () => {
            const center = new window.kakao.maps.LatLng(targetCoords.lat, targetCoords.lng);
            const options = { center, level: 4 };
            const map = new window.kakao.maps.Map(mapContainer.current, options);

            // 정보창 인스턴스를 한 번만 생성하고 state에 저장
            const iw = new window.kakao.maps.InfoWindow({ removable: true, zIndex: 1 });
            setInfowindow(iw);

            // 지도 객체를 state에 저장
            setMapInstance(map);

            // "현 위치" 모드일 때만 빨간 점 마커를 추가
            if (selectedProvince === "current" && urlLat && urlLng) {
                // 마커 이미지를 생성합니다. (빨간 점 모양)
                const imageSrc = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png'; 
                const imageSize = new window.kakao.maps.Size(64, 69);
                const imageOption = {offset: new window.kakao.maps.Point(27, 69)};
                const markerImage = new window.kakao.maps.MarkerImage(imageSrc, imageSize, imageOption);
                
                // 마커를 생성하고 지도에 표시합니다.
                new window.kakao.maps.Marker({
                    map: map,
                    position: center, // 마커의 위치는 지도의 중심 (내 위치)
                    image: markerImage // 커스텀 마커 이미지 설정
                });
                
            }

            // 목업 데이터를 기반으로 여러 마커를 생성
            // 마커 생성 시, 각 마커에 'click' 이벤트 리스너
            const createdMarkers = MOCK_RESTAURANTS.map(resto => {
                const markerPosition = new window.kakao.maps.LatLng(resto.lat, resto.lng);
                const marker = new window.kakao.maps.Marker({ position: markerPosition });
                marker.category = resto.category; // 마커에 카테고리 정보 추가
                marker.setMap(map);

                // 마커에 클릭 이벤트를 등록합니다.
                window.kakao.maps.event.addListener(marker, 'click', function() {
                    const content = `
                        <div style="padding:15px; width:280px; font-family: 'Malgun Gothic', sans-serif;">
                            <h4 style="margin:0 0 8px 0; font-size:16px;">${resto.name}</h4>
                            <p style="font-size:12px; margin:0 0 4px 0; color:#666;"><strong>카테고리:</strong> ${resto.category}</p>
                            <p style="font-size:12px; margin:0 0 4px 0; color:#666;"><strong>주소:</strong> ${resto.address}</p>
                            <p style="font-size:12px; margin:0; color:#666;"><strong>전화번호:</strong> ${resto.phone}</p>
                        </div>
                    `;
                    iw.setContent(content);
                    iw.open(map, marker);
                });
                return marker;
            });
        // 생성된 마커들을 state에 저장
        setMarkers(createdMarkers);
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
    
    }, [selectedProvince, selectedDistrict, urlLat, urlLng]);

    // 2. [새로운 useEffect 2: 필터 변경 시 마커 표시/숨김 처리] ===
    useEffect(() => {
        // mapInstance나 markers가 아직 준비되지 않았으면 아무것도 하지 않음
        if (!mapInstance || markers.length === 0) return;

        // 모든 마커를 순회합니다.
        markers.forEach(marker => {
            // "전체" 필터가 선택되었거나, 마커의 카테고리가 현재 활성 필터와 일치하는 경우
            if (activeFilter === "전체" || marker.category === activeFilter) {
                // 마커를 지도에 표시합니다.
                marker.setMap(mapInstance);
            } else {
                // 그렇지 않은 경우, 마커를 지도에서 숨깁니다.
                marker.setMap(null);
            }
        });

    }, [activeFilter, markers, mapInstance]); // activeFilter가 바뀔 때마다 이 훅이 실행됩니다.

    // === 현재 필터에 맞는 식당 목록 ===
    const filteredRestaurants = activeFilter === "전체"
        ? MOCK_RESTAURANTS
        : MOCK_RESTAURANTS.filter(r => r.category === activeFilter);

    return (
        // === 전체 레이아웃 구조 (flex) ===
        <div style={{ display: 'flex', height: '100vh' }}>

            {/* 왼쪽: 지도 및 위치 선택 영역 */}
            <div className="Map" style={{ width: '60%', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                    <h1 style={{ marginRight: '20px', fontSize: '1.5em' }}>현재 위치:</h1>
                    {/* 시/도 콤보박스 수정 */}
                    <select 
                        value={selectedProvince} 
                        onChange={handleProvinceChange}
                        style={{ padding: '8px', marginRight: '10px' }}
                    >
                        {/* "현위치 모드"일 때만 "현위치" 옵션을 동적으로 추가 */}
                        {urlLat && <option value="current">현위치</option>}
                        
                        {PROVINCES.map((province) => (
                            <option key={province} value={province}>
                                {province}
                            </option>
                        ))}
                    </select>

                    {/* 시/군/구 콤보박스 수정 */}
                    <select 
                        value={selectedDistrict} 
                        onChange={(e) => setSelectedDistrict(e.target.value)}
                        style={{ padding: '8px' }}
                        // "현위치 모드"일 때는 두 번째 콤보박스를 비활성화
                        disabled={selectedProvince === "current"} 
                    >
                        {/* "현위치 모드"가 아닐 때만 지역 목록을 보여줌 */}
                        {selectedProvince !== "current" && DISTRICTS_BY_PROVINCE[selectedProvince] &&
                            DISTRICTS_BY_PROVINCE[selectedProvince].map((district) => (
                            <option key={district} value={district}>
                                {district}
                            </option>
                        ))}
                    </select>
                </div>
                <div id="kakao-map" ref={mapContainer} style={{ width: '100%', height: 'calc(100% - 70px)' }} />
            </div>

            {/* 오른쪽: 필터 및 식당 리스트 영역 */}
            <div className="Sidebar" style={{ width: '40%', padding: '20px', borderLeft: '1px solid #eee' }}>
                {/* 검색 필터 */}
                <div className="FilterContainer" style={{ marginBottom: '20px' }}>
                    {foodCategories.map(category => (
                        <button
                            key={category}
                            onClick={() => setActiveFilter(category)}
                            style={{
                                padding: '8px 16px',
                                marginRight: '8px',
                                border: '1px solid #ddd',
                                borderRadius: '16px',
                                cursor: 'pointer',
                                backgroundColor: activeFilter === category ? '#2c7a7b' : '#fff',
                                color: activeFilter === category ? '#fff' : '#000',
                            }}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                {/* 식당 리스트 */}
                <div className="RestaurantList">
                    {filteredRestaurants.map(restaurant => (
                        <div
                            key={restaurant.id}
                            onClick={() => handleRestaurantClick(restaurant)}
                            style={{ padding: '15px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }}
                        >
                            <h3 style={{ margin: 0, fontSize: '1.1em' }}>{restaurant.name}</h3>
                            <p style={{ margin: '5px 0 0', color: '#888' }}>{restaurant.category}</p>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}

export default Map;