import React, { useEffect, useRef, useState } from "react";
import { useLocation, useSearchParams, useNavigate } from "react-router-dom";
import "./map.css";

const API_BASE_URL = 'http://localhost:5000';

function Map() {

    const mapContainer = useRef(null); 
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // 위치 정보 데이터
    const PROVINCES = ["서울특별시", "경기도"];
    const DISTRICTS_BY_PROVINCE = {
        "서울특별시": ["은평구"],
        "경기도": ["화성시 와우리", "수원시 팔달구", "수원시 장안구"],
    };
    const LOCATION_COORDS = {
        "서울특별시 은평구": { lat: 37.6027, lng: 126.9292 }, // 은평구청 근처
        "경기도 화성시 와우리": { lat: 37.2092, lng: 126.9769 }, // 화성시청 근처
        "경기도 수원시 팔달구": { lat: 37.2920, lng: 127.0107 }, // 수원시청 근처
        "경기도 수원시 장안구": { lat: 37.2951, lng: 126.9739 },
    };
    //const foodCategories = ["전체", "한식", "중식", "일식", "양식", "카페"];


    // --- (1) State 정의 ---
    const source = location.state?.source; // 'geolocation', 'address', 'chatbot'
    const urlLat = searchParams.get('lat');
    const urlLng = searchParams.get('lng');
    const chatbotRestaurants = location.state?.restaurants;

    // 콤보박스 state
    const initialProvince = urlLat ? "all" : PROVINCES[0];
    const initialDistrict = urlLat ? "all" : DISTRICTS_BY_PROVINCE[PROVINCES[0]][0];

    const [selectedProvince, setSelectedProvince] = useState(initialProvince);
    const [selectedDistrict, setSelectedDistrict] = useState(initialDistrict);

    // API 데이터 state
    const [isLoading, setIsLoading] = useState(false);
    const [markers, setMarkers] = useState([]); // 카카오 마커 *객체* 배열
    const [nearbyList, setNearbyList] = useState([]); // GET /nearby (리스트용)
    const [radius, setRadius] = useState(0.5); // 반경

    // 카카오맵 객체 state
    const [mapInstance, setMapInstance] = useState(null);
    const [selectedRestaurant, setSelectedRestaurant] = useState(null);

    const fetchNearbyRestaurants = async () => {
        setIsLoading(true);
        try {
            // (세션에 저장된 최신 lat/lng를 자동으로 사용함)
            const response = await fetch(`${API_BASE_URL}/restaurants/nearby?radius=${radius}`);
            if (!response.ok) throw new Error('주변 식당 로딩 실패');
            const listData = await response.json();
            setNearbyList(listData);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    /*
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
    */

    // 1. (수정) 메인 useEffect: 지도 초기화 및 *모든 마커* 로딩
    useEffect(() => {
        let targetCoords;
        if (source === 'geolocation' && urlLat && urlLng) {
            targetCoords = { lat: parseFloat(urlLat), lng: parseFloat(urlLng) };
        } else {
            const currentKey = `${selectedProvince} ${selectedDistrict}`;
            targetCoords = LOCATION_COORDS[currentKey] || LOCATION_COORDS["서울특별시 은평구"];
        }

        const fetchMarkersAndInitMap = async () => {
            setIsLoading(true);
            try {
                // GET /restaurants/markers API 호출
                const response = await fetch(`${API_BASE_URL}/restaurants/markers`);
                if (!response.ok) throw new Error('Failed to fetch markers');
                const markerData = await response.json();

                if (window.kakao && window.kakao.maps) {
                    window.kakao.maps.load(() => initMap(markerData, targetCoords));
                } else {
                    const script = document.createElement("script");
                    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=920ae06c68357b930c999434271d8194&autoload=false`;
                    script.async = true;
                    document.head.appendChild(script);
                    script.onload = () => {
                        window.kakao.maps.load(() => initMap(markerData, targetCoords));
                    };
                    
                }

                // ✨ 챗봇으로 진입한 게 아닐 때만 초기 리스트 로딩
                if (source !== 'chatbot') {
                    await fetchNearbyRestaurants();
                }

            } catch (error) {
                console.error("Error fetching markers:", error);
                if (window.kakao && window.kakao.maps) {
                    window.kakao.maps.load(() => initMap([], targetCoords));
                }
            } 
        };

        fetchMarkersAndInitMap();
    }, []); // 최초 1회만 실행

    // 2. (신규) '반경(radius)'이 바뀔 때마다 주변 식당 리스트 갱신
    useEffect(() => {
        // 맵 로딩이 완료되었고, 챗봇 모드가 아닐 때만 API 호출
        if (mapInstance && source !== 'chatbot') {
            fetchNearbyRestaurants();
        }
    }, [radius, mapInstance, source]);

    // 3. 챗봇 진입 시
    useEffect(() => {
        if (source === 'chatbot' && chatbotRestaurants) {
            console.log("챗봇 추천 데이터를 리스트에 표시합니다.");
            setNearbyList(chatbotRestaurants);
        }
    }, [source, chatbotRestaurants]);

   // ✨ (추가) 챗봇으로 진입 시 nearbyList state 업데이트
   //이상하면 이 useEffect 지우기
   
    useEffect(() => {
        if (source === 'chatbot' && chatbotRestaurants) {
            console.log("챗봇 추천 데이터를 리스트에 표시합니다.");
            setNearbyList(chatbotRestaurants);
        }
    }, [source, chatbotRestaurants]);
    

    // --- (4) 지도 초기화 및 이벤트 핸들러 ---

    // (수정) initMap: 마커 생성 + 'dragend' + API 연동 클릭 이벤트
    const initMap = (markerData, targetCoords) => {
        const center = new window.kakao.maps.LatLng(targetCoords.lat, targetCoords.lng);
        const options = { center, level: 4 };
        const map = new window.kakao.maps.Map(mapContainer.current, options);
        const iw = new window.kakao.maps.InfoWindow({ removable: true, zIndex: 1 });

        setMapInstance(map);

        // (기존) 마커 생성 및 클릭 이벤트 (GET /restaurant/detail)
        const createdMarkers = markerData.map(resto => {
            const markerPosition = new window.kakao.maps.LatLng(resto.lat, resto.lng);
            const marker = new window.kakao.maps.Marker({ position: markerPosition });
                marker.markerLat = resto.lat;
                marker.markerLng = resto.lng;
                //marker.category = resto.category; // 필요시 사용
                marker.restaurantId = resto.id;
                marker.setMap(map);

                // 마커 클릭 리스너가 /detail API를 호출하고 state를 변경
                window.kakao.maps.event.addListener(marker, 'click', async () => {
                setIsLoading(true);
                map.panTo(markerPosition);

                try {
                    const detailResponse = await fetch(`${API_BASE_URL}/restaurant/detail?lat=${marker.markerLat}&lng=${marker.markerLng}`);
                    if (!detailResponse.ok) throw new Error('Failed to fetch detail');
                    const detailData = await detailResponse.json(); // {name, address, phone...}

                    //API로 받아온 상세 정보(리뷰 포함)를 state에 저장
                    setSelectedRestaurant(detailData);

                    } catch (error) {
                        console.error("Error fetching restaurant detail:", error);
                        alert("상세 정보를 불러오는 데 실패했습니다.");
                    } finally {
                        setIsLoading(false);
                    }
                });
            return marker;
        });
        setMarkers(createdMarkers);
        window.kakao.maps.event.addListener(map, 'dragend', handleMapDragEnd);

        setIsLoading(false);// 초기 로딩 완료
    };

    //지도 드래그 종료 시
    const handleMapDragEnd = async () => {
        if (!mapInstance) return;
        const newCenter = mapInstance.getCenter();
        const lat = newCenter.getLat();
        const lng = newCenter.getLng();

        // 1. 세션 위치 업데이트
        await fetch(`${API_BASE_URL}/location`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat, lng }),
        });
        
        // 2. 콤보박스 'all'로 리셋
        setSelectedProvince("all");
        setSelectedDistrict("all");

        // 3. 새 위치 기준으로 주변 식당 리스트 갱신
        await fetchNearbyRestaurants();
    };

    // (신규) "현위치로" 버튼 클릭 시
    const handleGoToCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                const newPos = new window.kakao.maps.LatLng(lat, lng);

                // 1. 세션 위치 업데이트
                await fetch(`${API_BASE_URL}/location`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ lat, lng }),
                });

                // 2. 지도 이동
                mapInstance.panTo(newPos);
                
                // 3. 콤보박스 'all'로 리셋
                setSelectedProvince("all");
                setSelectedDistrict("all");

                // 4. 새 위치 기준으로 주변 식당 리스트 갱신
                await fetchNearbyRestaurants();
            });
        }
    };
    
    // 콤보박스 변경 시 (콤보박스 로직은 이제 지도 이동만 담당)
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
    
    // 사이드바 리스트 클릭 시
    const handleRestaurantClick = async (restaurant) => {
        if (!mapInstance || !infowindow) return;

        const { lat, lng } = restaurant; // nearbyList에서 온 데이터
        const moveLatLng = new window.kakao.maps.LatLng(lat, lng);
        mapInstance.panTo(moveLatLng);

        try {
            // ✨ 리스트 클릭 시에도 /detail API를 호출 (리뷰 데이터를 가져오기 위해)
            const detailResponse = await fetch(`${API_BASE_URL}/restaurant/detail?lat=${lat}&lng=${lng}`);
            if (!detailResponse.ok) throw new Error('Failed to fetch detail');
            const detailData = await detailResponse.json();

            // ✨ API로 받아온 상세 정보를 state에 저장
            setSelectedRestaurant(detailData);

        } catch (error) {
            console.error("Error fetching restaurant detail:", error);
            alert("상세 정보를 불러오는 데 실패했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="map-container">
            
            {/* (A) 왼쪽: 지도 및 위치 선택 영역 */}
            <div className="Map">
                <div className="map-controls">
                    <h1>현재 위치:</h1>
                    
                    {/* 시/도 콤보박스 */}
                    <select 
                        value={selectedProvince} 
                        onChange={handleProvinceChange}
                        style={{ color: selectedProvince === 'all' ? '#999' : '#000' }}
                    >
                        <option value="all">--전체--</option>
                        {PROVINCES.map((province) => (
                            <option key={province} value={province}>{province}</option>
                        ))}
                    </select>

                    {/* 시/군/구 콤보박스 */}
                    <select 
                        value={selectedDistrict} 
                        onChange={(e) => setSelectedDistrict(e.target.value)}
                        style={{ color: selectedDistrict === 'all' ? '#999' : '#000' }}
                        disabled={selectedProvince === "all"} 
                    >
                        {selectedProvince === "all" ? (
                            <option value="all">--전체--</option>
                        ) : (
                            DISTRICTS_BY_PROVINCE[selectedProvince] &&
                            DISTRICTS_BY_PROVINCE[selectedProvince].map((district) => (
                                <option key={district} value={district}>{district}</option>
                            ))
                        )}
                    </select>
                    <button onClick={handleGoToCurrentLocation} className="current-location-btn">
                        현위치
                    </button>
                </div>
                
                {/* 지도 표시 영역 */}
                <div id="kakao-map" ref={mapContainer} />
            
                {/* 하단 상세정보 패널 */}
                {selectedRestaurant && (
                    <div className="detail-panel">
                        {/* 닫기 버튼 */}
                        <button 
                            className="close-btn" 
                            onClick={() => setSelectedRestaurant(null)}
                        >
                            X
                        </button>
                        
                        {/* (A) 60% 정보 영역 */}
                        <div className="info-section">
                            <h3>{selectedRestaurant.name}</h3>
                            <p><strong>주소:</strong> {selectedRestaurant.address}</p>
                            <p><strong>전화번호:</strong> {selectedRestaurant.phone}</p>
                            <p><strong>카테고리:</strong> {selectedRestaurant.category}</p>
                        </div>

                        {/* (B) 40% 리뷰 영역 */}
                        <div className="review-section">
                            <h4>리뷰</h4>
                            {(!selectedRestaurant.reviews || selectedRestaurant.reviews.length === 0) ? (
                                // 리뷰가 없는 경우
                                <div>
                                    <p>작성된 리뷰가 없습니다.</p>
                                    <button 
                                        className="review-btn"
                                        onClick={() => navigate(`/reviews/${selectedRestaurant.id}`)}
                                    >
                                        + 리뷰 작성하기
                                    </button>
                                </div>
                            ) : (
                                // 리뷰가 있는 경우
                                <div>
                                    {selectedRestaurant.reviews.map(review => (
                                        <div key={review.id} className="review-preview">
                                            <strong>{review.author}</strong>
                                            <p>{review.content}</p>
                                        </div>
                                    ))}
                                    <button 
                                        className="review-btn"
                                        onClick={() => navigate(`/reviews/${selectedRestaurant.id}`)}
                                    >
                                        리뷰 더보기 ({selectedRestaurant.review_count}개)
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </div>

            {/* (B) 오른쪽: 필터 및 식당 리스트 영역 */}
            <div className="Sidebar">
                {source !== 'chatbot' && (
                    <div className="RadiusFilter">
                        <strong>반경 선택:</strong>
                        {[0.5, 1.0, 3.0].map(km => (
                            <button
                                key={km}
                                onClick={() => setRadius(km)}
                                className={radius === km ? 'active' : ''}
                            >
                                {km}km
                            </button>
                        ))}
                    </div>
                )}
                
                {isLoading && <div style={{ padding: '20px', textAlign: 'center' }}>로딩 중... 🌀</div>}
                
                <div className="RestaurantList">
                    {!isLoading && nearbyList.length === 0 && (
                        <div style={{ padding: '20px', color: '#888', textAlign: 'center' }}>
                            {source === 'chatbot' ? '추천된 식당이 없습니다.' : '주변 식당이 없습니다.'}
                        </div>
                    )}
                    
                    {nearbyList.map(restaurant => (
                        <div
                            key={restaurant.id} 
                            onClick={() => handleRestaurantClick(restaurant)}
                            className="list-item" 
                        >
                            <h3>{restaurant.name}</h3>
                            <p>{restaurant.category}</p>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}

export default Map;