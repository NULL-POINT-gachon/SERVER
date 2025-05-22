const CoordinateValidator = require('./CoordinateValidator');
const KakaoRouteOptimizer = require('./KakaoRouteOptimizer');

async function testKakaoIntegration() {
  console.log("🔗 1단계 + 카카오 2단계 통합 테스트\n");

  const validator = new CoordinateValidator();
  const optimizer = new KakaoRouteOptimizer();

  const rawPlaces = [
    { place_name: "경복궁", 분류: "관광지" },
    { place_name: "명동성당", 분류: "종교시설" },
    { place_name: "남산타워", 분류: "관광지" },
    { place_name: "청계천", 분류: "공원" },
    { place_name: "한강공원", 분류: "공원" }
  ];

  try {
    // 1단계: 좌표 검증
    console.log("=== 1단계: 좌표 검증 ===");
    const validationResult = await validator.validatePlaceCoordinates(rawPlaces, "서울");
    console.log(`✅ 1단계 완료: ${validationResult.stats.success}/${validationResult.stats.total}개 장소 검증 성공`);

    // 2단계: 카카오 경로 최적화
    console.log("\n=== 2단계: 카카오 경로 최적화 ===");
    const optimizedPlaces = await optimizer.optimizePlaceOrder(validationResult.validPlaces);
    console.log(`✅ 2단계 완료: ${optimizedPlaces.length}개 장소 최적화 완료`);

    // 결과 비교
    console.log("\n📊 최적화 비교:");
    console.log("🔍 원본 순서:");
    validationResult.validPlaces.forEach((place, idx) => {
      console.log(`  ${idx + 1}. ${place.place_name}`);
    });

    console.log("🎯 카카오 최적화 후:");
    optimizedPlaces.forEach((place, idx) => {
      console.log(`  ${idx + 1}. ${place.place_name}`);
    });

    console.log("\n📈 전체 통계:");
    console.log("- 좌표 검증:", validator.getCacheStats());
    console.log("- 카카오 최적화:", optimizer.getStats());

    return optimizedPlaces;

  } catch (error) {
    console.error("❌ 카카오 통합 테스트 실패:", error.message);
    return null;
  }
}

async function main() {
  if (!process.env.KAKAO_REST_KEY) {
    console.error("❌ KAKAO_REST_KEY 환경변수가 설정되지 않았습니다.");
    return;
  }

  console.log("✅ KAKAO_REST_KEY 확인됨\n");

  const result = await testKakaoIntegration();
  
  if (result && result.length > 0) {
    console.log("\n🎉 카카오 경로 최적화 성공!");
    console.log("🇰🇷 한국 지역에 특화된 정확한 경로 계산 완료!");
    console.log("🚀 이제 3단계(일차별 분배)에 카카오 최적화를 적용할 수 있습니다.");
  } else {
    console.log("\n❌ 카카오 테스트에서 문제 발생");
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testKakaoIntegration };