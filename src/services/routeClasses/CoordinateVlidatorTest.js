const CoordinateValidator = require('./CoordinateValidator');

/**
 * 중복 제거 기능 테스트
 */
async function testDuplicateRemoval() {
  console.log("🗑️ 중복 제거 기능 테스트 시작\n");

  const validator = new CoordinateValidator();

  // 의도적으로 중복이 있는 테스트 데이터
  const testPlacesWithDuplicates = [
    { place_name: "경복궁", 분류: "관광지" },
    { place_name: "명동성당", 분류: "종교시설" },
    { place_name: "경복궁", 분류: "관광지" },        // 정확한 중복
    { place_name: "명동성당 본점", 분류: "종교시설" }, // 유사한 이름
    { place_name: "9.81파크", 분류: "테마파크" },
    { place_name: "9.81 파크", 분류: "테마파크" },    // 공백 차이
    { place_name: "9.81파크 제주", 분류: "테마파크" }, // 확장된 이름
    { place_name: "에코랜드테마파크", 분류: "테마파크" },
    { place_name: "에코랜드 테마파크", 분류: "테마파크" }, // 공백 차이
    { place_name: "남산타워", 분류: "관광지" },
    { place_name: "N서울타워", 분류: "관광지" },      // 다른 이름이지만 같은 장소일 수 있음
  ];

  try {
    console.log("📍 원본 장소 리스트:");
    testPlacesWithDuplicates.forEach((place, idx) => {
      console.log(`${idx + 1}. ${place.place_name} (${place.분류})`);
    });

    console.log("\n🗑️ 중복 제거 옵션 테스트:");

    // 1. 중복 제거 활성화
    console.log("\n=== 중복 제거 ON ===");
    const resultWithRemoval = await validator.validatePlaceCoordinates(testPlacesWithDuplicates, "서울", {
      removeDuplicates: true,
      duplicateStrategy: 'first'
    });

    console.log("\n=== 중복 제거 OFF ===");
    const resultWithoutRemoval = await validator.validatePlaceCoordinates(testPlacesWithDuplicates, "서울", {
      removeDuplicates: false
    });

    // 결과 비교
    console.log("\n📊 결과 비교:");
    console.log(`중복 제거 OFF: ${resultWithoutRemoval.stats.original}개 → ${resultWithoutRemoval.stats.success}개`);
    console.log(`중복 제거 ON:  ${resultWithRemoval.stats.original}개 → ${resultWithRemoval.stats.afterDuplicateRemoval}개 → ${resultWithRemoval.stats.success}개`);
    
    if (resultWithRemoval.duplicateStats) {
      console.log(`중복 발견: ${resultWithRemoval.duplicateStats.duplicatesFound}개`);
      console.log(`중복 제거: ${resultWithRemoval.duplicateStats.duplicatesRemoved}개`);
    }

    // 중복 제거된 장소들의 최종 리스트
    console.log("\n🎯 중복 제거 후 최종 장소들:");
    resultWithRemoval.validPlaces.forEach((place, idx) => {
      console.log(`${idx + 1}. ${place.place_name} (${place.lat}, ${place.lng})`);
    });

    return {
      before: resultWithoutRemoval,
      after: resultWithRemoval
    };

  } catch (error) {
    console.error("❌ 중복 제거 테스트 실패:", error);
    return null;
  }
}

/**
 * 실제 서비스에서 발생한 중복 사례 테스트
 */
async function testRealWorldDuplicates() {
  console.log("🌍 실제 중복 사례 테스트\n");

  const validator = new CoordinateValidator();

  // 실제 로그에서 발견된 중복들
  const realDuplicates = [
    { place_name: "김녕해수욕장", 분류: "레저/스포츠" },
    { place_name: "신화 워터파크", 분류: "테마파크" },
    { place_name: "쇠소깍", 분류: "레저/스포츠" },
    { place_name: "9.81파크", 분류: "테마파크" },
    { place_name: "에코랜드 테마파크", 분류: "테마파크" },
    { place_name: "에코랜드 테마파크", 분류: "테마파크" }, // 중복
    { place_name: "9.81파크", 분류: "테마파크" },        // 중복
    { place_name: "9.81파크", 분류: "테마파크" },        // 중복
    { place_name: "신화 워터파크", 분류: "테마파크" },    // 중복
    { place_name: "신화 테마파크", 분류: "테마파크" },
  ];

  try {
    const result = await validator.validatePlaceCoordinates(realDuplicates, "제주특별자치도", {
      removeDuplicates: true,
      duplicateStrategy: 'first'
    });

    console.log("\n🎉 실제 사례 처리 결과:");
    console.log(`원본: ${realDuplicates.length}개`);
    console.log(`중복 제거 후: ${result.stats.afterDuplicateRemoval}개`);
    console.log(`최종 성공: ${result.stats.success}개`);

    return result;

  } catch (error) {
    console.error("❌ 실제 사례 테스트 실패:", error);
    return null;
  }
}

async function main() {
  console.log("중복 제거 기능 테스트");
  console.log("=".repeat(30));

  if (!process.env.KAKAO_REST_KEY) {
    console.error("❌ KAKAO_REST_KEY 환경변수가 설정되지 않았습니다.");
    return;
  }

  console.log("✅ KAKAO_REST_KEY 확인됨\n");

  try {
    // 1. 중복 제거 기능 테스트
    await testDuplicateRemoval();
    
    console.log("\n" + "=".repeat(60) + "\n");
    
    // 2. 실제 사례 테스트
    const realResult = await testRealWorldDuplicates();
    
    if (realResult && realResult.duplicateStats.duplicatesRemoved > 0) {
      console.log("\n🎉 중복 제거 기능이 성공적으로 작동합니다!");
      console.log("🚀 이제 실제 서비스에 적용하면 더 다양한 장소를 추천할 수 있습니다!");
    } else {
      console.log("\n❌ 중복 제거 기능에서 문제 발생");
    }

  } catch (error) {
    console.error("❌ 메인 테스트 실패:", error);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testDuplicateRemoval,
  testRealWorldDuplicates
};