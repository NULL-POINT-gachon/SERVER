const axios = require('axios');
require('dotenv').config();

const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY;
const KAKAO_MAP_BASE_URL = 'https://dapi.kakao.com/v2/local/search/keyword.json';
const KAKAO_ROUTE_MATRIX_URL = 'https://apis-navi.kakaomobility.com/v1/directions/matrix';
const KAKAO_ROUTE_DETAIL_URL = 'https://apis-navi.kakaomobility.com/v1/directions';

const headers = {
  Authorization: `KakaoAK ${KAKAO_REST_API_KEY}`
};

/**
 * 🔍 장소 이름으로 위도/경도 반환
 * @param {string} keyword
 * @returns {Promise<{lat: number, lng: number}>}
 */
async function getCoordinatesByKeyword(keyword) {
  const response = await axios.get(KAKAO_MAP_BASE_URL, {
    headers,
    params: { query: keyword }
  });

  const document = response.data.documents?.[0];
  if (!document) throw new Error(`No coordinate found for keyword: ${keyword}`);

  return {
    lat: parseFloat(document.y),
    lng: parseFloat(document.x)
  };
}

/**
 * 📍 거리 행렬 생성 (다수 좌표 입력 → 거리 및 시간 반환)
 * @param {[{ lat: number, lng: number }]} points
 * @param {'DRIVING' | 'BICYCLE' | 'WALK'} mode
 * @returns {Promise<{ distanceMatrix: number[][], durationMatrix: number[][] }>}
 */
async function getDistanceMatrixFromKakao(points, mode = 'DRIVING') {
  const origins = points.map(p => ({ x: p.lng, y: p.lat }));
  const destinations = origins;

  const response = await axios.post(KAKAO_ROUTE_MATRIX_URL, {
    origins,
    destinations
  }, {
    headers: {
      Authorization: `KakaoAK ${KAKAO_REST_API_KEY}`,
      'Content-Type': 'application/json'
    },
    params: { car_type: 1, priority: 'RECOMMEND', summary: false }
  });

  const rawMatrix = response.data.matrix;
  const size = points.length;
  const distanceMatrix = Array(size).fill().map(() => Array(size).fill(0));
  const durationMatrix = Array(size).fill().map(() => Array(size).fill(0));

  for (const row of rawMatrix) {
    const { originIndex, destinationIndex, distance, duration } = row;
    distanceMatrix[originIndex][destinationIndex] = distance / 1000;
    durationMatrix[originIndex][destinationIndex] = Math.round(duration / 60);
  }

  return { distanceMatrix, durationMatrix };
}

/**
 * 🔁 장소명 리스트 → 좌표 리스트
 */
async function getCoordinatesByPlaceNames(placeNames) {
  const results = [];
  for (const name of placeNames) {
    const coords = await getCoordinatesByKeyword(name);
    results.push(coords);
  }
  return results;
}

/**
 * 🚗 최적 순서에 따른 실제 경로 상세 거리/시간
 */
async function getRouteDetailsFromOrder(coords, order, mode = 'DRIVING') {
  const details = [];
  for (let i = 0; i < order.length - 1; i++) {
    const origin = coords[order[i]];
    const dest = coords[order[i + 1]];

    const response = await axios.get(KAKAO_ROUTE_DETAIL_URL, {
      headers: { Authorization: `KakaoAK ${KAKAO_REST_API_KEY}` },
      params: {
        origin: `${origin.lng},${origin.lat}`,
        destination: `${dest.lng},${dest.lat}`,
        priority: 'RECOMMEND',
        car_type: 1
      }
    });

    const route = response.data.routes?.[0];
    if (!route) {
      details.push({ distance: null, duration: null });
    } else {
      details.push({
        distance: route.summary?.distance ? route.summary.distance / 1000 : null,
        duration: route.summary?.duration ? Math.round(route.summary.duration / 60) : null
      });
    }
  }
  return details;
}

module.exports = {
  getCoordinatesByKeyword,
  getDistanceMatrixFromKakao,
  getCoordinatesByPlaceNames,
  getRouteDetailsFromOrder
};