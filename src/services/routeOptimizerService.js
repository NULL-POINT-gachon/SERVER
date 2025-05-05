const tripRepository = require('../repositories/tripRepository');
const { calculateDistanceMatrix, solveTSP } = require('../utils/optimizerUtils');

// ✅ 일정별 최적 경로 계산
exports.getOptimizedRouteByTripId = async (tripId) => {
  const placesByDate = await tripRepository.getPlacesGroupedByDate(tripId);
  const resultDays = [];
  let totalDistance = 0;
  let totalTime = 0;
  let dayCounter = 1;

  for (const [date, places] of Object.entries(placesByDate)) {
    if (places.length < 1) continue;
    let optimizedPlaces = [];

    if (places.length === 1) {
      optimizedPlaces = [{ ...places[0], 방문순서: 1, distanceFromPrevious: 0 }];
    } else {
      const distanceMatrix = calculateDistanceMatrix(places);
      const order = solveTSP(distanceMatrix);

      optimizedPlaces = order.map((idx, i) => {
        const dist = i === 0 ? 0 : distanceMatrix[order[i - 1]][order[i]];
        totalDistance += dist;
        totalTime += (dist / 40) * 60;
        return {
          ...places[idx],
          방문순서: i + 1,
          distanceFromPrevious: dist
        };
      });
    }

    const transportList = [];
    for (let i = 0; i < optimizedPlaces.length - 1; i++) {
      transportList.push({
        출발여행지식별자: optimizedPlaces[i].식별자,
        도착지여행지식별자: optimizedPlaces[i + 1].식별자,
        id: 2,
        수단명: "대중교통",
        예상소요시간: Math.round(optimizedPlaces[i + 1].distanceFromPrevious / 40 * 60)
      });
    }

    resultDays.push({
      day: dayCounter++,
      places: optimizedPlaces.map(p => ({
        식별자: p.식별자,
        여행지명: p.여행지명,
        방문순서: p.방문순서,
        예상방문시간: p.예상방문시간 ?? 90
      })),
      transportation: transportList
    });
  }

  return {
    days: resultDays,
    총거리: parseFloat(totalDistance.toFixed(2)),
    예상소요시간: Math.round(totalTime),
    생성일자: new Date().toISOString()
  };
};

// ✅ 저장
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

// ✅ 총 이동 거리/시간 계산
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
      totalTime += (d / 40) * 60;
    }
  }

  return {
    tripId,
    totalDistance: parseFloat(totalDistance.toFixed(2)),
    estimatedTime: Math.round(totalTime)
  };
};

// ✅ 최적 경로 저장 호출
exports.optimizeScheduleById = async (scheduleId) => {
  const optimized = await exports.getOptimizedRouteByTripId(scheduleId);
  await tripRepository.updateVisitOrderAndDistanceBulk(scheduleId, optimized.days);
};

// ✅ 전체 이동수단 변경
exports.updateTransportation = async (tripId, transportationId) => {
  return await tripRepository.updateTransportationForTrip(tripId, transportationId);
};

// ✅ 거리 계산 함수
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}