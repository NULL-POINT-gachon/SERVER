require("dotenv").config();
const axios = require("axios");

const KAKAO_REST_KEY = process.env.KAKAO_REST_KEY;

class CoordinateValidator {
  constructor() {
    this.cache = new Map(); // 메모리 캐시
    this.apiCallCount = 0;  // API 호출 횟수 추적
    this.duplicateStats = {
      duplicatesFound: 0,
      duplicatesRemoved: 0,
      duplicatesList: []
    };
  }

  /**
   * 장소 배열의 좌표를 검증하고 유효한 장소만 반환
   * @param {Array} places - 장소 배열
   * @param {string} city - 도시명
   * @param {Object} options - 옵션
   * @returns {Array} 유효한 좌표를 가진 장소 배열
   */
  async validatePlaceCoordinates(places, city, options = {}) {
    const {
      removeDuplicates = true,
      duplicateStrategy = 'first', // 'first', 'best', 'coordinates'
      coordinateThreshold = 0.001   // 좌표 기반 중복 판단 임계값 (약 100m)
    } = options;

    console.log(`🔍 좌표 검증 시작: ${places.length}개 장소 (도시: ${city})`);
    
    // 중복 제거 (좌표 검증 전에 실행)
    let processedPlaces = places;
    if (removeDuplicates) {
      processedPlaces = this.removeDuplicatePlaces(places, duplicateStrategy, coordinateThreshold);
      console.log(`🗑️  중복 제거: ${places.length}개 → ${processedPlaces.length}개 장소`);
    }
    
    const startTime = Date.now();
    const results = [];
    const errors = [];

    for (let i = 0; i < processedPlaces.length; i++) {
      const place = processedPlaces[i];
      const placeName = place.place_name || place["여행지명"];
      
      console.log(`[${i + 1}/${processedPlaces.length}] 처리 중: ${placeName}`);

      try {
        const coordinateData = await this.getCoordinates(place, city);
        
        if (coordinateData) {
          results.push({
            ...place,
            ...coordinateData,
            validation_status: 'success'
          });
          console.log(`✅ 성공: ${placeName} (${coordinateData.lat}, ${coordinateData.lng})`);
        } else {
          errors.push({
            place_name: placeName,
            error: 'coordinates_not_found',
            message: '좌표를 찾을 수 없음'
          });
          console.log(`❌ 실패: ${placeName} - 좌표를 찾을 수 없음`);
        }
      } catch (error) {
        errors.push({
          place_name: placeName,
          error: error.code || 'unknown_error',
          message: error.message
        });
        console.log(`💥 오류: ${placeName} - ${error.message}`);
      }
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    // 결과 요약 로그
    console.log(`\n📊 좌표 검증 완료 요약:`);
    console.log(`- 원본 장소: ${places.length}개`);
    if (removeDuplicates && this.duplicateStats.duplicatesRemoved > 0) {
      console.log(`- 중복 제거: ${this.duplicateStats.duplicatesRemoved}개`);
      console.log(`- 처리 장소: ${processedPlaces.length}개`);
    }
    console.log(`- 성공: ${results.length}개`);
    console.log(`- 실패: ${errors.length}개`);
    console.log(`- 소요시간: ${duration}ms`);
    console.log(`- API 호출: ${this.apiCallCount}회`);

    if (removeDuplicates && this.duplicateStats.duplicatesList.length > 0) {
      console.log(`\n🗑️  제거된 중복 장소들:`);
      this.duplicateStats.duplicatesList.forEach((dup, idx) => {
        console.log(`${idx + 1}. ${dup.name} (${dup.reason})`);
      });
    }

    if (errors.length > 0) {
      console.log(`\n❌ 실패한 장소들:`);
      errors.forEach((err, idx) => {
        console.log(`${idx + 1}. ${err.place_name}: ${err.message}`);
      });
    }

    return {
      validPlaces: results,
      errors: errors,
      duplicateStats: this.duplicateStats,
      stats: {
        original: places.length,
        afterDuplicateRemoval: processedPlaces.length,
        success: results.length,
        failed: errors.length,
        duration: duration,
        apiCalls: this.apiCallCount
      }
    };
  }

  /**
   * 🗑️ 중복 장소 제거
   */
  removeDuplicatePlaces(places, strategy = 'first', coordinateThreshold = 0.001) {
    console.log(`🗑️  중복 제거 시작 (전략: ${strategy})`);
    
    // 통계 초기화
    this.duplicateStats = {
      duplicatesFound: 0,
      duplicatesRemoved: 0,
      duplicatesList: []
    };

    const uniquePlaces = [];
    const seenPlaces = new Map(); // 이름 기반 중복 체크
    const seenCoordinates = new Map(); // 좌표 기반 중복 체크

    for (const place of places) {
      const placeName = this.normalizePlaceName(place.place_name || place["여행지명"]);
      const isDuplicate = this.checkDuplicate(place, placeName, seenPlaces, seenCoordinates, coordinateThreshold);

      if (!isDuplicate) {
        uniquePlaces.push(place);
        
        // 이름 기반 등록
        if (!seenPlaces.has(placeName)) {
          seenPlaces.set(placeName, []);
        }
        seenPlaces.get(placeName).push(place);

        // 좌표 기반 등록 (좌표가 있는 경우)
        if (place.lat && place.lng) {
          const coordKey = `${Number(place.lat).toFixed(4)},${Number(place.lng).toFixed(4)}`;
          seenCoordinates.set(coordKey, place);
        }
      } else {
        this.duplicateStats.duplicatesRemoved++;
      }
    }

    this.duplicateStats.duplicatesFound = places.length - uniquePlaces.length;
    
    console.log(`✅ 중복 제거 완료: ${this.duplicateStats.duplicatesFound}개 중복 발견, ${this.duplicateStats.duplicatesRemoved}개 제거`);
    
    return uniquePlaces;
  }

  /**
   * 중복 체크 로직
   */
  checkDuplicate(place, normalizedName, seenPlaces, seenCoordinates, coordinateThreshold) {
    const placeName = place.place_name || place["여행지명"];

    // 1. 정확한 이름 매칭
    if (seenPlaces.has(normalizedName)) {
      this.duplicateStats.duplicatesList.push({
        name: placeName,
        reason: '동일한 장소명'
      });
      return true;
    }

    // 2. 유사한 이름 매칭 (부분 문자열)
    for (const [seenName, seenPlace] of seenPlaces.entries()) {
      if (this.isSimilarName(normalizedName, seenName)) {
        this.duplicateStats.duplicatesList.push({
          name: placeName,
          reason: `유사한 장소명 (${seenName}와 유사)`
        });
        return true;
      }
    }

    // 3. 좌표 기반 중복 체크 (좌표가 있는 경우)
    if (place.lat && place.lng) {
      const lat = Number(place.lat);
      const lng = Number(place.lng);
      
      for (const [coordKey, seenPlace] of seenCoordinates.entries()) {
        const [seenLat, seenLng] = coordKey.split(',').map(Number);
        const distance = this.calculateCoordinateDistance(lat, lng, seenLat, seenLng);
        
        if (distance <= coordinateThreshold) {
          this.duplicateStats.duplicatesList.push({
            name: placeName,
            reason: `좌표 근접 (${distance.toFixed(4)} 이내)`
          });
          return true;
        }
      }
    }

    return false;
  }

  /**
   * 장소명 정규화 (비교를 위해)
   */
  normalizePlaceName(name) {
    return name
      .toLowerCase()
      .replace(/\s+/g, '')           // 공백 제거
      .replace(/[.,\-()]/g, '')      // 특수문자 제거
      .replace(/점$|본점$|지점$/g, '') // 점, 본점, 지점 제거
      .trim();
  }

  /**
   * 유사한 이름인지 체크
   */
  isSimilarName(name1, name2) {
    // 1. 한쪽이 다른 쪽을 포함하는 경우
    if (name1.includes(name2) || name2.includes(name1)) {
      return true;
    }

    // 2. 레벤슈타인 거리 체크 (간단한 버전)
    if (this.calculateEditDistance(name1, name2) <= 2 && Math.min(name1.length, name2.length) >= 3) {
      return true;
    }

    return false;
  }

  /**
   * 편집 거리 계산 (레벤슈타인 거리)
   */
  calculateEditDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * 좌표 간 거리 계산 (단순 유클리드)
   */
  calculateCoordinateDistance(lat1, lng1, lat2, lng2) {
    return Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lng2 - lng1, 2));
  }

  async getCoordinates(place, city) {
    // 이미 좌표가 있으면 검증만 하고 반환
    if (place.lat && place.lng) {
      console.log(`🔄 기존 좌표 사용: ${place.lat}, ${place.lng}`);
      return {
        lat: Number(place.lat),
        lng: Number(place.lng),
        source: 'existing'
      };
    }

    const placeName = place.place_name || place["여행지명"];
    const cacheKey = this.generateCacheKey(placeName, city);

    // 캐시 확인
    if (this.cache.has(cacheKey)) {
      console.log(`💾 캐시에서 로드: ${placeName}`);
      return this.cache.get(cacheKey);
    }

    // 카카오 API 호출
    try {
      const coordinateData = await this.fetchFromKakaoAPI(placeName, city);
      
      if (coordinateData) {
        // 캐시에 저장
        this.cache.set(cacheKey, coordinateData);
        return coordinateData;
      }
      
      return null;
    } catch (error) {
      console.error(`카카오 API 호출 실패: ${placeName}`, error);
      throw error;
    }
  }

  async fetchFromKakaoAPI(placeName, city) {
    // 검색 쿼리 생성 (도시명 포함)
    const queries = this.generateSearchQueries(placeName, city);
    
    for (const query of queries) {
      try {
        console.log(`🔍 카카오 API 검색: "${query}"`);
        this.apiCallCount++;

        const response = await axios.get(
          "https://dapi.kakao.com/v2/local/search/keyword.json",
          {
            params: { 
              query: query,
              size: 15,
              page: 1
            },
            headers: { 
              Authorization: `KakaoAK ${KAKAO_REST_KEY}` 
            },
            timeout: 5000
          }
        );

        const documents = response.data.documents;
        
        if (!documents || documents.length === 0) {
          console.log(`📭 검색 결과 없음: "${query}"`);
          continue;
        }

        console.log(`📍 ${documents.length}개 결과 발견`);

        // 최적의 결과 선택
        const bestMatch = this.selectBestMatch(documents, placeName, city);
        
        if (bestMatch) {
          const result = {
            lat: Number(bestMatch.y),
            lng: Number(bestMatch.x),
            road_address: bestMatch.road_address_name || bestMatch.address_name,
            place_id: bestMatch.id,
            category: bestMatch.category_name,
            phone: bestMatch.phone,
            place_url: bestMatch.place_url,
            source: 'kakao_api',
            query_used: query,
            confidence: this.calculateConfidence(bestMatch, placeName, city)
          };

          console.log(`🎯 최적 매칭: ${bestMatch.place_name} (신뢰도: ${result.confidence})`);
          return result;
        }

      } catch (error) {
        if (error.response) {
          const status = error.response.status;
          const errorData = error.response.data;
          
          console.error(`카카오 API 오류 [${status}]:`, errorData);
          
          if (status === 429) {
            throw new Error(`API 호출 한도 초과. 잠시 후 다시 시도해주세요.`);
          } else if (status === 401) {
            throw new Error(`카카오 API 인증 실패. API 키를 확인해주세요.`);
          } else {
            throw new Error(`카카오 API 오류: ${errorData.message || 'Unknown error'}`);
          }
        } else if (error.code === 'ECONNABORTED') {
          throw new Error(`카카오 API 타임아웃: 네트워크 연결을 확인해주세요.`);
        } else {
          throw new Error(`네트워크 오류: ${error.message}`);
        }
      }
    }

    return null;
  }

  generateSearchQueries(placeName, city) {
    const queries = [];
    
    if (city) {
      queries.push(`${city} ${placeName}`);
      queries.push(`${placeName} ${city}`);
    }
    
    queries.push(placeName);
    
    if (city) {
      queries.push(`"${placeName}" ${city}`);
    }
    
    return queries;
  }

  selectBestMatch(documents, placeName, city) {
    // 정확한 이름 매칭 우선
    let exactMatch = documents.find(doc => 
      doc.place_name === placeName || 
      doc.place_name.includes(placeName)
    );
    
    if (exactMatch) {
      console.log(`🎯 정확한 이름 매칭: ${exactMatch.place_name}`);
      return exactMatch;
    }

    // 도시명 매칭 우선
    if (city) {
      let cityMatch = documents.find(doc => 
        (doc.address_name && doc.address_name.includes(city)) ||
        (doc.road_address_name && doc.road_address_name.includes(city))
      );
      
      if (cityMatch) {
        console.log(`🏙️ 도시명 매칭: ${cityMatch.place_name}`);
        return cityMatch;
      }
    }

    // 가장 첫 번째 결과
    console.log(`📍 첫 번째 결과 선택: ${documents[0].place_name}`);
    return documents[0];
  }

  calculateConfidence(result, placeName, city) {
    let confidence = 50;

    if (result.place_name === placeName) {
      confidence += 30;
    } else if (result.place_name.includes(placeName)) {
      confidence += 20;
    } else if (placeName.includes(result.place_name)) {
      confidence += 15;
    }

    if (city) {
      if (result.address_name?.includes(city) || result.road_address_name?.includes(city)) {
        confidence += 20;
      }
    }

    return Math.min(100, confidence);
  }

  generateCacheKey(placeName, city) {
    return `${city || 'unknown'}_${placeName}`.toLowerCase();
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      apiCalls: this.apiCallCount
    };
  }

  /**
   * 🗑️ 중복 제거 통계 조회
   */
  getDuplicateStats() {
    return { ...this.duplicateStats };
  }

  clearCache() {
    this.cache.clear();
    this.apiCallCount = 0;
    this.duplicateStats = {
      duplicatesFound: 0,
      duplicatesRemoved: 0,
      duplicatesList: []
    };
    console.log("🗑️ 캐시가 초기화되었습니다.");
  }
}

module.exports = CoordinateValidator;