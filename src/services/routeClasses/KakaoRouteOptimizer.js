require("dotenv").config();
const axios = require("axios");

const KAKAO_REST_KEY = process.env.KAKAO_REST_KEY;

class KakaoRouteOptimizer {
  constructor() {
    this.distanceCache = new Map();
    this.apiCallCount = 0;
  }

  async optimizePlaceOrder(places, options = {}) {
    console.log(`🗺️ 카카오 경로 최적화 시작: ${places.length}개 장소`);

    if (!places || places.length <= 2) {
      console.log("✅ 최적화 불필요 (장소 수가 적음)");
      return places;
    }

    const validPlaces = places.filter(p => p.lat && p.lng);
    if (validPlaces.length <= 2) return validPlaces;

    try {
      const distanceMatrix = await this.calculateKakaoDistanceMatrix(validPlaces);
      const optimizedIndices = this.solveNearestNeighborTSP(distanceMatrix);
      const optimizedPlaces = optimizedIndices.map(index => validPlaces[index]);

      const { totalDistance, totalDuration } = this.calculateTotalMetrics(optimizedIndices, distanceMatrix);
      
      console.log(`🎯 카카오 최적화 완료:`);
      console.log(`   - 총 이동거리: ${(totalDistance / 1000).toFixed(1)}km`);
      console.log(`   - 총 이동시간: ${Math.round(totalDuration / 60)}분`);
      console.log(`   - API 호출: ${this.apiCallCount}회`);

      return optimizedPlaces;

    } catch (error) {
      console.error("❌ 카카오 최적화 실패:", error.message);
      console.log("🔄 하버사인 거리로 fallback");
      return await this.fallbackToHaversine(validPlaces);
    }
  }

  async calculateKakaoDistanceMatrix(places) {
    console.log("📊 카카오 API로 거리 매트릭스 계산 중...");
    
    const matrix = [];
    let cacheHits = 0;
    let apiCalls = 0;

    for (let i = 0; i < places.length; i++) {
      matrix[i] = [];
      for (let j = 0; j < places.length; j++) {
        if (i === j) {
          matrix[i][j] = { distance: 0, duration: 0 };
        } else {
          const cacheKey = this.getDistanceCacheKey(places[i], places[j]);
          
          if (this.distanceCache.has(cacheKey)) {
            matrix[i][j] = this.distanceCache.get(cacheKey);
            cacheHits++;
          } else {
            const routeData = await this.getKakaoRoute(places[i], places[j]);
            matrix[i][j] = routeData;
            this.distanceCache.set(cacheKey, routeData);
            apiCalls++;
            
            if (apiCalls % 5 === 0) {
              await this.sleep(100);
            }
          }
        }
      }
    }

    console.log(`💾 카카오 API 캐시 적중률: ${cacheHits}/${places.length * places.length}`);
    console.log(`📞 카카오 API 신규 호출: ${apiCalls}회`);
    
    return matrix;
  }

  async getKakaoRoute(origin, destination) {
    try {
      this.apiCallCount++;
      
      const response = await axios.get(
        "https://apis-navi.kakaomobility.com/v1/directions",
        {
          params: {
            origin: `${origin.lng},${origin.lat}`,
            destination: `${destination.lng},${destination.lat}`,
            priority: "RECOMMEND",
            car_fuel: "GASOLINE",
            car_hipass: false,
            alternatives: false,
            road_details: false
          },
          headers: {
            Authorization: `KakaoAK ${KAKAO_REST_KEY}`,
            "Content-Type": "application/json"
          },
          timeout: 5000
        }
      );

      const route = response.data.routes?.[0];
      if (!route) {
        throw new Error("카카오에서 경로를 찾을 수 없음");
      }

      return {
        distance: route.summary.distance,
        duration: route.summary.duration
      };

    } catch (error) {
      if (error.response) {
        const status = error.response.status;
        console.error(`카카오 API 오류 [${status}]:`, error.response.data);
        
        if (status === 429) {
          await this.sleep(1000);
          throw new Error("카카오 API 호출 한도 초과");
        }
      }

      console.warn(`카카오 API 실패, 하버사인 거리 사용`);
      
      const distance = this.calculateHaversineDistance(
        origin.lat, origin.lng,
        destination.lat, destination.lng
      ) * 1000;
      
      return {
        distance: distance,
        duration: distance / 1000 * 60
      };
    }
  }

  solveNearestNeighborTSP(distanceMatrix) {
    const n = distanceMatrix.length;
    const visited = new Array(n).fill(false);
    const route = [];
    
    let current = 0;
    route.push(current);
    visited[current] = true;
    
    for (let i = 1; i < n; i++) {
      let nearest = -1;
      let minDistance = Infinity;
      
      for (let j = 0; j < n; j++) {
        if (!visited[j] && distanceMatrix[current][j].distance < minDistance) {
          minDistance = distanceMatrix[current][j].distance;
          nearest = j;
        }
      }
      
      if (nearest !== -1) {
        current = nearest;
        route.push(current);
        visited[current] = true;
      }
    }
    
    return route;
  }

  calculateTotalMetrics(route, distanceMatrix) {
    let totalDistance = 0;
    let totalDuration = 0;
    
    for (let i = 0; i < route.length - 1; i++) {
      const metrics = distanceMatrix[route[i]][route[i + 1]];
      totalDistance += metrics.distance;
      totalDuration += metrics.duration;
    }
    
    return { totalDistance, totalDuration };
  }

  calculateHaversineDistance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  async fallbackToHaversine(places) {
    console.log("🧮 하버사인 거리로 fallback 최적화");
    
    const matrix = [];
    for (let i = 0; i < places.length; i++) {
      matrix[i] = [];
      for (let j = 0; j < places.length; j++) {
        if (i === j) {
          matrix[i][j] = { distance: 0, duration: 0 };
        } else {
          const distance = this.calculateHaversineDistance(
            places[i].lat, places[i].lng,
            places[j].lat, places[j].lng
          ) * 1000;
          
          matrix[i][j] = {
            distance: distance,
            duration: distance / 1000 * 60
          };
        }
      }
    }

    const optimizedIndices = this.solveNearestNeighborTSP(matrix);
    const optimizedPlaces = optimizedIndices.map(index => places[index]);

    const { totalDistance } = this.calculateTotalMetrics(optimizedIndices, matrix);
    console.log(`🎯 Fallback 최적화 완료: ${(totalDistance / 1000).toFixed(1)}km`);
    
    return optimizedPlaces;
  }

  getDistanceCacheKey(place1, place2) {
    const lat1 = place1.lat.toFixed(4);
    const lng1 = place1.lng.toFixed(4);
    const lat2 = place2.lat.toFixed(4);
    const lng2 = place2.lng.toFixed(4);
    
    if (lat1 < lat2 || (lat1 === lat2 && lng1 < lng2)) {
      return `${lat1},${lng1}-${lat2},${lng2}`;
    } else {
      return `${lat2},${lng2}-${lat1},${lng1}`;
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getStats() {
    return {
      distanceCacheSize: this.distanceCache.size,
      apiCallCount: this.apiCallCount
    };
  }

  clearCache() {
    this.distanceCache.clear();
    this.apiCallCount = 0;
  }
}

module.exports = KakaoRouteOptimizer;