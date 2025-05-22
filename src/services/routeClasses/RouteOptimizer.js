require("dotenv").config();
const axios = require("axios");

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

class RouteOptimizer {
  constructor() {
    this.distanceCache = new Map();
    this.apiCallCount = 0;
  }

  async optimizePlaceOrder(places, options = {}) {
    const { algorithm = 'auto', travelMode = 'driving' } = options;

    console.log(`🗺️  경로 최적화 시작: ${places.length}개 장소 (알고리즘: ${algorithm})`);

    if (!places || places.length <= 2) {
      console.log("✅ 최적화 불필요 (장소 수가 적음)");
      return places;
    }

    const validPlaces = places.filter(p => p.lat && p.lng);
    if (validPlaces.length <= 2) return validPlaces;

    try {
      const selectedAlgorithm = algorithm === 'auto' 
        ? this.selectOptimalAlgorithm(validPlaces.length)
        : algorithm;

      console.log(`🧠 선택된 알고리즘: ${selectedAlgorithm}`);

      let optimizedPlaces = [];
      
      if (selectedAlgorithm === 'google' && GOOGLE_API_KEY) {
        try {
          optimizedPlaces = await this.optimizeWithGoogleAPI(validPlaces, travelMode);
        } catch (googleError) {
          console.error("❌ Google API 실패:", googleError.message);
          console.log("🔄 Nearest Neighbor로 fallback");
          optimizedPlaces = await this.optimizeWithNearestNeighbor(validPlaces);
        }
      } else {
        optimizedPlaces = await this.optimizeWithNearestNeighbor(validPlaces);
      }

      console.log(`✅ 경로 최적화 완료`);
      return optimizedPlaces;

    } catch (error) {
      console.error("❌ 전체 최적화 실패:", error.message);
      return validPlaces;
    }
  }

  selectOptimalAlgorithm(placeCount) {
    if (placeCount <= 4) {
      return 'nearest_neighbor';
    } else if (placeCount <= 20 && GOOGLE_API_KEY) {
      return 'google';
    } else {
      return 'nearest_neighbor';
    }
  }

  async optimizeWithGoogleAPI(places, travelMode = 'driving') {
    if (!GOOGLE_API_KEY) {
      throw new Error("Google API 키가 설정되지 않음");
    }

    console.log("🌍 Google Routes API 호출 중...");

    // 좌표 유효성 재확인
    const validatedPlaces = places.map(place => ({
      ...place,
      lat: Number(place.lat),
      lng: Number(place.lng)
    }));

    console.log("📍 입력 좌표 확인:");
    validatedPlaces.forEach((place, idx) => {
      console.log(`  ${idx + 1}. ${place.place_name}: (${place.lat}, ${place.lng})`);
    });

    try {
        const origin = validatedPlaces[0];
        const intermediates = validatedPlaces.slice(1).map(p => ({
          location: { latLng: { latitude: p.lat, longitude: p.lng } }
        }));

      const requestData = {
        origin:      { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
        destination: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
        travelMode:  'DRIVE',                 // DRIVE 여야 최적화 가능
        routingPreference: 'TRAFFIC_AWARE',   // 예: 교통 상황 반영
        optimizeWaypointOrder: true,
        intermediates
      };

      console.log("📤 API 요청 데이터:");
      console.log(JSON.stringify(requestData, null, 2));

      this.apiCallCount++;

      const FIELD_MASK = [
        'routes.optimizedIntermediateWaypointIndex',
        'routes.legs',
        'routes.distanceMeters',
        'routes.duration'
      ].join(',');
      
      // FieldMask 수정해서 시도
      const response = await axios.post(
        `https://routes.googleapis.com/directions/v2:computeRoutes`,
        requestData,
        {
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": GOOGLE_API_KEY,
            "X-Goog-FieldMask": "routes.optimizedIntermediateWaypointIndex,routes.legs,routes.duration,routes.distanceMeters"
          },
          timeout: 15000
        }
      );

      console.log("📥 API 응답 상태:", response.status);
      console.log("📥 API 응답 크기:", JSON.stringify(response.data).length, "bytes");
      
      // 응답 구조 상세 분석
      if (response.data) {
        console.log("📥 응답 키들:", Object.keys(response.data));
        
        if (response.data.routes) {
          console.log("📍 routes 배열 길이:", response.data.routes.length);
          
          if (response.data.routes.length > 0) {
            const route = response.data.routes[0];
            console.log("🛣️  첫 번째 route 키들:", Object.keys(route));
            
            if (route.optimizedIntermediateWaypointIndex) {
              console.log("🎯 최적화 인덱스:", route.optimizedIntermediateWaypointIndex);
              
              const optimizedOrder = route.optimizedIntermediateWaypointIndex;
              const optimizedPlaces = [
                origin,
                ...optimizedOrder.map(index => validatedPlaces[1 + index])
              ];

              console.log("✅ Google 최적화 성공!");
              return optimizedPlaces;
            } else {
              console.log("⚠️  optimizedIntermediateWaypointIndex가 없음");
              
              // 중간지점이 없는 경우 (2개 장소)
              if (validatedPlaces.length <= 2) {
                console.log("✅ 장소가 2개뿐이라 최적화 불필요");
                return validatedPlaces;
              } else {
                throw new Error("최적화 인덱스를 받지 못함");
              }
            }
          } else {
            throw new Error("routes 배열이 비어있음");
          }
        } else {
          console.log("❌ routes 키가 응답에 없음");
          console.log("📥 전체 응답:", JSON.stringify(response.data, null, 2));
          throw new Error("routes가 응답에 포함되지 않음");
        }
      } else {
        throw new Error("응답 데이터가 없음");
      }

    } catch (error) {
      if (error.response) {
        console.error("🚨 HTTP 오류:", error.response.status);
        console.error("🚨 오류 응답:", error.response.data);
      } else if (error.request) {
        console.error("🚨 네트워크 오류:", error.message);
      } else {
        console.error("🚨 요청 설정 오류:", error.message);
      }
      throw error;
    }
  }

  async optimizeWithNearestNeighbor(places) {
    console.log("🧮 Nearest Neighbor 알고리즘 실행 중...");

    const distanceMatrix = await this.calculateDistanceMatrix(places);
    const optimizedIndices = this.solveNearestNeighborTSP(distanceMatrix);
    const optimizedPlaces = optimizedIndices.map(index => places[index]);

    const totalDistance = this.calculateTotalDistance(optimizedIndices, distanceMatrix);
    
    console.log(`🎯 Nearest Neighbor 최적화 완료: ${totalDistance.toFixed(1)}km`);

    return optimizedPlaces;
  }

  async calculateDistanceMatrix(places) {
    const matrix = [];

    for (let i = 0; i < places.length; i++) {
      matrix[i] = [];
      for (let j = 0; j < places.length; j++) {
        if (i === j) {
          matrix[i][j] = 0;
        } else {
          const distance = this.calculateHaversineDistance(
            places[i].lat, places[i].lng,
            places[j].lat, places[j].lng
          );
          matrix[i][j] = distance;
        }
      }
    }
    
    return matrix;
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
        if (!visited[j] && distanceMatrix[current][j] < minDistance) {
          minDistance = distanceMatrix[current][j];
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

  calculateTotalDistance(route, distanceMatrix) {
    let totalDistance = 0;
    for (let i = 0; i < route.length - 1; i++) {
      totalDistance += distanceMatrix[route[i]][route[i + 1]];
    }
    return totalDistance;
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

module.exports = RouteOptimizer;
