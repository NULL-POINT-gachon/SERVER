const CoordinateValidator = require('./CoordinateValidator');
const RouteOptimizer = require('./RouteOptimizer');

/**
 * 1단계(좌표검증) + 2단계(경로최적화)가 통합된 서비스
 * 기존 TripRecommendationService를 건드리지 않고 새로운 버전으로 구현
 */
class Step2IntegrationService {
  constructor() {
    this.coordinateValidator = new CoordinateValidator();
    this.routeOptimizer = new RouteOptimizer();
  }

  /**
   * 기존 getFinalPlaceRecommendations 메서드를 2단계까지 적용
   */
  async getFinalPlaceRecommendations(userId, tripDto, tripId) {
    try {
      console.log("🚀 2단계 통합 여행 추천 시작");

      /* ---------- 기존 AI 호출 & TourAPI 보강 (시뮬레이션) ---------- */
      const aiReq = tripDto.toAIRequestFormat();
      console.log("AI 요청:", aiReq);

      // 실제로는 Python 스크립트 호출하겠지만 여기서는 시뮬레이션
      const raw = await this.simulateCallPythonScript(aiReq);
      let places = await this.simulateEnrichPlacesWithTourAPI(raw, aiReq.city);

      console.log(`📍 AI + TourAPI에서 받은 장소: ${places.length}개`);

      /* ---------- 1단계: 좌표 검증 & 필터링 ---------- */
      console.log("\n=== 1단계: 좌표 검증 시작 ===");
      const validationResult = await this.coordinateValidator.validatePlaceCoordinates(
        places, 
        aiReq.city
      );

      if (validationResult.validPlaces.length === 0) {
        throw new Error("유효한 좌표를 가진 장소를 찾을 수 없습니다.");
      }

      places = validationResult.validPlaces;
      console.log(`✅ 1단계 완료: ${validationResult.stats.success}/${validationResult.stats.total}개 장소 유효`);

      /* ---------- 2단계: 경로 최적화 ---------- */
      console.log("\n=== 2단계: 경로 최적화 시작 ===");
      const optimizedPlaces = await this.routeOptimizer.optimizePlaceOrder(places, {
        algorithm: 'auto',
        travelMode: 'driving'
      });

      console.log(`✅ 2단계 완료: ${optimizedPlaces.length}개 장소 최적화 완료`);

      /* ---------- 날짜 범위 계산 (기존 로직) ---------- */
      const MS_DAY = 86_400_000;
      const startDate = aiReq.visit_date ? new Date(aiReq.visit_date) :
                       aiReq.departure_date ? new Date(aiReq.departure_date) :
                       new Date();

      let daysCnt = Number(aiReq.trip_duration) || 0;
      if (!daysCnt && aiReq.visit_date && aiReq.departure_date) {
        const dt1 = new Date(aiReq.visit_date.split("T")[0]);
        const dt2 = new Date(aiReq.departure_date.split("T")[0]);
        daysCnt = Math.max(1, Math.round((dt2 - dt1) / MS_DAY) + 1);
      }
      if (!daysCnt) daysCnt = 1;

      console.log(`📅 여행 기간: ${daysCnt}일`);

      /* ---------- 일차별 분배 (3단계에서 개선 예정, 지금은 단순 분배) ---------- */
      console.log("\n=== 일차별 분배 (단순 균등분배) ===");
      const perDay = Math.ceil(optimizedPlaces.length / daysCnt);
      const plan = { days: [] };
      const flatPlaces = [];

      for (let d = 0; d < daysCnt; d++) {
        const daySlice = optimizedPlaces.slice(d * perDay, (d + 1) * perDay);
        const visitDate = new Date(startDate.getTime() + d * MS_DAY)
          .toISOString()
          .slice(0, 10);

        const cards = daySlice.map((p, idx) => {
          const order = d * perDay + idx + 1;
          const title = p.place_name || p["여행지명"];

          // DB 저장용 데이터
          flatPlaces.push({
            title,
            description: p.description ?? `${title}의 멋진 장소입니다.`,
            image: p.image || "/images/default-place.png",
            category: this.generatePlaceTags(
              p.activity_ids,
              p.emotion_ids,
              p["분류"]
            )[0] ?? null,
            order,
            visit_date: visitDate,
            lat: p.lat,
            lng: p.lng,
            road_address: p.road_address || null,
            validation_source: p.source || 'unknown'
          });

          // 프론트엔드용 카드
          return {
            id: `${d + 1}-${idx + 1}`,
            title,
            description: p.description ?? `${title}의 멋진 장소입니다.`,
            image: p.image || "/images/default-place.png",
            tags: this.generatePlaceTags(
              p.activity_ids,
              p.emotion_ids,
              p["분류"]
            ),
            region: aiReq.city?.toLowerCase() || "unknown",
            visit_date: visitDate,
            lat: p.lat,
            lng: p.lng,
            road_address: p.road_address || null
          };
        });

        plan.days.push({ 
          day: d + 1, 
          items: cards,
          totalPlaces: cards.length
        });
      }

      /* ---------- DB 저장 (시뮬레이션) ---------- */
      console.log("\n💾 DB 저장 중...");
      await this.simulateSaveRecommendations(userId, tripId, flatPlaces);

      /* ---------- 최종 결과 반환 ---------- */
      console.log(`\n🎉 2단계 통합 완료: ${daysCnt}일 여행 계획 생성 (총 ${optimizedPlaces.length}개 장소)`);
      console.log("\n📊 처리 통계:");
      console.log("- 좌표 검증:", this.coordinateValidator.getCacheStats());
      console.log("- 경로 최적화:", this.routeOptimizer.getStats());

      return {
        plan,
        stats: {
          originalPlaces: raw.length,
          validatedPlaces: validationResult.stats.success,
          optimizedPlaces: optimizedPlaces.length,
          totalDays: daysCnt,
          coordinateValidation: this.coordinateValidator.getCacheStats(),
          routeOptimization: this.routeOptimizer.getStats()
        }
      };

    } catch (err) {
      console.error("❌ 2단계 통합 여행지 추천 서비스 오류:", err);
      throw new Error(`여행지 추천을 가져오는 중 오류가 발생했습니다: ${err.message}`);
    }
  }

  /* ---------- 시뮬레이션 메서드들 (실제 구현에서는 기존 메서드 호출) ---------- */

  async simulateCallPythonScript(aiReq) {
    console.log("🐍 Python AI 스크립트 호출 (시뮬레이션)");
    
    // 실제로는: return await this.callPythonScript(aiReq);
    // 시뮬레이션용 가짜 데이터
    return [
      { place_name: "경복궁", description: "조선시대 대표 궁궐", 분류: "관광지" },
      { place_name: "명동성당", description: "한국 최초의 벽돌 성당", 분류: "종교시설" },
      { place_name: "남산타워", description: "서울의 랜드마크", 분류: "관광지" },
      { place_name: "동대문디자인플라자", description: "현대적 디자인의 복합문화공간", 분류: "문화시설" },
      { place_name: "청계천", description: "도심 속 휴식공간", 분류: "공원" },
      { place_name: "한강공원", description: "한강변 공원", 분류: "공원" },
      { place_name: "인사동", description: "전통문화거리", 분류: "쇼핑" },
      { place_name: "홍대거리", description: "젊음의 거리", 분류: "엔터테인먼트" }
    ];
  }

  async simulateEnrichPlacesWithTourAPI(raw, city) {
    console.log("🏛️  Tour API 보강 (시뮬레이션)");
    
    // 실제로는: return await this.enrichPlacesWithTourAPI(raw, city);
    // 기본 정보 보강
    return raw.map(place => ({
      ...place,
      image: `/images/${place.place_name}.jpg`,
      activity_ids: [1, 2],
      emotion_ids: [1, 3],
      city: city
    }));
  }

  async simulateSaveRecommendations(userId, tripId, flatPlaces) {
    console.log(`💾 DB 저장: userId=${userId}, tripId=${tripId}, places=${flatPlaces.length}개`);
    
    // 실제로는: await placeRepository.saveRecommendations(userId, tripId, flatPlaces);
    // 시뮬레이션에서는 로그만 출력
    console.log("✅ DB 저장 완료 (시뮬레이션)");
  }

  generatePlaceTags(activityIds = [], emotionIds = [], category) {
    // 실제로는 기존 구현 호출
    return [category].filter(Boolean);
  }

  /* ---------- 유틸리티 메서드들 ---------- */

  /**
   * 캐시 초기화
   */
  clearAllCaches() {
    this.coordinateValidator.clearCache();
    this.routeOptimizer.clearCache();
    console.log("🗑️  모든 캐시가 초기화되었습니다.");
  }

  /**
   * 전체 통계 조회
   */
  getAllStats() {
    return {
      coordinateValidation: this.coordinateValidator.getCacheStats(),
      routeOptimization: this.routeOptimizer.getStats()
    };
  }
}

// 테스트용 DTO 시뮬레이션
class MockTripDto {
  constructor(data) {
    this.data = data;
  }

  toAIRequestFormat() {
    return {
      city: this.data.city || "서울",
      visit_date: this.data.visit_date || "2024-12-01",
      departure_date: this.data.departure_date || "2024-12-03",
      trip_duration: this.data.trip_duration || 3,
      preferences: this.data.preferences || {}
    };
  }
}

module.exports = {
  Step2IntegrationService,
  MockTripDto
};