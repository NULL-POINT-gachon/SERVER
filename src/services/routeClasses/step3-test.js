const CoordinateValidator = require('./CoordinateValidator');
const RouteOptimizer = require('./RouteOptimizer');
const DayDistributor = require('./DayDistributor');

/**
 * 3단계 단독 테스트: 일차별 분배만
 */
async function testDayDistribution() {
  console.log("📅 3단계: 일차별 분배 단독 테스트\n");

  const distributor = new DayDistributor();

  // 이미 좌표와 최적화가 끝난 가상의 장소들
  const optimizedPlaces = [
    { place_name: "경복궁", lat: 37.5796, lng: 126.9770 },
    { place_name: "청계천", lat: 37.5664, lng: 126.9779 },
    { place_name: "명동성당", lat: 37.5633, lng: 126.9738 },
    { place_name: "남산타워", lat: 37.5512, lng: 126.9882 },
    { place_name: "동대문디자인플라자", lat: 37.5676, lng: 127.0095 },
    { place_name: "한강공원", lat: 37.5326, lng: 126.9689 },
    { place_name: "인사동", lat: 37.5722, lng: 126.9856 },
    { place_name: "홍대거리", lat: 37.5563, lng: 126.9227 }
  ];

  try {
    console.log("📍 최적화된 장소들:");
    optimizedPlaces.forEach((place, idx) => {
      console.log(`${idx + 1}. ${place.place_name} (${place.lat}, ${place.lng})`);
    });

    // 여러 분배 방법 테스트
    console.log("\n🔍 분배 방법별 테스트:");

    // 3일 여행 테스트
    const daysCnt = 3;
    console.log(`\n=== ${daysCnt}일 여행 분배 테스트 ===`);

    // 방법 1: 자동 선택
    console.log("\n1️⃣ 자동 분배:");
    const autoDistribution = distributor.distributePlacesByDays(optimizedPlaces, daysCnt, {
      distributionMethod: 'auto'
    });

    // 방법 2: 스마트 분배
    console.log("\n2️⃣ 스마트 분배:");
    const smartDistribution = distributor.distributePlacesByDays(optimizedPlaces, daysCnt, {
      distributionMethod: 'smart',
      preferredPlacesPerDay: 3,
      maxPlacesPerDay: 5
    });

    // 방법 3: 밸런스 분배
    console.log("\n3️⃣ 밸런스 분배:");
    const balancedDistribution = distributor.distributePlacesByDays(optimizedPlaces, daysCnt, {
      distributionMethod: 'balanced',
      maxPlacesPerDay: 4
    });

    // 분배 품질 비교
    console.log("\n📊 분배 품질 비교:");
    const autoQuality = distributor.calculateDistributionQuality(autoDistribution, 5);
    const smartQuality = distributor.calculateDistributionQuality(smartDistribution, 5);
    const balancedQuality = distributor.calculateDistributionQuality(balancedDistribution, 4);

    console.log(`자동 분배 품질: ${autoQuality.total.toFixed(1)}점`);
    console.log(`스마트 분배 품질: ${smartQuality.total.toFixed(1)}점`);
    console.log(`밸런스 분배 품질: ${balancedQuality.total.toFixed(1)}점`);

    // 최고 품질 선택
    const bestMethod = autoQuality.total >= smartQuality.total && autoQuality.total >= balancedQuality.total 
      ? '자동' : smartQuality.total >= balancedQuality.total ? '스마트' : '밸런스';
    console.log(`🏆 최고 품질: ${bestMethod} 분배`);

    return autoDistribution;

  } catch (error) {
    console.error("❌ 일차별 분배 테스트 실패:", error);
    return null;
  }
}

/**
 * 1+2+3단계 완전 통합 테스트
 */
async function testFullIntegration() {
  console.log("🔗 1+2+3단계 완전 통합 테스트 시작\n");

  const validator = new CoordinateValidator();
  const optimizer = new RouteOptimizer();
  const distributor = new DayDistributor();

  // 원본 장소들 (좌표 없음)
  const rawPlaces = [
    { place_name: "경복궁", 분류: "관광지" },
    { place_name: "명동성당", 분류: "종교시설" },
    { place_name: "남산타워", 분류: "관광지" },
    { place_name: "동대문디자인플라자", 분류: "문화시설" },
    { place_name: "청계천", 분류: "공원" },
    { place_name: "한강공원", 분류: "공원" },
    { place_name: "인사동", 분류: "쇼핑" },
    { place_name: "홍대거리", 분류: "엔터테인먼트" }
  ];

  const daysCnt = 3; // 3일 여행

  try {
    console.log(`🎯 목표: ${rawPlaces.length}개 장소를 ${daysCnt}일 여행으로 계획`);

    // 1단계: 좌표 검증
    console.log("\n" + "=".repeat(20) + " 1단계: 좌표 검증 " + "=".repeat(20));
    const validationResult = await validator.validatePlaceCoordinates(rawPlaces, "서울");
    
    if (validationResult.validPlaces.length === 0) {
      throw new Error("좌표 검증에서 유효한 장소를 찾지 못함");
    }

    console.log(`✅ 1단계 완료: ${validationResult.stats.success}/${validationResult.stats.total}개 장소 검증 성공`);

    // 2단계: 경로 최적화  
    console.log("\n" + "=".repeat(20) + " 2단계: 경로 최적화 " + "=".repeat(20));
    const optimizedPlaces = await optimizer.optimizePlaceOrder(validationResult.validPlaces, {
      algorithm: 'auto'
    });

    console.log(`✅ 2단계 완료: ${optimizedPlaces.length}개 장소 최적화 완료`);

    // 3단계: 일차별 분배
    console.log("\n" + "=".repeat(20) + " 3단계: 일차별 분배 " + "=".repeat(20));
    const dayGroups = distributor.distributePlacesByDays(optimizedPlaces, daysCnt, {
      distributionMethod: 'auto',
      maxPlacesPerDay: 6,
      preferredPlacesPerDay: 3
    });

    console.log(`✅ 3단계 완료: ${dayGroups.length}일 분배 완료`);

    // 최종 결과 생성 (기존 포맷과 호환)
    const plan = { days: [] };
    const flatPlaces = [];
    let globalOrder = 1;

    const startDate = new Date('2024-12-01'); // 시작일 가정
    const MS_DAY = 86_400_000;

    dayGroups.forEach((dayPlaces, dayIndex) => {
      const visitDate = new Date(startDate.getTime() + dayIndex * MS_DAY)
        .toISOString()
        .slice(0, 10);

      const cards = dayPlaces.map((place, placeIndex) => {
        const title = place.place_name || place['여행지명'];

        // DB 저장용
        flatPlaces.push({
          title,
          description: place.description ?? `${title}의 멋진 장소입니다.`,
          image: place.image || "/images/default-place.png",
          category: place.분류 || null,
          order: globalOrder,
          visit_date: visitDate,
          lat: place.lat,
          lng: place.lng,
          road_address: place.road_address || null,
          day_number: dayIndex + 1,
          daily_order: placeIndex + 1
        });

        // 프론트엔드용 카드
        const card = {
          id: `${dayIndex + 1}-${placeIndex + 1}`,
          title,
          description: place.description ?? `${title}의 멋진 장소입니다.`,
          image: place.image || "/images/default-place.png",
          tags: [place.분류].filter(Boolean),
          region: "서울",
          visit_date: visitDate,
          lat: place.lat,
          lng: place.lng,
          road_address: place.road_address || null
        };

        globalOrder++;
        return card;
      });

      plan.days.push({
        day: dayIndex + 1,
        items: cards,
        totalPlaces: cards.length
      });
    });

    // 최종 결과 출력
    console.log("\n" + "=".repeat(50));
    console.log("🎉 1+2+3단계 완전 통합 결과:");
    console.log("=".repeat(50));

    console.log(`\n📋 ${daysCnt}일 여행 계획:`);
    plan.days.forEach((day, idx) => {
      console.log(`\n${day.day}일차 (${day.items[0]?.visit_date}) - ${day.totalPlaces}개 장소:`);
      day.items.forEach((item, itemIdx) => {
        console.log(`  ${itemIdx + 1}. ${item.title}`);
        console.log(`     좌표: (${item.lat}, ${item.lng})`);
        console.log(`     분류: ${item.tags.join(', ') || 'N/A'}`);
      });
    });

    // 통합 통계
    console.log("\n📊 전체 처리 통계:");
    console.log("- 좌표 검증:", validator.getCacheStats());
    console.log("- 경로 최적화:", optimizer.getStats());
    console.log("- 일차별 분배:", distributor.getDistributionStats());

    const distributionQuality = distributor.calculateDistributionQuality(dayGroups, 6);
    console.log(`- 분배 품질: ${distributionQuality.total.toFixed(1)}/100점`);

    return {
      plan,
      flatPlaces,
      stats: {
        validation: validationResult.stats,
        optimization: optimizer.getStats(),
        distribution: distributor.getDistributionStats(),
        quality: distributionQuality
      }
    };

  } catch (error) {
    console.error("❌ 완전 통합 테스트 실패:", error.message);
    return null;
  }
}

/**
 * 빠른 통합 테스트 (적은 장소로)
 */
async function quickFullTest() {
  console.log("⚡ 빠른 완전 통합 테스트 (4개 장소, 2일)\n");

  const validator = new CoordinateValidator();
  const optimizer = new RouteOptimizer();
  const distributor = new DayDistributor();

  const simplePlaces = [
    { place_name: "경복궁" },
    { place_name: "명동성당" },
    { place_name: "남산타워" },
    { place_name: "동대문디자인플라자" }
  ];

  try {
    // 1단계
    const validationResult = await validator.validatePlaceCoordinates(simplePlaces, "서울");
    console.log(`1단계: ${validationResult.stats.success}개 검증 완료`);

    // 2단계
    const optimizedPlaces = await optimizer.optimizePlaceOrder(validationResult.validPlaces);
    console.log(`2단계: ${optimizedPlaces.length}개 최적화 완료`);

    // 3단계
    const dayGroups = distributor.distributePlacesByDays(optimizedPlaces, 2);
    console.log(`3단계: 2일 분배 완료`);

    console.log("\n🎯 최종 결과:");
    dayGroups.forEach((dayPlaces, idx) => {
      console.log(`${idx + 1}일차: ${dayPlaces.map(p => p.place_name).join(', ')}`);
    });

    return dayGroups;

  } catch (error) {
    console.error("❌ 빠른 테스트 실패:", error.message);
    return null;
  }
}

async function main() {
  console.log("3단계: 일차별 분배 테스트");
  console.log("=".repeat(30));

  // 환경변수 확인
  if (!process.env.KAKAO_REST_KEY) {
    console.error("❌ KAKAO_REST_KEY 환경변수가 설정되지 않았습니다.");
    return;
  }

  console.log("✅ 환경변수 확인 완료\n");

  try {
    // 1. 일차별 분배 단독 테스트
    await testDayDistribution();
    
    console.log("\n" + "=".repeat(80) + "\n");
    
    // 2. 완전 통합 테스트
    const result = await testFullIntegration();
    
    if (result && result.plan.days.length > 0) {
      console.log("\n🎉 3단계 통합 테스트 성공! 모든 단계가 완벽하게 연동됩니다.");
      console.log("🚀 이제 실제 TripRecommendationService에 적용 가능합니다!");
    } else {
      console.log("\n❌ 3단계 테스트에서 문제 발생. 디버깅 필요.");
    }

  } catch (error) {
    console.error("❌ 메인 테스트 실패:", error);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testDayDistribution,
  testFullIntegration,
  quickFullTest
};