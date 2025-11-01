import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import "./main.css";

function Map() {

    const mapContainer = useRef(null); 

    // 위치 정보 데이터 정의
    const PROVINCES = ["서울특별시", "경기도"];
    const DISTRICTS_BY_PROVINCE = {
        "서울특별시": ["은평구"],
        "경기도": ["화성시 와우리", "수원시 팔달구", "수원시 장안구"],
    };

    // 위치 좌표 데이터 (은평구청과 화성시청 좌표)
    const LOCATION_COORDS = {
        "서울특별시 은평구": { lat: 37.6027, lng: 126.9292 }, // 은평구청 근처
        "경기도 화성시 와우리": { lat: 37.2092, lng: 126.9769 }, // 화성시청 근처
        "경기도 수원시 팔달구": { lat: 37.2920, lng: 127.0107 }, // 수원시청 근처
        "경기도 수원시 장안구": { lat: 37.3025, lng: 127.0169 },
    };

    // useSearchParams 훅을 state 초기화 *전에* 호출
    const [searchParams] = useSearchParams();
    const urlLat = searchParams.get('lat');
    const urlLng = searchParams.get('lng');

    // URL에 lat, lng가 있으면 'all' 모드, 없으면 기본값(서울특별시)
    const initialProvince = urlLat ? "all" : PROVINCES[0];
    const initialDistrict = urlLat ? "all" : DISTRICTS_BY_PROVINCE[PROVINCES[0]][0];

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
        { id: 2, name: "카페 온더웨이", category: "카페", lat: 37.6015, lng: 126.9080, address: "서울 은평구 통일로 83길", phone: "02-388-5678" },
        { id: 3, name: "은평면옥", category: "한식", lat: 37.6050, lng: 126.9210, address: "서울 은평구 불광로 10", phone: "02-123-4567" },
        { id: 4, name: "화성 짬뽕", category: "중식", lat: 37.2105, lng: 126.9758, address: "경기 화성시 봉담읍 와우리로 45", phone: "031-765-4321" },
    { id: 5, name: "라뜰리에", category: "양식", lat: 37.2118, lng: 126.9751, address: "경기 화성시 봉담읍 와우리로 78", phone: "031-876-5432" },
    { id: 6, name: "봉담 한우마을", category: "한식", lat: 37.2130, lng: 126.9745, address: "경기 화성시 봉담읍 와우리로 102", phone: "031-234-5678" },
    { id: 7, name: "카페 드 봉담", category: "카페", lat: 37.2155, lng: 126.9738, address: "경기 화성시 봉담읍 와우리로 150", phone: "031-345-6789" },
    ];

    // 이벤트 핸들러
    const handleProvinceChange = (e) => {
        const newProvince = e.target.value;
        setSelectedProvince(newProvince);
        
        // 'all'을 선택하면 두 번째 콤보박스도 'all'로 설정
        if (newProvince === "all") {
            setSelectedDistrict("all");
        } else {
            // 다른 시/도를 선택하면 해당 지역의 첫 번째 구/군으로 설정
            const newDistricts = DISTRICTS_BY_PROVINCE[newProvince];
            if (newDistricts && newDistricts.length > 0) {
                setSelectedDistrict(newDistricts[0]);
            }
        }
    };

    // 식당 리스트 클릭 시 지도 이동 및 정보창 표시 핸들러
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

    // 지도 초기화 및 마커 생성
    useEffect(() => {
        let targetCoords; 
        // 지도 중심 좌표 결정 로직
        if (selectedProvince === "all" && urlLat && urlLng) {
            // 'all' 모드(Geolocation으로 진입)일 경우 URL의 좌표 사용
            targetCoords = { lat: parseFloat(urlLat), lng: parseFloat(urlLng) };
        } else {
            // 'all' 모드가 아니거나(사용자가 콤보박스 조작) URL 좌표가 없는 경우
            const currentKey = `${selectedProvince} ${selectedDistrict}`;
            // 'all all' 같은 유효하지 않은 키일 경우 기본값(은평구) 사용
            targetCoords = LOCATION_COORDS[currentKey] || LOCATION_COORDS["서울특별시 은평구"];
        }

        // 지도를 초기화하고 표시하는 함수
        const initMap = () => {
            const center = new window.kakao.maps.LatLng(targetCoords.lat, targetCoords.lng);
            const options = { center, level: 4 };
            const map = new window.kakao.maps.Map(mapContainer.current, options);

            const iw = new window.kakao.maps.InfoWindow({ removable: true, zIndex: 1 });
            setInfowindow(iw);

            setMapInstance(map);

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

    // 필터 변경 시 마커 표시/숨김 처리
    useEffect(() => {
        
        if (!mapInstance || markers.length === 0) return;

        markers.forEach(marker => {
            // "전체" 필터가 선택되었거나, 마커의 카테고리가 현재 활성 필터와 일치하는 경우
            if (activeFilter === "전체" || marker.category === activeFilter) {
                marker.setMap(mapInstance);
            } else {
                marker.setMap(null);
            }
        });

    }, [activeFilter, markers, mapInstance]);

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
                    {/* 시/도 콤보박스 */}
                    <select 
                        value={selectedProvince} 
                        onChange={handleProvinceChange}
                        style={{ 
                            padding: '8px', 
                            marginRight: '10px',
                            // 'all' 모드일 때 연한 회색 글씨로 표시
                            color: selectedProvince === 'all' ? '#999' : '#000'
                        }}
                    >
                        {/* 'all' 옵션을 기본으로 추가 */}
                        <option value="all">--전체--</option>
                        
                        {PROVINCES.map((province) => (
                            <option key={province} value={province}>
                                {province}
                            </option>
                        ))}
                    </select>

                    {/*시/군/구 콤보박스 */}
                    <select 
                        value={selectedDistrict} 
                        onChange={(e) => setSelectedDistrict(e.target.value)}
                        style={{ 
                            padding: '8px',
                            // 'all' 모드일 때 연한 회색 글씨로 표시
                            color: selectedDistrict === 'all' ? '#999' : '#000'
                        }}
                        // 'all' 모드일 때는 두 번째 콤보박스를 비활성화
                        disabled={selectedProvince === "all"} 
                    >
                        {/* 'all' 모드일 때는 '--전체--'만, 아닐 때는 지역 목록 표시 */}
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