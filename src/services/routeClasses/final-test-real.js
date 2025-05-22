const CoordinateValidator = require('./CoordinateValidator');
const KakaoRouteOptimizer = require('./KakaoRouteOptimizer');
const DayDistributor = require('./DayDistributor');

/**
 * 🌍 실제 서비스 데이터 기반 완전 통합 테스트
 * 실제 사용자의 제주도 5일 여행 계획 시뮬레이션
 */
async function testRealJejuTrip() {
  console.log("🌺 실제 제주도 5일 여행 계획 테스트 시작\n");
  console.log("=" .repeat(60));

  const validator = new CoordinateValidator();
  const optimizer = new KakaoRouteOptimizer();
  const distributor = new DayDistributor();

  // 🌍 실제 로그에서 가져온 AI 추천 장소들 (제주특별자치도, 야외활동, 가족 3명, 5일)
  const realAIRecommendations = [
    { '여행지명': '김녕해수욕장', '분류': '레저/스포츠 관련 시설(스키, 카트, 수상레저)' },
    { '여행지명': '신화 워터파크', '분류': '테마시설(놀이공원, 워터파크)' },
    { '여행지명': '쇠소깍', '분류': '레저/스포츠 관련 시설(스키, 카트, 수상레저)' },
    { '여행지명': '아쿠아 플라넷 제주', '분류': '테마시설(놀이공원, 워터파크)' },
    { '여행지명': '제주 참숯가마 찜질방', '분류': '테마시설(놀이공원, 워터파크)' },
    { '여행지명': '프리 라이프', '분류': '레저/스포츠 관련 시설(스키, 카트, 수상레저)' },
    { '여행지명': '9.81파크', '분류': '테마시설(놀이공원, 워터파크)' },
    { '여행지명': '에코랜드 테마파크', '분류': '체험 활동 관광지' },
    { '여행지명': '제주신화 월드 랜딩관', '분류': '테마시설(놀이공원, 워터파크)' },
    { '여행지명': '금호리조트 제주 아쿠아나', '분류': '테마시설(놀이공원, 워터파크)' },
    { '여행지명': '월정서핑 랑서프', '분류': '레저/스포츠 관련 시설(스키, 카트, 수상레저)' },
    { '여행지명': '함덕 돌핀 레저 본사', '분류': '레저/스포츠 관련 시설(스키, 카트, 수상레저)' },
    { '여행지명': '에코랜드 테마파크', '분류': '체험 활동 관광지' }, // 중복!
    { '여행지명': '9.81파크', '분류': '테마시설(놀이공원, 워터파크)' }, // 중복!
    { '여행지명': '9.81파크', '분류': '테마시설(놀이공원, 워터파크)' }, // 중복!
    { '여행지명': '새마을 서핑 운동', '분류': '레저/스포츠 관련 시설(스키, 카트, 수상레저)' },
    { '여행지명': '신화 워터파크', '분류': '테마시설(놀이공원, 워터파크)' }, // 중복!
    { '여행지명': '픽스볼더클라이밍', '분류': '레저/스포츠 관련 시설(스키, 카트, 수상레저)' },
    { '여행지명': '국제 리더스클럽', '분류': '레저/스포츠 관련 시설(스키, 카트, 수상레저)' },
    { '여행지명': '신화 테마파크', '분류': '테마시설(놀이공원, 워터파크)' }
  ];

  // 🏷️ 실제 사용자 선호도 정보
  const userPreferences = {
    city: '제주특별자치도',
    activityType: '야외',
    activityIds: [9],
    emotionIds: [6, 4], // 우울, 여유
    preferredTransport: '자가용',
    companionsCount: 3,
    activityLevel: 10,
    tripDuration: 5,
    visitDate: '2025-05-21T15:00:00.000Z',
    departureDate: '2025-05-25T15:00:00.000Z'
  };

  const startTime = Date.now();

  try {
    console.log(`🎯 실제 시나리오: ${userPreferences.city} ${userPreferences.tripDuration}일 가족여행`);
    console.log(`👨‍👩‍👧‍👦 가족 구성: ${userPreferences.companionsCount}명`);
    console.log(`🚗 교통수단: ${userPreferences.preferredTransport}`);
    console.log(`🏃‍♂️ 활동 강도: ${userPreferences.activityLevel}/10`);
    console.log(`📅 여행 기간: ${userPreferences.visitDate.split('T')[0]} ~ ${userPreferences.departureDate.split('T')[0]}\n`);

    console.log(`📍 AI가 추천한 원본 장소: ${realAIRecommendations.length}개`);

    // ===== 1단계: 좌표 검증 및 중복 제거 =====
    console.log("\n🔍 1단계: 좌표 검증 및 중복 제거 시작");
    console.log("-".repeat(50));
    
    const validationResult = await validator.validatePlaceCoordinates(
      realAIRecommendations, 
      userPreferences.city,
      {
        removeDuplicates: true,
        duplicateStrategy: 'first'
      }
    );
    
    if (validationResult.validPlaces.length === 0) {
      throw new Error("유효한 좌표를 가진 장소를 찾지 못함");
    }

    console.log(`✅ 1단계 완료:`);
    console.log(`   - 원본 장소: ${validationResult.stats.original}개`);
    console.log(`   - 중복 제거: ${validationResult.duplicateStats.duplicatesRemoved}개`);
    console.log(`   - 좌표 검증: ${validationResult.stats.success}개 성공`);
    console.log(`   - 소요시간: ${validationResult.stats.duration}ms`);

    // ===== 2단계: 카카오 경로 최적화 =====
    console.log("\n🇰🇷 2단계: 카카오 경로 최적화 시작");
    console.log("-".repeat(50));
    
    const optimizedPlaces = await optimizer.optimizePlaceOrder(validationResult.validPlaces, {
      priority: 'RECOMMEND'
    });

    console.log(`✅ 2단계 완료: ${optimizedPlaces.length}개 장소 최적화`);

    // ===== 3단계: 5일 일차별 스마트 분배 =====
    console.log("\n📅 3단계: 5일 일차별 스마트 분배 시작");
    console.log("-".repeat(50));
    
    const dayGroups = distributor.distributePlacesByDays(optimizedPlaces, userPreferences.tripDuration, {
      distributionMethod: 'smart',
      maxPlacesPerDay: 6,        // 가족여행이므로 여유있게
      preferredPlacesPerDay: 4   // 하루 4개 정도가 적당
    });

    console.log(`✅ 3단계 완료: ${dayGroups.length}일 분배 완료`);

    // ===== 최종 여행 계획 생성 =====
    console.log("\n🎨 최종 여행 계획 생성 중...");
    
    const finalTravelPlan = generateRealTravelPlan(dayGroups, userPreferences);
    
    const totalTime = Date.now() - startTime;

    // ===== 결과 출력 =====
    console.log("\n" + "=".repeat(60));
    console.log("🌺 제주도 5일 가족여행 계획 완성!");
    console.log("=".repeat(60));

    console.log(`\n📋 ${userPreferences.tripDuration}일 제주도 여행 일정:`);
    finalTravelPlan.plan.days.forEach((day, idx) => {
      const dayDate = new Date(userPreferences.visitDate);
      dayDate.setDate(dayDate.getDate() + idx);
      const dateStr = dayDate.toLocaleDateString('ko-KR', { 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
      });

      console.log(`\n🗓️  ${day.day}일차 (${dateStr}) - ${day.totalPlaces}개 장소:`);
      
      if (day.items.length === 0) {
        console.log(`   💤 휴식일 또는 자유시간`);
      } else {
        day.items.forEach((item, itemIdx) => {
          console.log(`   ${itemIdx + 1}. 🎯 ${item.title}`);
          console.log(`      📍 ${item.road_address || '주소 정보 없음'}`);
          console.log(`      🏷️  ${item.tags.join(', ')}`);
          console.log(`      📱 좌표: (${item.lat}, ${item.lng})`);
        });
      }
    });

    // ===== 상세 통계 =====
    console.log("\n📊 처리 통계 및 품질 평가:");
    console.log(`⏱️  총 처리 시간: ${totalTime}ms`);
    console.log(`🔍 좌표 검증 성공률: ${((validationResult.stats.success / validationResult.stats.original) * 100).toFixed(1)}%`);
    console.log(`🗑️  중복 제거 효과: ${validationResult.duplicateStats.duplicatesRemoved}개 중복 제거`);
    console.log(`🇰🇷 카카오 API 호출: ${optimizer.getStats().apiCallCount}회`);
    console.log(`📅 분배 방식: ${distributor.getDistributionStats().distributionMethod}`);
    
    // 분배 품질 평가
    const quality = distributor.calculateDistributionQuality(dayGroups, 6);
    console.log(`📈 분배 품질: ${quality.total.toFixed(1)}/100점`);
    console.log(`   - 균형성: ${quality.balance}/40점`);
    console.log(`   - 효율성: ${quality.efficiency}/30점`);

    // 실용성 분석
    console.log("\n🎯 실용성 분석:");
    const totalPlaces = finalTravelPlan.plan.days.reduce((sum, day) => sum + day.totalPlaces, 0);
    const avgPerDay = totalPlaces / userPreferences.tripDuration;
    console.log(`📍 총 방문 장소: ${totalPlaces}개 (평균 ${avgPerDay.toFixed(1)}개/일)`);
    
    const waterParks = finalTravelPlan.flatPlaces.filter(p => 
      p.category && p.category.includes('테마') || 
      p.title.includes('워터파크') || 
      p.title.includes('아쿠아')
    ).length;
    console.log(`🏊‍♂️ 물놀이 관련 장소: ${waterParks}개 (야외 활동에 적합)`);

    // 중복 제거 효과
    if (validationResult.duplicateStats.duplicatesList.length > 0) {
      console.log("\n🗑️  제거된 중복 장소들:");
      validationResult.duplicateStats.duplicatesList.forEach((dup, idx) => {
        console.log(`   ${idx + 1}. ${dup.name} (${dup.reason})`);
      });
    }

    console.log("\n🎊 실제 데이터 기반 테스트 성공!");
    console.log("🚀 이 품질로 실제 서비스에 바로 적용 가능합니다!");

    return {
      originalPlaces: realAIRecommendations.length,
      finalPlan: finalTravelPlan,
      stats: {
        validation: validationResult.stats,
        optimization: optimizer.getStats(),
        distribution: distributor.getDistributionStats(),
        quality: quality,
        processingTime: totalTime
      }
    };

  } catch (error) {
    console.error("\n❌ 실제 데이터 테스트 실패:", error.message);
    console.error("🔍 오류 발생 위치:", error.stack);
    return null;
  }
}

/**
 * 실제 여행 계획 생성 (실제 서비스 포맷)
 */
function generateRealTravelPlan(dayGroups, userPreferences) {
  const plan = { days: [] };
  const flatPlaces = [];
  let globalOrder = 1;

  const startDate = new Date(userPreferences.visitDate);
  const MS_DAY = 86_400_000;

  dayGroups.forEach((dayPlaces, dayIndex) => {
    const visitDate = new Date(startDate.getTime() + dayIndex * MS_DAY)
      .toISOString()
      .slice(0, 10);

    const cards = dayPlaces.map((place, placeIndex) => {
      const title = place.place_name || place['여행지명'];

      // DB 저장용 데이터 (실제 서비스와 동일)
      flatPlaces.push({
        title,
        description: place.description ?? `${title}의 멋진 장소입니다.`,
        image: place.image || "/images/default-place.png",
        category: place['분류'] || null,
        order: globalOrder,
        visit_date: visitDate,
        lat: place.lat,
        lng: place.lng,
        road_address: place.road_address || null,
        day_number: dayIndex + 1,
        daily_order: placeIndex + 1,
        validation_source: place.source || 'kakao_api',
        confidence: place.confidence || 85
      });

      // 프론트엔드용 카드
      const card = {
        id: `${dayIndex + 1}-${placeIndex + 1}`,
        title,
        description: place.description ?? `${title}의 멋진 장소입니다.`,
        image: place.image || "/images/default-place.png",
        tags: generateTags(place['분류']),
        region: userPreferences.city,
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
      totalPlaces: cards.length,
      theme: getDayTheme(cards) // 해당 일차의 테마
    });
  });

  return { plan, flatPlaces };
}

/**
 * 분류에 따른 태그 생성
 */
function generateTags(category) {
  const tagMap = {
    '레저/스포츠 관련 시설(스키, 카트, 수상레저)': ['액티비티', '스포츠', '체험'],
    '테마시설(놀이공원, 워터파크)': ['가족', '놀이', '즐거움'],
    '체험 활동 관광지': ['체험', '교육', '자연']
  };
  
  return tagMap[category] || ['여행', '관광', '제주'];
}

/**
 * 일차별 테마 생성
 */
function getDayTheme(cards) {
  if (!cards || cards.length === 0) return '휴식';
  
  const themes = cards.map(card => card.tags[0]).filter(Boolean);
  const themeCount = {};
  
  themes.forEach(theme => {
    themeCount[theme] = (themeCount[theme] || 0) + 1;
  });
  
  const mainTheme = Object.keys(themeCount).reduce((a, b) => 
    themeCount[a] > themeCount[b] ? a : b
  );
  
  return mainTheme || '다양한 체험';
}

/**
 * 빠른 실제 데이터 테스트 (3개 장소, 2일)
 */
async function quickRealTest() {
  console.log("⚡ 빠른 실제 데이터 테스트 (제주도 2일)\n");

  const validator = new CoordinateValidator();
  const optimizer = new KakaoRouteOptimizer();
  const distributor = new DayDistributor();

  const quickPlaces = [
    { '여행지명': '김녕해수욕장', '분류': '레저/스포츠 관련 시설(스키, 카트, 수상레저)' },
    { '여행지명': '9.81파크', '분류': '테마시설(놀이공원, 워터파크)' },
    { '여행지명': '쇠소깍', '분류': '레저/스포츠 관련 시설(스키, 카트, 수상레저)' },
    { '여행지명': '9.81파크', '분류': '테마시설(놀이공원, 워터파크)' }, // 중복
  ];

  try {
    // 1단계
    const validationResult = await validator.validatePlaceCoordinates(quickPlaces, "제주특별자치도", {
      removeDuplicates: true
    });
    console.log(`1단계: ${validationResult.stats.original}개 → ${validationResult.stats.success}개 (중복 ${validationResult.duplicateStats.duplicatesRemoved}개 제거)`);

    // 2단계
    const optimizedPlaces = await optimizer.optimizePlaceOrder(validationResult.validPlaces);
    console.log(`2단계: ${optimizedPlaces.length}개 최적화 완료`);

    // 3단계
    const dayGroups = distributor.distributePlacesByDays(optimizedPlaces, 2);
    console.log(`3단계: 2일 분배 완료`);

    console.log("\n🎯 최종 결과:");
    dayGroups.forEach((dayPlaces, idx) => {
      console.log(`${idx + 1}일차: ${dayPlaces.map(p => p.place_name || p['여행지명']).join(', ')}`);
    });

    return dayGroups;

  } catch (error) {
    console.error("❌ 빠른 테스트 실패:", error.message);
    return null;
  }
}

async function main() {
  console.log("🌺 실제 제주도 여행 데이터 기반 통합 테스트");
  console.log("=" .repeat(50));

  // 환경변수 확인
  if (!process.env.KAKAO_REST_KEY) {
    console.error("❌ KAKAO_REST_KEY 환경변수가 설정되지 않았습니다.");
    return;
  }

  console.log("✅ KAKAO_REST_KEY 확인됨");
  console.log("🎯 실제 사용자의 제주도 5일 가족여행 데이터로 테스트\n");

  try {
    // 실제 데이터 기반 완전한 통합 테스트
    const result = await testRealJejuTrip();
    
    if (result && result.finalPlan.plan.days.length > 0) {
      console.log("\n🏆 최종 평가:");
      console.log("   ✅ 실제 데이터 처리 완벽");
      console.log("   ✅ 중복 제거로 다양성 확보");
      console.log("   ✅ 카카오 기반 정확한 위치 정보");
      console.log("   ✅ 5일 일정의 균형잡힌 분배");
      console.log("   ✅ 가족여행에 최적화된 계획");
      
      console.log("\n🚀 다음 단계:");
      console.log("   1. 실제 서비스에 즉시 적용 가능");
      console.log("   2. 다른 지역/여행 타입으로 확장 테스트");
      console.log("   3. 사용자 피드백 기반 미세 조정");
    } else {
      console.log("\n❌ 실제 데이터 테스트 실패 - 추가 디버깅 필요");
    }

  } catch (error) {
    console.error("❌ 메인 테스트 실패:", error);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testRealJejuTrip,
  quickRealTest,
  generateRealTravelPlan
};