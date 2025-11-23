import React, { useEffect, useRef, useState } from "react";
import { useLocation, useSearchParams, useNavigate } from "react-router-dom";
import "./map.css";

const API_BASE = "http://localhost:5001"; 
async function apiGet(path) {
    const res = await fetch(`${API_BASE}${path}`, {
        method: "GET",
        credentials: "include", // 세션 유지를 위해 필수
    });
    if (!res.ok) throw new Error(`API GET Error: ${res.status}`);
    return res.json();
}
async function apiPost(path, body) {
    const res = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // 세션 유지를 위해 필수
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

    // 위치 정보 데이터
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
    "경기도 화성시": { lat: 37.2092, lng: 126.9769 },
    "경기도 화성시 와우리": { lat: 37.2092, lng: 126.9769 },
    "경기도 수원시 팔달구": { lat: 37.292, lng: 127.0107 },
    "경기도 수원시 장안구": { lat: 37.2951, lng: 126.9739 },
    "경기도 수원시": { lat: 37.2636, lng: 127.0286 },
  };
    //const foodCategories = ["전체", "한식", "중식", "일식", "양식", "카페"];


    // --- State 정의 ---
    const source = location.state?.source; // 'geolocation', 'address', 'chatbot'
    const urlLat = searchParams.get('lat');
    const urlLng = searchParams.get('lng');
    const chatbotRestaurants = location.state?.restaurants;

    // 콤보박스 state
    const initialProvince = (source === 'address' && location.state?.province) 
        ? location.state.province 
        : (urlLat ? "all" : PROVINCES[0]);

    const initialDistrict = (source === 'address' && location.state?.district) 
        ? location.state.district 
        : (urlLat ? "all" : DISTRICTS_BY_PROVINCE[PROVINCES[0]][0]);

    const [selectedProvince, setSelectedProvince] = useState(initialProvince);
    const [selectedDistrict, setSelectedDistrict] = useState(initialDistrict);

    // API 데이터 state
    const [isLoading, setIsLoading] = useState(false);
    const [allMarkersData, setAllMarkersData] = useState([]); //모든 식당 데이터 원본
    const [nearbyList, setNearbyList] = useState([]); //현재 화면에 보이는 식당 리스트
    const [radius, setRadius] = useState(0.5);

    // 카카오맵 객체 state
    const [mapInstance, setMapInstance] = useState(null);
    const [selectedRestaurant, setSelectedRestaurant] = useState(null);
    const [markers, setMarkers] = useState([]); // 카카오 마커 *객체* 배열

    const fetchNearbyRestaurants = async () => {
        setIsLoading(true);
        try {
            // 1. 현재 지도의 중심 좌표를 가져옵니다.(기준점)
            // 만약 mapInstance가 아직 없다면 urlLat, urlLng를 씁니다.
            let centerLat = urlLat;
            let centerLng = urlLng;

            if (mapInstance) {
                const center = mapInstance.getCenter();
                centerLat = center.getLat();
                centerLng = center.getLng();
            }

            if (!centerLat || !centerLng) return; // 좌표 없으면 중단

            // 2. URL에 lat, lng를 같이 붙여서 보냅니다.
            const listData = await apiGet(`/restaurants/nearby?radius=${radius}&lat=${centerLat}&lng=${centerLng}`);            
            setNearbyList(listData);

        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };


    // 메인 useEffect: 지도 초기화 및 *모든 마커* 로딩
    useEffect(() => {
        console.log("현재 소스:", source); // 'address'가 떠야 함
        console.log("받은 지역:", selectedProvince, selectedDistrict); // '경기도', '화성시'가 떠야 함
        console.log("URL 좌표:", urlLat, urlLng);

        let targetCoords;
        if (source === 'geolocation' && urlLat && urlLng) {
            targetCoords = { lat: parseFloat(urlLat), lng: parseFloat(urlLng) };
        }
        else if (source === 'address') {
             // ✨ 여기가 실행되어야 합니다.
             const currentKey = `${selectedProvince} ${selectedDistrict}`;
             console.log("찾으려는 키:", currentKey); // "경기도 화성시"가 찍히는지 확인
             
             targetCoords = LOCATION_COORDS[currentKey];
             
             if (!targetCoords) {
                 console.warn("좌표를 찾을 수 없어 기본값(은평구)을 사용합니다.");
                 targetCoords = LOCATION_COORDS["서울특별시 은평구"];
             }
        }
        else {
            const currentKey = `${selectedProvince} ${selectedDistrict}`;
            targetCoords = LOCATION_COORDS[currentKey] || LOCATION_COORDS["서울특별시 은평구"];
        }
        
        const fetchMarkersAndInitMap = async () => {
            setIsLoading(true);
            try {
                const markerData = await apiGet("/restaurants/markers");
                //setAllMarkersData(markerData);

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
                
                //챗봇으로 진입한 게 아닐 때만 초기 리스트 로딩
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

    // '반경(radius)'이 바뀔 때마다 주변 식당 리스트 갱신
    /*
    useEffect(() => {
        // 맵 로딩이 완료되었고, 챗봇 모드가 아닐 때만 API 호출
        if (mapInstance && source !== 'chatbot') {
            fetchNearbyRestaurants();
        }
    }, [radius, mapInstance, source]);
    */
   // 반경(radius)이 바뀌면 지도 줌 레벨(확대/축소) 변경
    useEffect(() => {
        fetchNearbyRestaurants();
        if (!mapInstance) return;
        let level = 4;
        if (radius === 0.5) level = 5;
        else if (radius === 1.0) level = 6;
        else if (radius === 3.0) level = 8;
        mapInstance.setLevel(level, { animate: true });
        
    }, [radius, mapInstance]);
    

    // 3. 챗봇 진입 시
    useEffect(() => {
        if (source === 'chatbot' && chatbotRestaurants) {
            console.log("챗봇 추천 데이터를 리스트에 표시합니다.");
            setNearbyList(chatbotRestaurants);
        }
    }, [source, chatbotRestaurants]);

    // 콤보박스 변경 시 지도 이동 (지도 중심 이동 + 하단 패널 닫기)
    useEffect(() => {
        if (!mapInstance) return;

        let targetCoords;
        if (selectedProvince === "all" && urlLat && urlLng) {
            targetCoords = { lat: parseFloat(urlLat), lng: parseFloat(urlLng) };
        } else {
            const currentKey = `${selectedProvince} ${selectedDistrict}`;
            targetCoords = LOCATION_COORDS[currentKey] || LOCATION_COORDS["서울특별시 은평구"];
        }
        
        const center = new window.kakao.maps.LatLng(targetCoords.lat, targetCoords.lng);
        mapInstance.setCenter(center);
        
        // 콤보박스 조작 시, 열려있던 하단 패널을 닫기
        setSelectedRestaurant(null); 

        fetchNearbyRestaurants();

    }, [mapInstance, selectedProvince, selectedDistrict, urlLat, urlLng]);

    

    // --- 지도 초기화 및 이벤트 핸들러 ---

    const initMap = (markerData, targetCoords) => {
        const center = new window.kakao.maps.LatLng(targetCoords.lat, targetCoords.lng);
        const options = { center, level: 4 };
        const map = new window.kakao.maps.Map(mapContainer.current, options);
        //const iw = new window.kakao.maps.InfoWindow({ removable: true, zIndex: 1 });
        setMapInstance(map);

        // (기존) 마커 생성 및 클릭 이벤트 (GET /restaurant/detail)
        const createdMarkers = markerData.map(resto => {
            const markerPosition = new window.kakao.maps.LatLng(resto.lat, resto.lng);
            const marker = new window.kakao.maps.Marker({ position: markerPosition });
                marker.markerLat = resto.lat; //얘네 없어짐
                marker.markerLng = resto.lng; //얘네 없어짐
                //marker.category = resto.category; // 필요시 사용
                marker.restaurantId = resto.res_id;
                marker.setMap(map);

                // 마커 클릭 리스너가 /detail API를 호출하고 state를 변경
                window.kakao.maps.event.addListener(marker, 'click', async () => {
                setIsLoading(true);
                map.panTo(markerPosition);

                console.log("👉 클릭한 식당 ID:", marker.restaurantId);

                try {
                    const detailData = await apiGet(`/restaurant/detail?id=${marker.restaurantId}`);
                    /*
                    const reviewRes = await apiGet(`/reviews/restaurant${detailData.res_id}`);
                    if (reviewRes.ok) {
                        const rjson = await reviewRes.json();
                        detailData.reviews = rjson.items || [];
                        detailData.review_count = (rjson.items || []).length;
                    }*/
                    //setSelectedRestaurant(detailData);
                    const reviewData = await apiGet(`/reviews/${marker.restaurantId}`);
                    
                    setSelectedRestaurant({ 
                        detailData, 
                        reviews: reviewData, 
                        review_count: reviewData.length 
                    });

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

        //window.kakao.maps.event.addListener(map, 'dragend', handleMapDragEnd);
        // ✨ 드래그 종료 시 -> 위치 저장 + 리스트 갱신 (서버 요청)
        window.kakao.maps.event.addListener(map, 'dragend', async () => {
             const center = map.getCenter();
             await apiPost("/location", { lat: center.getLat(), lng: center.getLng() });
             await fetchNearbyRestaurants();
        });

        setIsLoading(false);// 초기 로딩 완료
    };

    // 리스트 갱신 코드 (지도 이동 후) 
    const handleMapDragEnd = async () => {
        if (!mapInstance) return;
        const newCenter = mapInstance.getCenter();
        const lat = newCenter.getLat();
        const lng = newCenter.getLng();

        await apiPost("/location", { lat, lng });
        
        setSelectedProvince("all");
        setSelectedDistrict("all");

        await fetchNearbyRestaurants();
    };

    // "현위치로" 버튼 클릭 시
    const handleGoToCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert("위치 정보를 사용할 수 없습니다.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                try {
                    // 1. 서버 세션에 현위치 업데이트 (apiPost 함수 사용)
                    await apiPost("/location", { lat, lng });

                    // 2. ✨ [핵심] URL을 변경하여 'Geolocation 모드'로 강제 전환
                    // navigate를 쓰면 useSearchParams와 useLocation이 갱신되면서
                    // useEffect들이 알아서 지도를 이동시키고 식당 리스트를 새로 불러옵니다.
                    navigate(`/map?lat=${lat}&lng=${lng}`, { 
                        state: { source: 'geolocation' }, // 소스를 'geolocation'으로 변경
                        replace: true // 뒤로가기 기록 꼬임 방지
                    });
                    
                    // 3. 콤보박스 UI 즉시 초기화
                    setSelectedProvince("all");
                    setSelectedDistrict("all");

                } catch (error) {
                    console.error("현위치 업데이트 실패:", error);
                }
            },
            (error) => {
                console.error("Geolocation Error:", error);
                alert("현위치를 가져올 수 없습니다.");
            }
        );
    };
    
    // 콤보박스 변경 시
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
        if (!mapInstance) return;
        setIsLoading(true);

        const { lat, lng } = restaurant; // nearbyList에서 온 데이터
        const moveLatLng = new window.kakao.maps.LatLng(lat, lng);
        mapInstance.panTo(moveLatLng);

        try {
            //const detailData = await apiGet(`/restaurant/detail?lat=${lat}&lng=${lng}`);
            //setSelectedRestaurant(detailData);
            const detailData = await apiGet(`/restaurant/detail?id=${restaurant.res_id}`);
            const reviewData = await apiGet(`/reviews/${restaurant.res_id}`);
            setSelectedRestaurant({ 
                ...detailData, 
                reviews: reviewData, 
                review_count: reviewData.length 
            });
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
                    <button
                        onClick={() => navigate(-1)}
                        className="back-btn"
                    >뒤로가기</button>
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
                        <button 
                            className="close-btn" 
                            onClick={() => setSelectedRestaurant(null)}
                        >
                            X
                        </button>
                        
                        <div className="info-section">
                            <h3>{selectedRestaurant.res_name}</h3>
                            <p><strong>주소:</strong> {selectedRestaurant.address || "-"}</p>
                            <p><strong>전화번호:</strong> {selectedRestaurant.phone || "-"}</p>
                            <p><strong>카테고리:</strong> {selectedRestaurant.category || "-"}</p>
                            <p><strong>평점:</strong> {selectedRestaurant.score ?? "-"}</p>
                        </div>

                        <div className="review-section">
                            <h4>리뷰</h4>
                            {(!selectedRestaurant.reviews || selectedRestaurant.reviews.length === 0) ? (
                                // 리뷰가 없는 경우
                                <div>
                                    <p>작성된 리뷰가 없습니다.</p>
                                    <button 
                                        className="review-btn"
                                        onClick={() => navigate(`/reviews/${selectedRestaurant.res_id}`)}
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
                                        onClick={() => navigate(`/reviews/${selectedRestaurant.res_id}`)}
                                    >
                                        리뷰 더보기 ({selectedRestaurant.review_count}개)
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </div>

            {/* 식당 리스트 영역 */}
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
                            key={restaurant.res_id}
                            onClick={() => handleRestaurantClick(restaurant)}
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