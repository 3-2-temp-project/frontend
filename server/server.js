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


// ✨ 3. API 만들기: GET /restaurant/detail
app.get('/restaurant/detail', (req, res) => {
    const lat = req.query.lat;
    const lng = req.query.lng;
    
    // ✨ PostgreSQL은 물음표(?) 대신 $1, $2 문법을 씁니다.
    // (여기서는 예시로 좌표로 찾지만, 실제로는 ID로 찾는게 좋습니다)
    const sql = "SELECT * FROM restaurant_info WHERE lat = $1 AND lng = $2";
    
    pool.query(sql, [lat, lng], (err, result) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.send(result.rows[0]); // 1개만 보냄
        }
    });
});

// ✨ 4. API 만들기: GET /restaurants/nearby (반경 검색 예시)
// (PostgreSQL은 거리 계산 함수가 다를 수 있으니 단순 조회로 예시 듭니다)
app.get('/restaurants/nearby', (req, res) => {
    // ... 반경 검색 로직 ...
    // 일단은 전체 리스트를 주는 걸로 테스트 해보세요
    const sql = "SELECT * FROM restaurant_info LIMIT 10"; 
    pool.query(sql, (err, result) => {
        if (err) res.status(500).send(err);
        else res.send(result.rows);
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