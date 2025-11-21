const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors({
    origin: 'http://localhost:3000', // 프론트엔드 주소 (마지막에 슬래시 / 없음)
    credentials: true                // 쿠키/세션 허용
}));
app.use(express.json());

// ✨ 1. 데이터베이스 연결 설정 (PostgreSQL)
// 가지고 계신 링크를 아래 'connectionString'에 넣으세요.
const pool = new Pool({
    connectionString: 'postgresql://suwon:12341234@112.167.154.185:54320/project25', 
    // 예: 'postgres://admin:1234@my-db.aws.com:5432/mydb'
    
    // ⚠️ 클라우드 DB(AWS, Render 등)를 쓴다면 아래 옵션이 필요할 수 있습니다.
    // 만약 연결 에러가 나면 주석(//)을 풀고 시도해보세요.
    // ssl: {
    //   rejectUnauthorized: false
    // }
});

// DB 연결 확인 (선택 사항)
pool.connect((err) => {
    if (err) console.error('❌ DB 연결 실패', err);
    else console.log('🎉 PostgreSQL DB 연결 성공!');
});


// ✨ 2. API 만들기: GET /restaurants/markers
app.get('/restaurants/markers', (req, res) => {
    const sql = "SELECT * FROM restaurant_info";
    
    pool.query(sql, (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send(err);
        } else {
            // ✨ MySQL과 다르게 실제 데이터는 result.rows에 들어있습니다.
            res.send(result.rows); 
        }
    });
});


// 상세 정보 조회 (좌표 대신 'id' 사용)
app.get('/restaurant/detail', (req, res) => {
    //const lat = req.query.lat;
    //const lng = req.query.lng;
    const id = req.query.id;
    
    // ✨ PostgreSQL은 물음표(?) 대신 $1, $2 문법을 씁니다.
    // (여기서는 예시로 좌표로 찾지만, 실제로는 ID로 찾는게 좋습니다)
    //const sql = "SELECT * FROM restaurant_info WHERE lat = $1 AND lng = $2";
    const sql = "SELECT * FROM restaurant_info WHERE id = $1";
    /*
    pool.query(sql, [lat, lng], (err, result) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.send(result.rows[0]); // 1개만 보냄
        }
    });
    */
    pool.query(sql, [id], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send("DB Error");
        } else if (result.rows.length === 0) {
            res.status(404).send("식당을 찾을 수 없습니다.");
        } else {
            // 리뷰 데이터도 같이 보내주기로 했었죠? (선택사항: 조인하거나 별도 호출)
            // 일단 식당 정보만 보냅니다. (리뷰는 map.js에서 따로 /reviews 호출해도 됨)
            // 만약 여기서 리뷰도 같이 주려면 쿼리가 복잡해지니, 
            // map.js에서 상세정보 API + 리뷰 목록 API 두 개를 부르는 게 낫습니다.
            res.send(result.rows[0]);
        }
    });
});

// 4.주변 식당 검색 API (거리 계산 + 정렬 적용)
app.get('/restaurants/nearby', (req, res) => {
    const radius = parseFloat(req.query.radius) || 0.5; // 기본 0.5km

    // 1. 세션에서 내 위치 가져오기 (없으면 에러)
    // 주의: express-session 설정이 되어 있어야 req.session을 쓸 수 있습니다.
    // 만약 세션 설정이 복잡하다면, 일단 임시로 전역 변수를 쓰거나(비추천),
    // 프론트엔드에서 요청할 때 lat/lng를 query string으로 보내는 게 더 확실할 수 있습니다.
    
    const userLat = req.query.lat; 
    const userLng = req.query.lng;

    // 위치 정보가 없으면 그냥 빈 배열 반환
    if (!userLat || !userLng) {return res.json([]);}

    // 2. PostgreSQL의 하버사인 공식(Haversine Formula) 쿼리
    // 6371 = 지구 반지름(km)
    // 식당 테이블 이름: restaurant_info
    // 식당 좌표 컬럼: lat, lng
    const sql = `
        SELECT *,
            (6371 * acos(cos(radians($1)) * cos(radians(lat)) * cos(radians(lng) - radians($2)) + sin(radians($1)) * sin(radians(lat)))) AS distance
        FROM restaurant_info
        WHERE (6371 * acos(cos(radians($1)) * cos(radians(lat)) * cos(radians(lng) - radians($2)) + sin(radians($1)) * sin(radians(lat)))) < $3
        ORDER BY distance ASC
        LIMIT 50; 
    `;

    pool.query(sql, [userLat, userLng, radius], (err, result) => {
        if (err) {
            console.error("Nearby Error:", err);
            res.status(500).send("DB Error");
        } else {
            res.send(result.rows);
        }
    });
});

// ✨ 5. [API] 특정 식당의 리뷰 목록 가져오기
app.get('/reviews/:res_id', (req, res) => {
    const resId = req.params.res_id;
    // 작성일(created_at) 최신순으로 정렬
    const sql = "SELECT * FROM reviews WHERE res_id = $1 ORDER BY created_at DESC";
    
    pool.query(sql, [resId], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send("DB Error");
        } else {
            res.send(result.rows);
        }
    });
});

// ✨ 6. [API] 리뷰 작성하기 (DB 저장)
app.post('/reviews', (req, res) => {
    const { res_id, user_id, rating, content } = req.body;

    // user_id가 없으면 임시로 1번 유저로 저장 (나중에 로그인 구현 시 수정)
    const finalUserId = user_id || 1; 

    const sql = `
        INSERT INTO reviews (res_id, user_id, rating, content, created_at)
        VALUES ($1, $2, $3, $4, NOW())
    `;
    
    pool.query(sql, [res_id, finalUserId, rating, content], (err, result) => {
        if (err) {
            console.error("리뷰 저장 실패:", err);
            res.status(500).send("리뷰 저장 실패");
        } else {
            res.send({ message: "리뷰 등록 성공!" });
        }
    });
});

// ✨ 위치 정보 저장 API (POST /location)
app.post('/location', (req, res) => {
    const { lat, lng } = req.body;
    console.log("📍 사용자 위치 수신:", lat, lng);
    
    // (나중에 여기에 세션 저장 로직을 추가할 수 있습니다)
    // 지금은 성공했다는 응답만 바로 보내줍니다.
    res.json({ message: "Location saved successfully" });
});

app.listen(5001, () => {
    console.log('🚀 백엔드 서버가 5001번 포트에서 실행 중입니다.');
});