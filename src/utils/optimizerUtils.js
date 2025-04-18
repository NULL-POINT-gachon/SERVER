// 위경도 거리 계산 (Haversine)
function haversine(lat1, lon1, lat2, lon2) {
    const toRad = (v) => (v * Math.PI) / 180;
    const R = 6371; // 지구 반지름 (km)
  
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  
  // 장소 간 거리 행렬 생성
  function calculateDistanceMatrix(places) {
    const matrix = [];
  
    for (let i = 0; i < places.length; i++) {
      matrix[i] = [];
      for (let j = 0; j < places.length; j++) {
        if (i === j) matrix[i][j] = 0;
        else matrix[i][j] = haversine(
          places[i].latitude, places[i].longitude,
          places[j].latitude, places[j].longitude
        );
      }
    }
  
    return matrix;
  }
  
  // Nearest Neighbor 기반 경로 계산
  function solveTSP(matrix) {
    const n = matrix.length;
    const visited = new Array(n).fill(false);
    const path = [0]; // 시작점을 0번으로 고정
    visited[0] = true;
  
    for (let step = 1; step < n; step++) {
      const last = path[path.length - 1];
      let nearest = -1;
      let minDist = Infinity;
  
      for (let i = 0; i < n; i++) {
        if (!visited[i] && matrix[last][i] < minDist) {
          nearest = i;
          minDist = matrix[last][i];
        }
      }
  
      path.push(nearest);
      visited[nearest] = true;
    }
  
    return path; // index 순서 배열로 리턴
  }
  
  module.exports = {
    haversine,
    calculateDistanceMatrix,
    solveTSP,
  };