const tripRepository = require('../repositories/tripRepository');
const { calculateDistanceMatrix, solveTSP } = require('../utils/optimizerUtils');

exports.getOptimizedRouteByTripId = async (tripId) => {
  const placesByDate = await tripRepository.getPlacesGroupedByDate(tripId);
  const result = {};

  for (const [date, places] of Object.entries(placesByDate)) {
    if (places.length < 2) {
      result[date] = places.map((p, i) => ({
        ...p,
        order: 1,
        distanceFromPrevious: 0
      }));
      continue;
    }

    const distanceMatrix = calculateDistanceMatrix(places);
    const order = solveTSP(distanceMatrix);

    const orderedPlaces = order.map((index, i) => ({
      ...places[index],
      order: i + 1,
      distanceFromPrevious: i === 0 ? 0 : distanceMatrix[order[i - 1]][order[i]]
    }));

    result[date] = orderedPlaces;
  }

  return result;
};

// ✅ 최적 경로 저장 서비스
exports.saveOptimizedRoute = async (tripId, dataByDate) => {
  for (const [date, places] of Object.entries(dataByDate)) {
    for (const place of places) {
      await tripRepository.updateVisitOrderAndDistance({
        tripId,
        placeId: place.placeId,
        date,
        order: place.order,
        distance: place.distanceFromPrevious
      });
    }
  }
};

// ✅ 전체 이동 거리 및 시간 계산
exports.calculateTotalDistanceAndTime = async (tripId) => {
  const placesByDate = await tripRepository.getPlacesGroupedByDate(tripId);
  let totalDistance = 0;
  let totalTime = 0;

  for (const date in placesByDate) {
    const places = placesByDate[date];
    for (let i = 0; i < places.length - 1; i++) {
      const from = places[i];
      const to = places[i + 1];
      const d = calculateDistance(from.latitude, from.longitude, to.latitude, to.longitude);
      totalDistance += d;
      totalTime += (d / 40) * 60; // 40km/h 기준 시간 계산
    }
  }

  return {
    tripId,
    totalDistance: parseFloat(totalDistance.toFixed(2)),
    estimatedTime: Math.round(totalTime)
  };
};

// ✅ 거리 계산 함수
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ✅ 라디안 변환 함수
function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

const db = require('../config/database'); // 실제 DB 연결

// ✅ 여행지 데이터 가져오기 (Mock 데이터 + 실제 쿼리 주석처리)
exports.getPlacesGroupedByDate = async (tripId) => {
  /*
  const [rows] = await db.query(`
    SELECT
      tj.여행지식별자 AS placeId,
      td.여행지명 AS name,
      td.위도 AS latitude,
      td.경도 AS longitude,
      tj.방문날자 AS visitDate
    FROM 여행일정_안에_여행지 tj
    JOIN 여행지 td ON tj.여행지식별자 = td.식별자
    WHERE tj.여행일정식별자 = ?
    ORDER BY tj.방문날자, tj.방문순서
  `, [tripId]);

  const grouped = {};
  for (const row of rows) {
    const date = row.visitDate.toISOString().split('T')[0];
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push({
      placeId: row.placeId,
      name: row.name,
      latitude: row.latitude,
      longitude: row.longitude
    });
  }

  return grouped;
  */

  // ✅ Mock 데이터 (Swagger 테스트용)
  return {
    "2025-06-01": [
      { placeId: 1, name: "에펠탑", latitude: 48.8584, longitude: 2.2945 },
      { placeId: 2, name: "루브르", latitude: 48.8606, longitude: 2.3376 }
    ],
    "2025-06-02": [
      { placeId: 3, name: "개선문", latitude: 48.8738, longitude: 2.2950 }
    ]
  };
};