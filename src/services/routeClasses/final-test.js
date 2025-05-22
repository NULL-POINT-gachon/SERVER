const CoordinateValidator = require('./CoordinateValidator');
const KakaoRouteOptimizer = require('./KakaoRouteOptimizer');
const DayDistributor = require('./DayDistributor');

async function testCompleteIntegration() {
  console.log("🎯 1+카카오2+3단계 완전 통합 테스트 시작\n");

  const validator = new CoordinateValidator();
  const optimizer = new KakaoRouteOptimizer();
  const distributor = new DayDistributor();

  const rawPlaces = [
    { place_name: "경복궁", 분류: "관광지" },
    { place_name: "명동성당", 분류: "종교시설" },
    { place_name: "남산타워", 분류: "관광지" },
    { place_name: "동대문디자인플라자", 분류: "문화시설" },
    { place_name: "청계천", 분류: "공원" },
    { place_name: "한강공원", 분류: "공원" }
  ];

  const daysCnt = 3;

  try {
    console.log(`🎯 목표: ${rawPlaces.length}개 장소를 ${daysCnt}일 여행으로 계획\n`);

    // 1단계: 좌표 검증
    console.log("🔍 1단계: 좌표 검증");
    const validationResult = await validator.validatePlaceCoordinates(rawPlaces, "서울");
    console.log(`✅ 1단계 완료: ${validationResult.stats.success}/${validationResult.stats.total}개`);

    // 2단계: 카카오 경로 최적화
    console.log("\n🇰🇷 2단계: 카카오 경로 최적화");
    const optimizedPlaces = await optimizer.optimizePlaceOrder(validationResult.validPlaces);
    console.log(`✅ 2단계 완료: ${optimizedPlaces.length}개 장소 최적화`);

    // 3단계: 일차별 분배
    console.log("\n📅 3단계: 일차별 스마트 분배");
    const dayGroups = distributor.distributePlacesByDays(optimizedPlaces, daysCnt, {
      distributionMethod: 'smart',
      maxPlacesPerDay: 4,
      preferredPlacesPerDay: 2
    });
    console.log(`✅ 3단계 완료: ${dayGroups.length}일 분배`);

    // 최종 결과
    console.log("\n🎉 최종 여행 계획:");
    dayGroups.forEach((dayPlaces, idx) => {
      console.log(`\n${idx + 1}일차 - ${dayPlaces.length}개 장소:`);
      dayPlaces.forEach((place, placeIdx) => {
        console.log(`  ${placeIdx + 1}. ${place.place_name}`);
        console.log(`     📍 (${place.lat}, ${place.lng})`);
        console.log(`     🏷️  ${place.분류 || 'N/A'}`);
      });
    });

    // 품질 평가
    const quality = distributor.calculateDistributionQuality(dayGroups, 4);
    console.log(`\n📊 분배 품질: ${quality.total.toFixed(1)}/100점`);

    // 통계
    console.log("\n📈 처리 통계:");
    console.log(`- 좌표 검증: ${validator.getCacheStats().apiCalls}회 API 호출`);
    console.log(`- 카카오 최적화: ${optimizer.getStats().apiCallCount}회 API 호출`);
    console.log(`- 분배 방식: ${distributor.getDistributionStats().distributionMethod}`);

    console.log("\n🎊 모든 단계 성공! 실제 서비스 적용 준비 완료!");

    return dayGroups;

  } catch (error) {
    console.error("\n❌ 완전 통합 테스트 실패:", error.message);
    return null;
  }
}

async function main() {
  if (!process.env.KAKAO_REST_KEY) {
    console.error("❌ KAKAO_REST_KEY 환경변수가 설정되지 않았습니다.");
    return;
  }

  console.log("✅ KAKAO_REST_KEY 확인됨");
  console.log("🎯 1단계(좌표) + 카카오2단계(경로) + 3단계(분배) 통합 테스트\n");

  const result = await testCompleteIntegration();
  
  if (result && result.length > 0) {
    console.log("\n🏆 최종 성공!");
    console.log("🚀 이제 실제 TripRecommendationService에 적용 가능!");
  } else {
    console.log("\n❌ 통합 테스트 실패");
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testCompleteIntegration };