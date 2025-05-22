// ✅ TripRepository.js (수정된 전체 코드)
const db = require('../config/database');
console.log('데이터베이스 연결 객체 상태:', db ? '정상' : '실패');

exports.countSchedules = async () => {
  const query = `SELECT COUNT(*) AS scheduleCnt FROM TravelSchedule`;
  try {
    const [rows] = await db.execute(query);
    return rows[0].scheduleCnt;
  } catch (error) {
    console.error('일정 수 조회 중 오류:', error);
    throw error;
  }
};

exports.getPlacesGroupedByDate = async (tripId) => {
  const [rows] = await db.query(`
    SELECT
      tj.destination_id        AS id,
      t.name                   AS title,
      t.latitude               AS latitude,
      t.longitude              AS longitude,
      tj.visit_date            AS visit_date,
      tj.visit_order           AS visit_order,
      tj.visit_duration        AS visit_duration,
      tj.is_selected           AS is_selected
    FROM ScheduleDestination tj
    JOIN TravelDestination t  ON tj.destination_id = t.id
    WHERE tj.schedule_id = ?
    ORDER BY tj.visit_date, tj.visit_order
  `, [tripId]);

  const grouped = {};
  for (const row of rows) {
    const key = row.visit_date ? row.visit_date.toISOString().slice(0, 10) : '미정';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(row);
  }
  return grouped;
};

exports.updateVisitOrderAndDistance = async ({ tripId, placeId, date, order, distance }) => {
  await db.query(
    `UPDATE ScheduleDestination
     SET visit_order = ?, distance = ?
     WHERE schedule_id = ? AND destination_id = ? AND visit_date = ?`,
    [order, distance, tripId, placeId, date]
  );
};

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

exports.updateVisitOrderAndDistanceBulk = async (tripId, dataByDate) => {
  for (const [date, places] of Object.entries(dataByDate)) {
    for (const place of places) {
      console.log(`[Mock] ${tripId} | ${place.name} | ${date} | 순서: ${place.order}, 거리: ${place.distanceFromPrevious}`);
    }
  }
};

exports.updateTransportationForTrip = async (tripId, transportationId) => {
  const [result] = await db.query(
    `UPDATE ScheduleDestination
     SET transportation_id = ?
     WHERE schedule_id = ?`,
    [transportationId, tripId]
  );
  return result;
};

exports.createTrip = async (userId, tripData) => {
  const query = `
    INSERT INTO TravelSchedule 
    (user_id, schedule_name, city, departure_date, end_date, status, created_at, updated_at) 
    VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
  `;
  const [result] = await db.execute(query, [
    userId,
    tripData.tripName,
    tripData.city || '',
    tripData.departureDate,
    tripData.endDate,
    tripData.status || '계획'
  ]);
  return result.insertId;
};

exports.getSelectedCityByUserId = async (userId) => {
  const [rows] = await db.execute(
    `SELECT city, departure_date, end_date, id FROM TravelSchedule WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
};

exports.getPlaceById = async (placeId) => {
  const [rows] = await db.execute(`SELECT * FROM TravelDestination WHERE id = ?`, [placeId]);
  return rows[0] || null;
};

exports.linkTripWithPlace = async (scheduleId, placeId) => {
  await db.execute(
    `INSERT INTO ScheduleDestination (destination_id, schedule_id, visit_order, created_at, updated_at) VALUES (?, ?, 1, NOW(), NOW())`,
    [placeId, scheduleId]
  );
};

exports.getTotalTripCount = async (userId, travel_status = null) => {
  let query = 'SELECT COUNT(*) as total_count FROM TravelSchedule WHERE user_id = ?';
  const params = [userId];
  if (travel_status) {
    query += ' AND status = ?';
    params.push(travel_status);
  }
  const [rows] = await db.execute(query, params);
  return rows[0].total_count;
};

exports.getAllTrips = async (userId, page = 1, limit = 10, status = null) => {
  const offset = (page - 1) * limit;
  let query = `SELECT id, schedule_name, city, departure_date, end_date, status, created_at, updated_at FROM TravelSchedule WHERE user_id = ? AND status != 'X'`;
  const params = [userId];

  query += ` ORDER BY created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
  const [rows] = await db.execute(query, params);
  return rows;
};

exports.getTripDetailWithSchedule = async (userId, tripId) => {
  // 1. 일정 기본 정보 조회
  const [[trip]] = await db.query(
    `SELECT * FROM TravelSchedule WHERE id = ? AND user_id = ?`, 
    [tripId, userId]
  );
  if (!trip) return null;

  // 2. 장소 정보 조회 (is_selected 제거)
  const [rows] = await db.query(`
    SELECT sd.id, sd.visit_date, sd.visit_order, sd.visit_time, sd.visit_duration, sd.is_hidden, DATE_FORMAT(sd.visit_date, '%Y-%m-%d') AS visit_date_str,
           td.id AS destination_id, td.destination_name AS destination_name,
           td.latitude, td.longitude
    FROM ScheduleDestination sd
    JOIN TravelDestination td ON sd.destination_id = td.id
    WHERE sd.schedule_id = ?
    ORDER BY sd.visit_date, sd.visit_order
  `, [tripId]);

  // 3. 날짜별로 묶기
  const schedule = {};
  rows.forEach(r => {
    const key = r.visit_date_str || '미정';
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
      isHidden:      r.is_hidden,
      visitDate:     r.visit_date
      // isSelected: r.is_selected ← 제거됨
    });
  });

  return { trip, schedule };
};

exports.getTripDetail = async (userId, tripId) => {
  const [rows] = await db.query(`
    SELECT * FROM TravelSchedule WHERE id = ? AND user_id = ?`,
    [tripId, userId]
  );
  return rows[0] || null;
};

/* ------------------------------------------------------------------
 * 일정-날짜에 장소 1개 추가
 * 1) 동일 이름의 TravelDestination 있으면 재사용,
 *    없으면 새 레코드 생성
 * 2) visit_order = (해당 날짜 MAX)+1
 * 3) ScheduleDestination INSERT 후 PK 반환
 * ------------------------------------------------------------------*/
exports.addPlaceToSchedule = async (scheduleId, dto) => {
  /* 1) TravelDestination 찾거나 생성 */
  const [[dest]] = await db.execute(
    `SELECT id FROM TravelDestination
      WHERE destination_name = ? LIMIT 1`,
    [dto.destination_name]
  );

  let destId = dest?.id;
  if (!destId) {
    const [ins] = await db.execute(
      `INSERT INTO TravelDestination
         (destination_name, destination_description,
          latitude, longitude, category, image)
       VALUES (?,?,?,?,?,?)`,
      [
        dto.destination_name,
        dto.description ?? '',
        dto.latitude   ?? 0,
        dto.longitude  ?? 0,
        dto.category   ?? null,
        dto.image      ?? null
      ]
    );
    destId = ins.insertId;
  }

  /* 2) 이미 같은 destination_id 가 붙어있나? */
  const [[exists]] = await db.execute(
    `SELECT id FROM ScheduleDestination
      WHERE destination_id = ? AND schedule_id = ?`,
    [destId, scheduleId]
  );

  /* 3) visit_order 계산 (해당 날짜 기준) */
  const [[{ nextOrder }]] = await db.execute(
    `SELECT IFNULL(MAX(visit_order),0)+1 AS nextOrder
       FROM ScheduleDestination
      WHERE schedule_id = ?
        AND (visit_date <=> ?)`,
    [scheduleId, dto.visit_date ?? null]
  );

  let sdId;

  if (exists) {
    /* → UPDATE */
    await db.execute(
      `UPDATE ScheduleDestination
          SET visit_date = ?,
              visit_time = ?,
              visit_order = ?,
              updated_at = NOW(),
              is_hidden = 0,
        WHERE id = ?`,
      [
        dto.visit_date ?? null,
        dto.visit_time ?? '12:00',
        nextOrder,
        exists.id
      ]
    );
    sdId = exists.id;
  } else {
    /* → INSERT */
    const [sd] = await db.execute(
      `INSERT INTO ScheduleDestination
         (destination_id, schedule_id, visit_order,
          visit_time, visit_date, is_hidden,
          transportation_id, created_at, updated_at)
       VALUES (?,?,?,?,?,0,NULL,NOW(),NOW())`,
      [
        destId,
        scheduleId,
        nextOrder,
        dto.visit_time ?? '12:00',
        dto.visit_date ?? null
      ]
    );
    sdId = sd.insertId;
  }

  return { sdId, destinationId: destId };
};

exports.getDestinationIdByName = async (destination_name) => {
  const [[dest]] = await db.execute(
    `SELECT id FROM TravelDestination WHERE destination_name = ?`,
    [destination_name]
  );
  console.log("getDestinationIdByName ▶", { destination_name, dest });
  return dest?.id ?? null;
};

exports.insertScheduleDestination = async (scheduleId, d) => {
  console.log("insertScheduleDestination ▶", { scheduleId, d });
  const [destRes] = await db.execute(
    `INSERT INTO TravelDestination (destination_name, destination_description, latitude, longitude, category) VALUES (?,?,?,?,NULL)`,
    [d.title, d.description ?? '', 0, 0]
  );
  const destId = destRes.insertId;

  const [sdRes] = await db.execute(
    `INSERT INTO ScheduleDestination (destination_id, schedule_id, visit_order, visit_time, visit_date, transportation_id, is_selected)
     VALUES (?, ?, (SELECT IFNULL(MAX(visit_order),0)+1 FROM ScheduleDestination WHERE schedule_id = ?), ?, ?, NULL, 1)`,
    [destId, scheduleId, scheduleId, d.time, d.visit_date]
  );

  return { sdId: sdRes.insertId, destinationId: destId };
};

exports.deleteTrip = async (tripId, userId) => {
  await db.execute(`UPDATE TravelSchedule
      SET    status      = 'X',
            updated_at  = NOW()
      WHERE  id = ?
      AND    user_id = ?;`, [tripId, userId]);

  return true;
};

exports.deleteScheduleDestination = async (scheduleId, destinationName) => {
  /*
   * 1) TravelDestination 과 조인해서 destination_name → destination_id 매핑
   * 2) visit_date 를 NULL 로 업데이트 (soft-delete)
   */
  const [result] = await db.execute(
    `UPDATE ScheduleDestination sd
       JOIN TravelDestination td ON td.id = sd.destination_id
     SET  sd.visit_date  = NULL,
          sd.updated_at  = NOW()
     WHERE sd.schedule_id      = ?
       AND td.destination_name = ?
     `,                     
    [scheduleId, destinationName]
  );

  return result.affectedRows > 0;           // true = 성공
};

exports.getTripById = async (userId, tripId) => {
  const [rows] = await db.execute(
    `SELECT id, schedule_name, city, departure_date, end_date, status, created_at, updated_at FROM TravelSchedule WHERE id = ? AND user_id = ?`,
    [tripId, userId]
  );
  return rows[0] || null;
};

exports.getTripDestinations = async (tripId) => {
  const [rows] = await db.execute(`
    SELECT sd.id, sd.destination_id, sd.visit_order, sd.visit_duration, 
           sd.visit_time, sd.visit_date, td.destination_name AS destination_name
    FROM ScheduleDestination sd
    JOIN TravelDestination td ON sd.destination_id = td.id
    WHERE sd.schedule_id = ?
    ORDER BY sd.visit_date, sd.visit_order
  `, [tripId]);
  return rows;
};

exports.updateTripBasicInfo = async (tripId, userId, updateData) => {
  const updateFields = [];
  const values = [];

  if (updateData.schedule_name) {
    updateFields.push('schedule_name = ?');
    values.push(updateData.schedule_name);
  }
  if (updateData.status) {
    updateFields.push('status = ?');
    values.push(updateData.status);
  }

  if (updateFields.length === 0) return false;

  const query = `
    UPDATE TravelSchedule 
    SET ${updateFields.join(', ')}, updated_at = NOW(), status = 'O'
    WHERE id = ? AND user_id = ?
  `;
  values.push(tripId, userId);

  const [result] = await db.execute(query, values);
  return result.affectedRows > 0;
};

exports.cloneScheduleForUser = async (originalScheduleId, targetUserId) => {
  console.log(" <<< originalScheduleId >>> ",originalScheduleId);
  console.log(" <<< targetUserId >>> ",targetUserId);
  const [rows] = await db.query(`SELECT schedule_name, city, departure_date, end_date FROM TravelSchedule WHERE id = ?`, [originalScheduleId]);
  const origin = rows[0];
  if (!origin) throw new Error('복제할 일정이 존재하지 않습니다.');

  const [result] = await db.query(`
    INSERT INTO TravelSchedule
    (user_id, schedule_name, city, departure_date, end_date, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'shared', NOW(), NOW())
  `, [
    targetUserId,
    origin.schedule_name + ' (공유됨)',
    origin.city,
    origin.departure_date,
    origin.end_date
  ]);
  const newScheduleId = result.insertId;

  const [destinations] = await db.query(`
    SELECT destination_id, visit_order, visit_duration, visit_time, visit_date, is_hidden
    FROM ScheduleDestination
    WHERE schedule_id = ?
  `, [originalScheduleId]);

  for (const d of destinations) {
    await db.query(`
      INSERT INTO ScheduleDestination 
      (destination_id, schedule_id, visit_order, visit_duration, visit_time, visit_date, is_hidden, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      d.destination_id,
      newScheduleId,
      d.visit_order,
      d.visit_duration,
      d.visit_time,
      d.visit_date,
      d.is_hidden
    ]);
  }

  return newScheduleId;
};

exports.findScheduleIdByDestinationId = async (destinationId) => {
  const query = `
    SELECT schedule_id 
    FROM ScheduleDestination 
    WHERE destination_id = ? 
    LIMIT 1`;
  
  const [rows] = await db.query(query, [destinationId]);
  return rows.length > 0 ? rows[0].schedule_id : null;
};

/**
 * 현재 날짜로부터 지정된 일수 이내에 시작하는 여행 일정 조회
 * @param {number} days - 조회할 일수 범위
 * @returns {Promise<Array>} - 여행 일정 목록
 */
exports.findTripsStartingWithinDays = async (days) => {
  const query = `
    SELECT ts.*, u.id as owner_id, u.name as owner_name
    FROM TravelSchedule ts
    JOIN User u ON ts.user_id = u.id
    WHERE ts.departure_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
    AND ts.travel_status = 'planned'
  `;
  
  const [rows] = await db.query(query, [days]);
  return rows;
};