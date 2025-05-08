const db = require('../config/database');

// 모든 여행지 목록 조회
exports.findAllDestinations = async () => {
  const query = `
    SELECT d.id, d.destination_name, d.destination_description, 
           d.latitude, d.longitude, d.category, d.indoor_outdoor, 
           d.entrance_fee, d.image
    FROM TravelDestination d
    ORDER BY d.id DESC
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
  const destinationQuery = `
    SELECT d.id, d.destination_name, d.destination_description, 
           d.latitude, d.longitude, d.category, d.indoor_outdoor, 
           d.entrance_fee, d.image
    FROM TravelDestination d
    WHERE d.id = ?
  `;
  
  // 여행지 이미지 조회 쿼리
  const imagesQuery = `
    SELECT image_id, image_path
    FROM DestinationImage
    WHERE destination_id = ?
  `;
  
  try {
    // 여행지 정보 조회
    const [destinations] = await db.execute(destinationQuery, [destinationId]);
    const destination = destinations[0];
    
    if (!destination) {
      return null;
    }
    
    // 이미지 조회
    const [images] = await db.execute(imagesQuery, [destinationId]);
    
    // 최종 결과에 이미지 추가
    destination.images = images;
    
    return destination;
  } catch (error) {
    console.error('여행지 상세 조회 중 오류:', error);
    throw error;
  }
};