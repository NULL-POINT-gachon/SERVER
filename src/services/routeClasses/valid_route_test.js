const CoordinateValidator = require('./CoordinateValidator');
const RouteOptimizer = require('./RouteOptimizer');

/**
 * 2단계 전용 테스트: 경로 최적화만
 */
async function testRouteOptimization() {
  console.log("🗺️  2단계: 경로 최적화 단독 테스트\n");

  const optimizer = new RouteOptimizer();

  // 좌표가 이미 있는 테스트 장소들 (서울 주요 관광지)
  const placesWithCoords = [
    { place_name: "경복궁", lat: 37.5796, lng: 126.9770 },
    { place_name: "명동성당", lat: 37.5633, lng: 126.9738 },
    { place_name: "남산타워", lat: 37.5512, lng: 126.9882 },
    { place_name: "동대문디자인플라자", lat: 37.5676, lng: 127.0095 },
    { place_name: "청계천", lat: 37.5664, lng: 126.9779 },
    { place_name: "한강공원", lat: 37.5326, lng: 126.9689 }
  ];

  try {
    console.log("📍 원본 장소 순서:");
    placesWithCoords.forEach((place, idx) => {
      console.log(`${idx + 1}. ${place.place_name} (${place.lat}, ${place.lng})`);
    });

    // Nearest Neighbor 알고리즘 테스트
    console.log("\n🧮 Nearest Neighbor 알고리즘 테스트:");
    const optimizedNN = await optimizer.optimizePlaceOrder(placesWithCoords, {
      algorithm: 'nearest_neighbor'
    });

    console.log("\n🎯 최적화된 순서 (Nearest Neighbor):");
    optimizedNN.forEach((place, idx) => {
      console.log(`${idx + 1}. ${place.place_name} (${place.lat}, ${place.lng})`);
    });

    // Google API 테스트 (API 키가 있는 경우)
    if (process.env.GOOGLE_API_KEY) {
      console.log("\n🌍 Google Routes API 테스트:");
      try {
        const optimizedGoogle = await optimizer.optimizePlaceOrder(placesWithCoords, {
          algorithm: 'google',
          travelMode: 'driving'
        });

        console.log("\n🎯 최적화된 순서 (Google):");
        optimizedGoogle.forEach((place, idx) => {
          console.log(`${idx + 1}. ${place.place_name} (${place.lat}, ${place.lng})`);
        });
      } catch (error) {
        console.log(`❌ Google API 테스트 실패: ${error.message}`);
      }
    } else {
      console.log("\n⚠️  GOOGLE_API_KEY가 없어서 Google API 테스트 건너뜀");
    }

    console.log("\n📊 최적화 통계:", optimizer.getStats());
    return optimizedNN;

  } catch (error) {
    console.error("❌ 경로 최적화 테스트 실패:", error);
    return null;
  }
}

/**
 * 1단계 + 2단계 통합 테스트
 */
async function testIntegratedStep1And2() {
  console.log("🔗 1단계 + 2단계 통합 테스트 시작\n");

  const validator = new CoordinateValidator();
  const optimizer = new RouteOptimizer();

  // 좌표가 없는 원본 장소들
  const rawPlaces = [
    { place_name: "경복궁", 분류: "관광지" },
    { place_name: "명동성당", 분류: "종교시설" },
    { place_name: "남산타워", 분류: "관광지" },
    { place_name: "동대문디자인플라자", 분류: "문화시설" },
    { place_name: "청계천", 분류: "공원" },
    { place_name: "한강공원", 분류: "공원" }
  ];

  try {
    // 1단계: 좌표 검증
    console.log("=== 1단계: 좌표 검증 ===");
    const validationResult = await validator.validatePlaceCoordinates(rawPlaces, "서울");
    
    if (validationResult.validPlaces.length === 0) {
      throw new Error("좌표 검증 단계에서 유효한 장소를 찾지 못함");
    }

    console.log(`✅ 1단계 완료: ${validationResult.stats.success}/${validationResult.stats.total}개 장소 검증 성공`);

    // 2단계: 경로 최적화
    console.log("\n=== 2단계: 경로 최적화 ===");
    const optimizedPlaces = await optimizer.optimizePlaceOrder(validationResult.validPlaces, {
      algorithm: 'auto'
    });

    console.log(`✅ 2단계 완료: ${optimizedPlaces.length}개 장소 최적화 완료`);

    // 최종 결과
    console.log("\n" + "=".repeat(50));
    console.log("🎉 1단계 + 2단계 통합 결과:");
    console.log("=".repeat(50));
    
    console.log("\n📍 최종 최적화된 여행 순서:");
    optimizedPlaces.forEach((place, idx) => {
      console.log(`${idx + 1}. ${place.place_name}`);
      console.log(`   좌표: (${place.lat}, ${place.lng})`);
      console.log(`   주소: ${place.road_address || 'N/A'}`);
      console.log(`   분류: ${place.분류 || 'N/A'}`);
      console.log();
    });

    console.log("📊 전체 통계:");
    console.log("- 좌표 검증:", validator.getCacheStats());
    console.log("- 경로 최적화:", optimizer.getStats());

    return {
      validatedPlaces: validationResult.validPlaces,
      optimizedPlaces: optimizedPlaces,
      stats: {
        validation: validationResult.stats,
        optimization: optimizer.getStats()
      }
    };

  } catch (error) {
    console.error("❌ 통합 테스트 실패:", error.message);
    return null;
  }
}

/**
 * 간단한 통합 테스트 (3개 장소)
 */
async function quickIntegratedTest() {
  console.log("⚡ 빠른 통합 테스트 (3개 장소)\n");

  const validator = new CoordinateValidator();
  const optimizer = new RouteOptimizer();

  const simplePlaces = [
    { place_name: "경복궁" },
    { place_name: "명동성당" },
    { place_name: "남산타워" }
  ];

  try {
    // 1단계
    const validationResult = await validator.validatePlaceCoordinates(simplePlaces, "서울");
    console.log(`1단계: ${validationResult.stats.success}개 검증 완료`);

    // 2단계
    const optimizedPlaces = await optimizer.optimizePlaceOrder(validationResult.validPlaces);
    console.log(`2단계: ${optimizedPlaces.length}개 최적화 완료`);

    console.log("\n🎯 최종 순서:");
    optimizedPlaces.forEach((place, idx) => {
      console.log(`${idx + 1}. ${place.place_name} (${place.lat}, ${place.lng})`);
    });

    return optimizedPlaces;

  } catch (error) {
    console.error("❌ 빠른 테스트 실패:", error.message);
    return null;
  }
}

async function main() {
  console.log("2단계: 경로 최적화 테스트");
  console.log("=".repeat(30));

  // 환경변수 확인
  if (!process.env.KAKAO_REST_KEY) {
    console.error("❌ KAKAO_REST_KEY 환경변수가 설정되지 않았습니다.");
    return;
  }

  console.log("✅ KAKAO_REST_KEY 확인됨");
  
  if (process.env.GOOGLE_API_KEY) {
    console.log("✅ GOOGLE_API_KEY 확인됨 (Google 최적화 가능)");
  } else {
    console.log("⚠️  GOOGLE_API_KEY 없음 (Nearest Neighbor만 사용)");
  }

  console.log();

  try {
    // 1. 경로 최적화 단독 테스트
    await testRouteOptimization();
    
    console.log("\n" + "=".repeat(60) + "\n");
    
    // 2. 통합 테스트
    const result = await testIntegratedStep1And2();
    
    if (result && result.optimizedPlaces.length > 0) {
      console.log("\n🎉 2단계 테스트 성공! 3단계(일차별 분배) 진행 가능합니다.");
    } else {
      console.log("\n❌ 2단계 테스트에서 문제 발생. 디버깅 필요.");
    }

  } catch (error) {
    console.error("❌ 메인 테스트 실패:", error);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testRouteOptimization,
  testIntegratedStep1And2,
  quickIntegratedTest
};