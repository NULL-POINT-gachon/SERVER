const tripRepository = require('../repositories/tripRepository');
const { solveTSP } = require('../utils/optimizerUtils');
const {
  getCoordinatesByPlaceNames,
  getRouteDetailsFromOrder
} = require('../utils/kakaoMapUtils');
const { getDistanceMatrixFromGoogle } = require('../utils/googleMapUtils'); // ✅ 구글 API

// ✅ 최적 경로 계산 (Google API 사용)
exports.optimizeRouteFromClientData = async (optimizeRequestDto) => {
  const resultDays = [];
  let totalDistance = 0;
  let totalDuration = 0;

  for (const day of optimizeRequestDto.days) {
    const placeTitles = day.items.map(p => p.title);
    const coordinates = await getCoordinatesByPlaceNames(placeTitles);

    // ✅ 카카오 Distance Matrix → 🔁 구글로 변경
    const { distanceMatrix } = await getDistanceMatrixFromGoogle(coordinates);

    const order = solveTSP(distanceMatrix);

    const routeDetails = await getRouteDetailsFromOrder(
      coordinates,
      order,
      optimizeRequestDto.transportMode
    );

    // ✅ 디버깅: 각 day 마다 출력
    console.log(`🧭 Day ${day.day}`);
    console.log('📍 Coordinates:', coordinates);
    console.log('📐 Distance Matrix:', distanceMatrix);
    console.log('📊 TSP Order:', order);
    console.log('🚗 Route Details:', routeDetails);

    const orderedItems = order.map((idx, i) => {
      const original = day.items[idx];
      const next = routeDetails[i] || {};
      const coord = coordinates[idx]; // ✅ 좌표 정보 추가

      return {
        title: original.title,
        time: original.time,
        tags: original.tags,
        image: original.image,
        order: i + 1,
        lat: coord.lat,               // ✅ 추가
        lng: coord.lng,               // ✅ 추가
        nextPlaceDistance: next.distance ?? null,
        nextPlaceDuration: next.duration ?? null,
        nextPlaceTransport: optimizeRequestDto.transportMode
      };
    });

    const dayDistance = routeDetails.reduce((acc, cur) => acc + (cur.distance || 0), 0);
    const dayDuration = routeDetails.reduce((acc, cur) => acc + (cur.duration || 0), 0);

    resultDays.push({
      day: day.day,
      items: orderedItems,
      totalDistance: parseFloat(dayDistance.toFixed(2)),
      totalDuration: Math.round(dayDuration)
    });

    totalDistance += dayDistance;
    totalDuration += dayDuration;
  }

  return {
    days: resultDays,
    totalDistance: parseFloat(totalDistance.toFixed(2)),
    totalDuration: Math.round(totalDuration)
  };
};

// ✅ 최적 경로 저장
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

// ✅ 거리/시간 총합 계산
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

// ✅ 일정 단위 최적화
exports.optimizeScheduleById = async (scheduleId) => {
  const optimized = await exports.getOptimizedRouteByTripId(scheduleId);
  await tripRepository.updateVisitOrderAndDistanceBulk(scheduleId, optimized.days);
};

// ✅ 교통수단 변경
exports.updateTransportation = async (tripId, transportationId) => {
  return await tripRepository.updateTransportationForTrip(tripId, transportationId);
};

// 🔧 거리 계산 (위경도 기반 하버사인 공식)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}