const db = require('../config/database'); // 이건 너희 프로젝트에서 DB 연결 객체

// 여행일정 ID로 날짜별 장소 묶어서 가져오기
exports.getPlacesGroupedByDate = async (tripId) => {
    //   const [rows] = await db.query(`
    //     SELECT
    //       tj.여행지식별자 AS placeId,
    //       t.여행지명 AS name,
    //       t.위도 AS latitude,
    //       t.경도 AS longitude,
    //       tj.방문날자 AS visitDate
    //     FROM 여행일정_안에_여행지 tj
    //     JOIN 여행지 t ON tj.여행지식별자 = t.식별자
    //     WHERE tj.여행일정식별자 = ?
    //   `, [tripId]);

    //   // 날짜별로 그룹핑
    //   const grouped = {};

    //   for (const row of rows) {
    //     const date = row.visitDate.toISOString().split('T')[0]; // '2025-06-01' 형식
    //     if (!grouped[date]) grouped[date] = [];
    //     grouped[date].push(row);
    //   }

    //   return grouped;
    return {
        "2025-06-01": [
            { placeId: 1, name: "에펠탑", latitude: 48.8584, longitude: 2.2945 },
            { placeId: 2, name: "루브르", latitude: 48.8606, longitude: 2.3376 },
            { placeId: 3, name: "노트르담", latitude: 48.852968, longitude: 2.349902 }
        ],
        "2025-06-02": [
            { placeId: 4, name: "몽마르트", latitude: 48.8867, longitude: 2.3431 },
            { placeId: 5, name: "개선문", latitude: 48.8738, longitude: 2.2950 }
        ]
    };
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
  };