import React, { useEffect, useRef, useState } from "react";
import { useLocation, useSearchParams, useNavigate } from "react-router-dom";
import "./map.css";

const API_BASE = "http://localhost:5001";
const API_BASE_URL = 'http://localhost:5001';

// API 헬퍼 함수
async function apiGet(path) {
    const res = await fetch(`${API_BASE}${path}`, { method: "GET", credentials: "include" });
    if (!res.ok) throw new Error(`API GET Error: ${res.status}`);
    return res.json();
}
async function apiPost(path, body) {
    const res = await fetch(`${API_BASE}${path}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`API POST Error: ${res.status}`);
    return res.json();
}

function Map() {
    const mapContainer = useRef(null);
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // --- 데이터 정의 ---
    const PROVINCES = ["서울특별시", "경기도"];
    const DISTRICTS_BY_PROVINCE = {
        "서울특별시": ["은평구", "영등포구", "용산구", "동대문구", "동작구", "광진구", "마포구", "서초구", "강동구", "성북구", "도봉구", "노원구", "강서구", "양천구", "구로구", "금천구", "송파구", "강남구"],
        "경기도": ["화성시 와우리", "수원시 팔달구", "수원시 장안구", "수원시"],
    };
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
        "경기도 화성시": { lat: 37.2092, lng: 126.9769 },
        "경기도 화성시 와우리": { lat: 37.2092, lng: 126.9769 },
        "경기도 수원시 팔달구": { lat: 37.292, lng: 127.0107 },
        "경기도 수원시 장안구": { lat: 37.2951, lng: 126.9739 },
        "경기도 수원시": { lat: 37.2636, lng: 127.0286 },
    };
    //const foodCategories = ["전체", "한식", "중식", "일식", "양식", "카페"];
    
    // --- State 관리 ---
    // 1. 네비게이션 상태 파악
    const source = location.state?.source; // 'return', 'address', 'geolocation', 'chatbot'
    const restoredMapState = location.state?.mapState; // 리뷰에서 돌아올 때 복구할 지도 상태
    const restoredId = location.state?.restoredId; // 리뷰에서 돌아올 때 다시 띄울 식당 ID
    const chatbotRestaurants = location.state?.restaurants; // 챗봇 추천 데이터

    const urlLat = searchParams.get('lat');
    const urlLng = searchParams.get('lng');

    // 2. 지도 및 데이터 상태
    const [mapInstance, setMapInstance] = useState(null);
    const [allMarkersData, setAllMarkersData] = useState([]); // 전체 마커 데이터
    const [nearbyList, setNearbyList] = useState([]); // 화면에 보이는 리스트
    const [selectedRestaurant, setSelectedRestaurant] = useState(null); // 하단 패널 데이터
    const [isLoading, setIsLoading] = useState(false);
    const [radius, setRadius] = useState(0.5);

    // 3. 콤보박스 상태 (초기값 로직 단순화)
    const [selectedProvince, setSelectedProvince] = useState(
        (source === 'address' && location.state?.province) ? location.state.province : "all"
    );
    const [selectedDistrict, setSelectedDistrict] = useState(
        (source === 'address' && location.state?.district) ? location.state.district : "all"
    );


    // --- 초기화 로직 (useEffect) ---
    useEffect(() => {
        const initializeMapPage = async () => {
            setIsLoading(true);
            try {
                // 1. 모든 마커 데이터 가져오기 & 정제
                const rawData = await apiGet("/restaurants/markers");
                setAllMarkersData(rawData);

                // 2. 지도 중심 좌표 결정 (우선순위 로직)
                let centerLat, centerLng;
                let initialLevel = 4;

                if (source === 'return' && restoredMapState) {
                    // (A) 리뷰 작성 후 복귀: 아까 그 위치
                    centerLat = restoredMapState.lat;
                    centerLng = restoredMapState.lng;
                    initialLevel = restoredMapState.level;
                } else if (source === 'geolocation' && urlLat && urlLng) {
                    // (B) 현위치 찾기
                    centerLat = parseFloat(urlLat);
                    centerLng = parseFloat(urlLng);
                } else if (source === 'address' && selectedProvince && selectedDistrict) {
                    // (C) 주소 검색
                    const key = `${selectedProvince} ${selectedDistrict}`;
                    const coords = LOCATION_COORDS[key] || LOCATION_COORDS["서울특별시 은평구"];
                    centerLat = coords.lat;
                    centerLng = coords.lng;
                } else {
                    // (D) 기본값
                    centerLat = 37.6027;
                    centerLng = 126.9292;
                }

                // 3. 지도 생성 및 마커 표시
                if (window.kakao && window.kakao.maps) {
                    window.kakao.maps.load(() => {
                        const map = createMap(centerLat, centerLng, initialLevel, rawData);
                        
                        // ✨ 복귀 유저라면 아까 보던 식당 상세창 다시 열기
                        if (source === 'return' && restoredId) {
                            loadRestaurantDetail(restoredId);
                        }
                    });
                } else {
                    // 스크립트 로드 후 실행
                    const script = document.createElement("script");
                    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=920ae06c68357b930c999434271d8194&autoload=false`;
                    script.async = true;
                    document.head.appendChild(script);
                    script.onload = () => {
                        window.kakao.maps.load(() => {
                            const map = createMap(centerLat, centerLng, initialLevel, rawData);
                            if (source === 'return' && restoredId) loadRestaurantDetail(restoredId);
                        });
                    };
                }

            } catch (error) {
                console.error("초기화 오류:", error);
            } finally {
                setIsLoading(false);
            }
        };

        initializeMapPage();
    }, []); // 최초 1회 실행


    // --- 지도 생성 함수 ---
    const createMap = (lat, lng, level, markerData) => {
        const container = mapContainer.current;
        const options = { center: new window.kakao.maps.LatLng(lat, lng), level: level };
        const map = new window.kakao.maps.Map(container, options);
        setMapInstance(map);

        // 마커 생성
        markerData.forEach(resto => {
            const position = new window.kakao.maps.LatLng(resto.lat, resto.lng);
            const marker = new window.kakao.maps.Marker({ position, map });
            
            // 마커 클릭 시 상세정보 로드
            window.kakao.maps.event.addListener(marker, 'click', () => {
                loadRestaurantDetail(resto.res_id);
                map.panTo(position); // 마커 위치로 이동
            });
        });

        // 지도 움직임 멈추면 리스트 갱신 ('idle' 이벤트)
        window.kakao.maps.event.addListener(map, 'idle', () => {
            updateListBasedOnBounds(map, markerData);
        });
        
        // 드래그 종료 시 세션 위치 저장
        window.kakao.maps.event.addListener(map, 'dragend', () => {
            const center = map.getCenter();
            apiPost("/location", { lat: center.getLat(), lng: center.getLng() });
        });

        // 초기 리스트 세팅
        updateListBasedOnBounds(map, markerData);
        
        return map;
    };

    // --- 기능 함수들 ---

    // 1. 상세 정보 로드 (ID 기준)
    const loadRestaurantDetail = async (id) => {
        setIsLoading(true);
        try {
            const detailData = await apiGet(`/restaurant/detail?id=${id}`);
            const reviewData = await apiGet(`/reviews/${id}`);
            
            setSelectedRestaurant({ 
                ...detailData, 
                reviews: reviewData, 
                review_count: reviewData.length 
            });
        } catch (error) {
            console.error("상세 정보 로드 실패:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // 2. 화면 영역 기준 리스트 필터링
    const updateListBasedOnBounds = (map, allData) => {
        if (!map || !allData) return;
        const bounds = map.getBounds();
        const visible = allData.filter(resto => {
            const pos = new window.kakao.maps.LatLng(resto.lat, resto.lng);
            return bounds.contain(pos);
        });
        setNearbyList(visible);
    };

    // 3. 리뷰 페이지로 이동 (바통 터치!)
    const handleGoToReview = () => {
        if (!mapInstance || !selectedRestaurant) return;
        const center = mapInstance.getCenter();
        const level = mapInstance.getLevel();

        navigate(`/reviews/${selectedRestaurant.res_id}`, {
            state: {
                // 현재 지도 상태를 저장해서 보냄
                mapState: { lat: center.getLat(), lng: center.getLng(), level: level },
                restoredId: selectedRestaurant.res_id // 돌아올 때 다시 열 식당 ID
            }
        });
    };

    // 4. 현위치로 이동
    const handleGoToCurrentLocation = () => {
        if (!navigator.geolocation) return alert("위치 정보 사용 불가");
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            await apiPost("/location", { lat, lng });
            
            // 강제 리로딩 효과 (URL 변경)
            navigate(`/map?lat=${lat}&lng=${lng}`, { state: { source: 'geolocation' }, replace: true });
            window.location.reload(); // ✨ 확실한 초기화를 위해 새로고침 (선택사항)
        });
    };

    // 5. 콤보박스 변경
    const handleProvinceChange = (e) => {
        const val = e.target.value;
        setSelectedProvince(val);
        if (val === "all") setSelectedDistrict("all");
        else setSelectedDistrict(DISTRICTS_BY_PROVINCE[val][0]);
    };

    // 6. 콤보박스에 따라 지도 이동
    useEffect(() => {
        if (!mapInstance || selectedProvince === "all") return;
        const key = `${selectedProvince} ${selectedDistrict}`;
        const coords = LOCATION_COORDS[key];
        if (coords) {
            mapInstance.setCenter(new window.kakao.maps.LatLng(coords.lat, coords.lng));
            setSelectedRestaurant(null); // 이동 시 패널 닫기
        }
    }, [selectedProvince, selectedDistrict, mapInstance]);

    // 7. 챗봇 데이터 감지
    useEffect(() => {
        if (source === 'chatbot' && chatbotRestaurants) {
            setNearbyList(chatbotRestaurants);
        }
    }, [source, chatbotRestaurants]);

    // 8. 반경(줌) 변경
    useEffect(() => {
        if (!mapInstance) return;
        let level = 4;
        if (radius === 0.5) level = 5;
        else if (radius === 1.0) level = 6;
        else if (radius === 3.0) level = 8;
        mapInstance.setLevel(level, { animate: true });
    }, [radius, mapInstance]);


    return (
        <div className="map-container">
            <div className="Map">
                <div className="map-controls">
                    <button onClick={() => navigate(-1)} className="back-btn">뒤로가기</button>
                    <h1>현재 위치:</h1>
                    <select value={selectedProvince} onChange={handleProvinceChange} style={{ color: selectedProvince === 'all' ? '#999' : '#000' }}>
                        <option value="all">--전체--</option>
                        {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <select value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)} style={{ color: selectedDistrict === 'all' ? '#999' : '#000' }} disabled={selectedProvince === "all"}>
                        {selectedProvince === "all" ? <option value="all">--전체--</option> : 
                            DISTRICTS_BY_PROVINCE[selectedProvince]?.map(d => <option key={d} value={d}>{d}</option>)
                        }
                    </select>
                    <button onClick={handleGoToCurrentLocation} className="current-location-btn">현위치</button>
                </div>
                
                <div id="kakao-map" ref={mapContainer} />
            
                {/* 하단 패널 */}
                {selectedRestaurant && (
                    <div className="detail-panel">
                        <button className="close-btn" onClick={() => setSelectedRestaurant(null)}>X</button>
                        <div className="info-section">
                            <h3>{selectedRestaurant.res_name}</h3>
                            <p><strong>주소:</strong> {selectedRestaurant.address || "-"}</p>
                            <p><strong>전화번호:</strong> {selectedRestaurant.phone || "-"}</p>
                            <p><strong>카테고리:</strong> {selectedRestaurant.category || "-"}</p>
                        </div>
                        <div className="review-section">
                            <h4>리뷰 ({selectedRestaurant.review_count}개)</h4>
                            {(!selectedRestaurant.reviews || selectedRestaurant.reviews.length === 0) ? (
                                <div>
                                    <p>작성된 리뷰가 없습니다.</p>
                                    {/* ✨ 리뷰 페이지 이동 시 handleGoToReview 함수 사용 */}
                                    <button className="review-btn" onClick={handleGoToCurrentLocation} >+ 리뷰 작성하기</button>
                                </div>
                            ) : (
                                <div>
                                    {selectedRestaurant.reviews.slice(0, 2).map(review => (
                                        <div key={review.id} className="review-preview">
                                            <strong>User {review.user_id}</strong>
                                            <p>{review.content}</p>
                                        </div>
                                    ))}
                                    {/* ✨ 리뷰 페이지 이동 시 handleGoToReview 함수 사용 */}
                                    <button className="review-btn" onClick={handleGoToReview}>리뷰 더보기</button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="Sidebar">
                {source !== 'chatbot' && (
                    <div className="RadiusFilter">
                        <strong>반경(줌) 선택:</strong>
                        {[0.5, 1.0, 3.0].map(km => (
                            <button key={km} onClick={() => setRadius(km)} className={radius === km ? 'active' : ''}>{km}km</button>
                        ))}
                    </div>
                )}
                
                {isLoading && <div style={{ padding: '20px', textAlign: 'center' }}>로딩 중... 🌀</div>}
                
                <div className="RestaurantList">
                    {!isLoading && nearbyList.length === 0 && (
                        <div style={{ padding: '20px', color: '#888', textAlign: 'center' }}>
                            {source === 'chatbot' ? '추천된 식당이 없습니다.' : '이 화면 안에 식당이 없습니다.'}
                        </div>
                    )}
                    
                    {nearbyList.map(restaurant => (
                        <div
                            key={restaurant.res_id} 
                            onClick={() => {
                                loadRestaurantDetail(restaurant.res_id);
                                // 리스트 클릭 시 해당 위치로 이동
                                const moveLatLng = new window.kakao.maps.LatLng(restaurant.lat, restaurant.lng);
                                mapInstance.panTo(moveLatLng);
                            }}
                            className="list-item" 
                        >
                            <h3>{restaurant.res_name}</h3> 
                            <p>{restaurant.category}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Map;