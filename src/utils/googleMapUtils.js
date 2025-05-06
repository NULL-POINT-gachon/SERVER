const axios = require('axios');
require('dotenv').config();

const GOOGLE_API_KEY = process.env.GOOGLE_MAP_API_KEY;

/**
 * 📍 Google Distance Matrix API 호출
 * @param {[{ lat: number, lng: number }]} points
 * @returns {Promise<{ distanceMatrix: number[][], durationMatrix: number[][] }>}
 */
async function getDistanceMatrixFromGoogle(points) {
  const origins = points.map(p => `${p.lat},${p.lng}`).join('|');
  const destinations = origins; // 출발지 == 목적지

  const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
    params: {
      origins,
      destinations,
      key: GOOGLE_API_KEY,
      mode: 'driving'
    }
  });

  const rows = response.data.rows;
  const distanceMatrix = [];
  const durationMatrix = [];

  for (const row of rows) {
    const distances = row.elements.map(e => e.distance?.value / 1000 || 0); // km
    const durations = row.elements.map(e => Math.round((e.duration?.value || 0) / 60)); // 분
    distanceMatrix.push(distances);
    durationMatrix.push(durations);
  }
  console.log('📦 Google API 전체 응답:', JSON.stringify(response.data, null, 2));
  return { distanceMatrix, durationMatrix };
}

module.exports = {
  getDistanceMatrixFromGoogle
};