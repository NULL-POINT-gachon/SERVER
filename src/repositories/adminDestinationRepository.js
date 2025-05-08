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
    SELECT id, name, description, latitude, longitude,
           category, indoor_outdoor, admission_fee, image, status
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
exports.createDestination = async (destinationData) => {
  const query = `
    INSERT INTO TravelDestination (
      name, description, latitude, longitude,
      category, indoor_outdoor, admission_fee, image, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
  `;
  
  const values = [
    destinationData.name,
    destinationData.description,
    destinationData.latitude,
    destinationData.longitude,
    destinationData.category,
    destinationData.indoor_outdoor,
    destinationData.admission_fee,
    destinationData.image
  ];
  
  try {
    const [result] = await db.execute(query, values);
    return { id: result.insertId, ...destinationData, status: 1 };
  } catch (error) {
    console.error('여행지 등록 중 오류:', error);
    throw error;
  }
};

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
        image = ?
    WHERE id = ?
  `;
  
  const values = [
    updateData.name,
    updateData.description,
    updateData.latitude,
    updateData.longitude,
    updateData.category,
    updateData.indoor_outdoor,
    updateData.admission_fee,
    updateData.image,
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