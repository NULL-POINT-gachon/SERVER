const db = require('../config/database');

// 모든 여행지 목록 조회
exports.findAllDestinations = async () => {
  const query = `
    SELECT id, name, description, latitude, longitude,
           category, indoor_outdoor, admission_fee, image, status
    FROM TravelDestination
    ORDER BY id DESC
  `;

  try {
    const [destinations] = await db.execute(query);
    return destinations;
  } catch (error) {
    console.error('여행지 목록 조회 중 오류:', error);
    throw error;
  }
};

// 특정 여행지 상세 조회
exports.findDestinationById = async (destinationId) => {
  const query = `
    SELECT id, name as destination_name, description, latitude, longitude,
           category, indoor_outdoor, admission_fee as phone_number, image as operating_hours, status
    FROM TravelDestination
    WHERE id = ?
  `;

  try {
    const [destinations] = await db.execute(query, [destinationId]);
    return destinations[0] || null;
  } catch (error) {
    console.error('여행지 상세 조회 중 오류:', error);
    throw error;
  }
};

// 여행지 등록
exports.createDestination = async (data) => {
  const query = `
    INSERT INTO TravelDestination (
      destination_name, destination_description,
      latitude, longitude,
      category, indoor_outdoor, entrance_fee, image, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)   -- ⭐ 핵심
  `;

  const vals = [
    data.destination_name,          // ← 필드명 통일 주의
    data.description,
    data.latitude,
    data.longitude,
    data.category,
    data.indoor_outdoor,
    data.entrance_fee,
    data.image
  ];

  try {
    const [result] = await db.execute(query, vals);

    // insertId ➜ 새로 넣었든, 중복이든 항상 해당 PK가 들어온다
    const id = result.insertId;

    // 완전한 객체를 리턴하려면 다시 SELECT
    const dest = await exports.findDestinationById(id);
    return dest;
  } catch (err) {
    console.error('여행지 등록 중 오류:', err);
    throw err;
  }
};

// 여행지 수정
// 여행지 수정
exports.updateDestination = async (destinationId, updateData) => {
  const query = `
    UPDATE TravelDestination
SET name = ?,
    description = ?,
    latitude = ?,
    longitude = ?,
    category = ?,
    indoor_outdoor = ?,
    admission_fee = ?, 
    image = ?, 
    operating_hours = ?,          -- ✅ 추가
    phone_number = ?              -- ✅ 추가
WHERE id = ?
  `;

  // undefined를 방지하기 위한 안전 처리 함수
  const safe = (val) => val === undefined ? null : val;

  const values = [
    safe(updateData.destination_name),
    safe(updateData.description),
    safe(updateData.latitude),
    safe(updateData.longitude),
    safe(updateData.category),
    safe(updateData.indoor_outdoor),
    safe(updateData.admission_fee),         // 숫자
    safe(updateData.image),
    safe(updateData.operating_hours),       // 문자열
    safe(updateData.phone_number),          // 문자열
    destinationId
  ];

  try {
    const [result] = await db.execute(query, values);
    if (result.affectedRows === 0) {
      throw new Error('여행지를 찾을 수 없습니다.');
    }
    return { id: destinationId, ...updateData };
  } catch (error) {
    console.error('여행지 수정 중 오류:', error);
    throw error;
  }
};

// 여행지 삭제 (소프트 삭제)
exports.deleteDestination = async (destinationId) => {
  const query = `
    UPDATE TravelDestination
    SET status = 0
    WHERE id = ?
  `;

  try {
    const [result] = await db.execute(query, [destinationId]);
    return result.affectedRows > 0;
  } catch (error) {
    console.error('여행지 삭제 중 오류:', error);
    throw error;
  }
};