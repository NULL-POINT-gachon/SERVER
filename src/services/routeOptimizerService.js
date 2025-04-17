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