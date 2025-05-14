// ✅ TripRepository.js (수정된 전체 코드)
const db = require('../config/database');
console.log('데이터베이스 연결 객체 상태:', db ? '정상' : '실패');

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
  let query = `SELECT id, schedule_name, city, departure_date, end_date, status, created_at, updated_at FROM TravelSchedule WHERE user_id = ?`;
  const params = [userId];
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
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
    SELECT sd.id, sd.visit_date, sd.visit_order, sd.visit_time, sd.visit_duration,
           td.id AS destination_id, td.name AS destination_name,
           td.latitude, td.longitude
    FROM ScheduleDestination sd
    JOIN TravelDestination td ON sd.destination_id = td.id
    WHERE sd.schedule_id = ?
    ORDER BY sd.visit_date, sd.visit_order
  `, [tripId]);

  // 3. 날짜별로 묶기
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
      longitude:     r.longitude
      // isSelected: r.is_selected ← 제거됨
    });
  });

  return { trip, schedule };
};

exports.insertScheduleDestination = async (scheduleId, d) => {
  const [destRes] = await db.execute(
    `INSERT INTO TravelDestination (name, description, latitude, longitude, category) VALUES (?,?,?,?,NULL)`,
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

exports.deleteScheduleDestination = async (scheduleId, sdId) => {
  await db.execute(`DELETE FROM ScheduleDestination WHERE id = ? AND schedule_id = ?`, [sdId, scheduleId]);
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
           sd.visit_time, sd.visit_date, td.name AS destination_name
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
    SET ${updateFields.join(', ')}, updated_at = NOW() 
    WHERE id = ? AND user_id = ?
  `;
  values.push(tripId, userId);

  const [result] = await db.execute(query, values);
  return result.affectedRows > 0;
};

exports.cloneScheduleForUser = async (originalScheduleId, targetUserId) => {
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
