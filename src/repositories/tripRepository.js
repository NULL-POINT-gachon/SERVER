const db = require('../config/database'); // 이건 너희 프로젝트에서 DB 연결 객체
console.log('데이터베이스 연결 객체 상태:', db ? '정상' : '실패');


// 여행일정 ID로 날짜별 장소 묶어서 가져오기
exports.getPlacesGroupedByDate = async (tripId) => {
  const [rows] = await db.query(`
    SELECT
      tj.destination_id        AS 식별자,
      t.destination_name       AS 여행지명,
      t.latitude               AS 위도,
      t.longitude              AS 경도,
      tj.visit_date            AS 방문날짜,
      tj.visit_order           AS 방문순서,
      tj.visit_duration        AS 예상방문시간,
      tj.is_selected           AS 선택여부
    FROM ScheduleDestination tj
    JOIN TravelDestination t  ON tj.destination_id = t.id
    WHERE tj.schedule_id = ?
    ORDER BY tj.visit_date, tj.visit_order
  `, [tripId]);

  const grouped = {};

  for (const row of rows) {
    // 날짜가 null이면 '미정' 키 사용
    const key = row.방문날짜
      ? row.방문날짜.toISOString().slice(0, 10)   // 'YYYY-MM-DD'
      : '미정';

    if (!grouped[key]) grouped[key] = [];

    grouped[key].push({
      식별자:        row.식별자,
      여행지명:      row.여행지명,
      방문순서:      row.방문순서,
      예상방문시간:  row.예상방문시간,
      위도:          row.위도,
      경도:          row.경도,
      선택여부:      row.선택여부
    });
  }

  return grouped;
};

exports.updateVisitOrderAndDistance = async ({ tripId, placeId, date, order, distance }) => {
  await db.query(
    `UPDATE 여행일정_안에_여행지
       SET 방문순서 = ?, 이동거리 = ?
       WHERE 여행일정식별자 = ? AND 여행지식별자 = ? AND 방문날자 = ?`,
    [order, distance, tripId, placeId, date]
  );
};
// 🧩 1. optimizeScheduleById - scheduleId로 mock 일정 구성
exports.optimizeScheduleById = async (scheduleId) => {
  const mock = {
    "2025-06-01": [
      { placeId: 1, name: "에펠탑", latitude: 48.8584, longitude: 2.2945 },
      { placeId: 2, name: "루브르", latitude: 48.8606, longitude: 2.3376 }
    ],
    "2025-06-02": [
      { placeId: 3, name: "개선문", latitude: 48.8738, longitude: 2.2950 }
    ]
  };

  const result = {};

  for (const [date, places] of Object.entries(mock)) {
    result[date] = places.map((p, i) => ({
      ...p,
      order: i + 1,
      distanceFromPrevious: i === 0 ? 0 : 3.0
    }));
  }

  await exports.updateVisitOrderAndDistanceBulk(scheduleId, result);
  return result;
};

// 🧩 2. updateVisitOrderAndDistanceBulk - console 로그 Mock 처리
exports.updateVisitOrderAndDistanceBulk = async (tripId, dataByDate) => {
  for (const [date, places] of Object.entries(dataByDate)) {
    for (const place of places) {
      console.log(`[Mock] ${tripId} | ${place.name} | ${date} | 순서: ${place.order}, 거리: ${place.distanceFromPrevious}`);
    }
  }
}
exports.updateTransportationForTrip = async (tripId, transportationId) => {
  const [result] = await db.query(
    `
      UPDATE 여행일정_안에_여행지
      SET 여행수단 = ?
      WHERE 여행일정식별자 = ?
      `,
    [transportationId, tripId]
  );
  return result;
};

// 여행 일정 생성 함수
exports.createTrip = async (userId, tripData) => {
  const { tripName, departureDate, endDate, travel_status } = tripData;
  
  const query = `
    INSERT INTO TravelSchedule 
    (user_id, schedule_name, city ,departure_date, end_date, travel_status, created_at, updated_at) 
    VALUES (?, ?,?, ?, ?, ?, NOW(), NOW())
  `;
  
  try {
    const [result] = await db.execute(query, [
      userId,
      tripName,
      tripData.city || '', // city 값 추가 (빈 문자열 또는 특정 도시명)
      departureDate,
      endDate,
      travel_status || '계획'
    ]);
    
    return result.insertId;
  } catch (error) {
    console.error('여행 일정 생성 중 오류:', error);
    throw error;
  }
};

// 사용자가 이전에 선택한 도시 정보 조회
exports.getSelectedCityByUserId = async (userId) => {
  const query = `
    SELECT ts.city, ts.departure_date, ts.end_date, ts.id 
    FROM TravelSchedule ts
    WHERE ts.user_id = ? 
    ORDER BY ts.created_at DESC
    LIMIT 1
  `;
  
  try {
    const [rows] = await db.execute(query, [userId]);
    return rows[0] || null;
  } catch (error) {
    console.error('이전 도시 정보 조회 중 오류:', error);
    throw error;
  }
};

// 여행지 ID로 특정 여행지 정보 조회
exports.getPlaceById = async (placeId) => {
  const query = `
    SELECT * FROM TravelDestination WHERE id = ?
  `;
  
  try {
    const [rows] = await db.execute(query, [placeId]);
    return rows[0] || null;
  } catch (error) {
    console.error('여행지 정보 조회 중 오류:', error);
    throw error;
  }
};

// 여행 일정과 선택한 여행지를 연결
exports.linkTripWithPlace = async (scheduleId, placeId) => {
  const query = `
    INSERT INTO ScheduleDestination 
    (destination_id, schedule_id, visit_order, created_at, updated_at) 
    VALUES (?, ?, 1, NOW(), NOW())
  `;
  
  try {
    await db.execute(query, [placeId, scheduleId]);
  } catch (error) {
    console.error('여행지 연결 중 오류:', error);
    throw error;
  }
};
// 전체 여행 일정 개수 조회 함수
exports.getTotalTripCount = async (userId, travel_status = null) => {
  let query = 'SELECT COUNT(*) as total_count FROM TravelSchedule WHERE user_id = ?';
  const queryParams = [userId];
  
  // travel_status 필터링 조건 추가
  if (travel_status) {
    query += ' AND travel_status = ?';
    queryParams.push(travel_status);
  }
  
  try {
    const [rows] = await db.execute(query, queryParams);
    return rows[0].total_count;
  } catch (error) {
    console.error('전체 여행 일정 개수 조회 중 오류:', error);
    throw error;
  }
};

// 전체 여행 일정 조회 함수
exports.getAllTrips = async (userId, page, limit, travel_status = null) => {
  const offset = (page - 1) * limit;
  
  let query = `
    SELECT id, schedule_name, departure_date, end_date, 
           travel_status, created_at, updated_at
    FROM TravelSchedule 
    WHERE user_id = ?
  `;
  
  const queryParams = [userId];
  
  // travel_status 필터링 조건 추가
  if (travel_status) {
    query += ' AND travel_status = ?';
    queryParams.push(travel_status);
  }
  
  // 정렬 및 페이지네이션 추가
  query += ` ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

  
  try {
    const [rows] = await db.execute(query, queryParams);
    return rows;
  } catch (error) {
    console.error('전체 여행 일정 조회 중 오류:', error);
    throw error;
  }
};

exports.getTripDetailWithSchedule = async (userId, tripId) => {
  /* 1) 일정 기본 정보 */
  const [[trip]] = await db.query(`
    SELECT id, schedule_name, city, departure_date, end_date, travel_status,
           created_at, updated_at
      FROM TravelSchedule
     WHERE id = ? AND user_id = ?
  `, [tripId, userId]);
  console.log(trip);
  if (!trip) return null;

  /* 2) 포함된 장소 */
  const [rows] = await db.query(`
    SELECT sd.id, sd.visit_date, sd.visit_order, sd.visit_time, sd.visit_duration,
           td.id   AS destination_id,
           td.destination_name,
           td.latitude, td.longitude,
           sd.is_selected
      FROM ScheduleDestination sd
      JOIN TravelDestination td ON sd.destination_id = td.id
     WHERE sd.schedule_id = ?
     ORDER BY sd.visit_date, sd.visit_order
  `, [tripId]);
  console.log(rows);
  /* 3) 날짜별 묶기 */
  const schedule = {};
  rows.forEach(r => {
    const key = r.visit_date ? r.visit_date.toISOString().slice(0, 10) : '미정';
    if (!schedule[key]) schedule[key] = [];
    schedule[key].push({
      id:            r.id,
      destinationId: r.destination_id,
      name:          r.destination_name,
      order:         r.visit_order,
      time:          r.visit_time,
      duration:      r.visit_duration,
      latitude:      r.latitude,
      longitude:     r.longitude,
      isSelected:    r.is_selected
    });
  });
  console.log(schedule);
  return { trip, schedule };
};

exports.insertScheduleDestination = async (scheduleId, d) => {
  /* 1) TravelDestination 간단 등록 (위치정보 미정 → 0) */
  const [destRes] = await db.execute(`
    INSERT INTO TravelDestination
      (destination_name, destination_description,
       latitude, longitude, category)
     VALUES (?,?,0,0,NULL)`,
    [d.title, d.description ?? '']
  );
  const destId = destRes.insertId;

  /* 2) ScheduleDestination 연결 */
  const [sdRes] = await db.execute(`
    INSERT INTO ScheduleDestination
      (destination_id, schedule_id, visit_order,
       visit_time, visit_date, transportation_id, is_selected)
     VALUES ( ?, ?, 
              (SELECT IFNULL(MAX(visit_order),0)+1 FROM ScheduleDestination WHERE schedule_id = ?),
              ?, ?, NULL, 1)`,
    [destId, scheduleId, scheduleId, d.time, d.visit_date]
  );

  return { sdId: sdRes.insertId, destinationId: destId };
};

exports.deleteScheduleDestination = async (scheduleId, sdId) => {
  await db.execute(
    `DELETE FROM ScheduleDestination WHERE id = ? AND schedule_id = ?`,
    [sdId, scheduleId]
  );
};

// 특정 여행 일정 조회 함수
exports.getTripById = async (userId, tripId) => {
  const query = `
    SELECT id, schedule_name, city, departure_date, end_date, 
           travel_status, created_at, updated_at
    FROM TravelSchedule 
    WHERE id = ? AND user_id = ?
  `;
  
  try {
    const [rows] = await db.execute(query, [tripId, userId]);
    return rows[0] || null;
  } catch (error) {
    console.error('여행 일정 조회 중 오류:', error);
    throw error;
  }
};

// 일정에 포함된 여행지 목록 조회 함수
exports.getTripDestinations = async (tripId) => {
  const query = `
    SELECT sd.id, sd.destination_id, sd.visit_order, sd.visit_duration, 
           sd.visit_time, sd.visit_date,
           td.destination_name
    FROM ScheduleDestination sd
    JOIN TravelDestination td ON sd.destination_id = td.id
    WHERE sd.schedule_id = ?
    ORDER BY sd.visit_date, sd.visit_order
  `;
  
  try {
    const [rows] = await db.execute(query, [tripId]);
    return rows;
  } catch (error) {
    console.error('여행지 목록 조회 중 오류:', error);
    throw error;
  }
};

exports.updateTripBasicInfo = async (tripId, userId, updateData) => {
  try {
    // 직접 하드코딩된 쿼리
    let query;
    
    // 두 필드 모두 있는 경우
    if (updateData.schedule_name && updateData.travel_status) {
      query = `
        UPDATE TravelSchedule 
        SET schedule_name = '${updateData.schedule_name}',
            travel_status = '${updateData.travel_status}',
            updated_at = NOW()
        WHERE id = ${tripId} AND user_id = ${userId}
      `;
      const [result] = await db.query(query); // execute 대신 query 사용
      return result.affectedRows > 0;
    }
    
    // 일정명만 있는 경우
    if (updateData.schedule_name) {
      query = `
        UPDATE TravelSchedule 
        SET schedule_name = '${updateData.schedule_name}',
            updated_at = NOW()
        WHERE id = ${tripId} AND user_id = ${userId}
      `;
      const [result] = await db.query(query);
      return result.affectedRows > 0;
    }
    
    // 여행상태만 있는 경우
    if (updateData.travel_status) {
      query = `
        UPDATE TravelSchedule 
        SET travel_status = '${updateData.travel_status}',
            updated_at = NOW()
        WHERE id = ${tripId} AND user_id = ${userId}
      `;
      const [result] = await db.query(query);
      return result.affectedRows > 0;
    }
    
    return false;
  } catch (error) {
    console.error('여행 일정 수정 중 오류:', error);
    throw error;
  }
};

exports.cloneScheduleForUser = async (originalScheduleId, targetUserId) => {
  // 1. 기존 일정 정보 조회
  const [rows] = await db.query(`
    SELECT schedule_name, city, departure_date, end_date
    FROM TravelSchedule
    WHERE id = ?
  `, [originalScheduleId]);
  const origin = rows[0];
  if (!origin) throw new Error('복제할 일정이 존재하지 않습니다.');

  // 2. 새로운 일정 생성
  const [result] = await db.query(`
    INSERT INTO TravelSchedule
    (user_id, schedule_name, city, departure_date, end_date, travel_status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'shared', NOW(), NOW())
  `, [
    targetUserId,
    origin.schedule_name + " (공유됨)",
    origin.city,
    origin.departure_date,
    origin.end_date
  ]);
  const newScheduleId = result.insertId;

  // 3. 장소 목록 복사
  const [destinations] = await db.query(`
    SELECT destination_id, visit_order, visit_duration, visit_time, visit_date
    FROM ScheduleDestination
    WHERE schedule_id = ?
  `, [originalScheduleId]);

  for (const d of destinations) {
    await db.query(`
      INSERT INTO ScheduleDestination 
      (destination_id, schedule_id, visit_order, visit_duration, visit_time, visit_date, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      d.destination_id,
      newScheduleId,
      d.visit_order,
      d.visit_duration,
      d.visit_time,
      d.visit_date
    ]);
  }

  return newScheduleId;
};