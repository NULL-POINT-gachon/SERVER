/**
 * 3단계: 일차별 스마트 분배 모듈
 * 1단계(좌표검증) + 2단계(경로최적화)가 끝난 장소들을 받아서
 * 여행 일수에 맞게 스마트하게 분배
 */
class DayDistributor {
    constructor() {
      this.distributionStats = {
        totalPlaces: 0,
        totalDays: 0,
        distributionMethod: '',
        averagePlacesPerDay: 0
      };
    }
  
    /**
     * 최적화된 장소들을 일차별로 스마트 분배
     * @param {Array} optimizedPlaces - 2단계에서 최적화된 장소 배열
     * @param {number} daysCnt - 여행 일수
     * @param {Object} options - 분배 옵션
     * @returns {Array} 일차별로 분배된 장소 그룹 배열
     */
    distributePlacesByDays(optimizedPlaces, daysCnt, options = {}) {
      const {
        maxPlacesPerDay = 8,      // 하루 최대 장소 수
        minPlacesPerDay = 1,      // 하루 최소 장소 수
        preferredPlacesPerDay = 5, // 하루 선호 장소 수
        distributionMethod = 'auto' // 'auto', 'balanced', 'front_loaded', 'even'
      } = options;
  
      console.log(`📅 일차별 분배 시작: ${optimizedPlaces.length}개 장소 → ${daysCnt}일`);
  
      if (!optimizedPlaces || optimizedPlaces.length === 0) {
        console.log("❌ 분배할 장소가 없습니다.");
        return this.createEmptyDays(daysCnt);
      }
  
      if (daysCnt <= 0) {
        console.log("❌ 여행 일수가 유효하지 않습니다.");
        return [];
      }
  
      // 통계 초기화
      this.distributionStats = {
        totalPlaces: optimizedPlaces.length,
        totalDays: daysCnt,
        distributionMethod: '',
        averagePlacesPerDay: optimizedPlaces.length / daysCnt
      };
  
      const startTime = Date.now();
  
      try {
        // 분배 방법 자동 선택 또는 지정된 방법 사용
        const selectedMethod = distributionMethod === 'auto' 
          ? this.selectOptimalDistributionMethod(optimizedPlaces.length, daysCnt, maxPlacesPerDay)
          : distributionMethod;
  
        console.log(`🧠 선택된 분배 방법: ${selectedMethod}`);
        this.distributionStats.distributionMethod = selectedMethod;
  
        let dayGroups = [];
  
        switch (selectedMethod) {
          case 'one_per_day':
            dayGroups = this.distributeOnePerDay(optimizedPlaces, daysCnt);
            break;
          case 'balanced':
            dayGroups = this.distributeBalanced(optimizedPlaces, daysCnt, maxPlacesPerDay);
            break;
          case 'front_loaded':
            dayGroups = this.distributeFrontLoaded(optimizedPlaces, daysCnt, maxPlacesPerDay);
            break;
          case 'even':
            dayGroups = this.distributeEven(optimizedPlaces, daysCnt);
            break;
          case 'smart':
            dayGroups = this.distributeSmart(optimizedPlaces, daysCnt, maxPlacesPerDay, preferredPlacesPerDay);
            break;
          default:
            throw new Error(`알 수 없는 분배 방법: ${selectedMethod}`);
        }
  
        const duration = Date.now() - startTime;
        console.log(`✅ 일차별 분배 완료: ${duration}ms`);
  
        // 분배 결과 검증
        const totalDistributed = dayGroups.reduce((sum, day) => sum + day.length, 0);
        if (totalDistributed !== optimizedPlaces.length) {
          console.warn(`⚠️  분배 결과 검증 실패: ${totalDistributed}/${optimizedPlaces.length}`);
        }
  
        // 분배 결과 요약
        this.logDistributionSummary(dayGroups);
  
        return dayGroups;
  
      } catch (error) {
        console.error("❌ 일차별 분배 실패:", error.message);
        console.log("🔄 균등 분배로 fallback");
        return this.distributeEven(optimizedPlaces, daysCnt);
      }
    }
  
    /**
     * 최적 분배 방법 자동 선택
     */
    selectOptimalDistributionMethod(placeCount, dayCount, maxPerDay) {
      const avgPerDay = placeCount / dayCount;
  
      if (placeCount <= dayCount) {
        return 'one_per_day'; // 장소가 일수보다 적거나 같음
      } else if (avgPerDay <= maxPerDay && placeCount <= dayCount * maxPerDay) {
        return 'smart'; // 스마트 분배 가능
      } else if (avgPerDay > maxPerDay) {
        return 'balanced'; // 하루 최대치 초과, 밸런스 조정 필요
      } else {
        return 'even'; // 기본 균등 분배
      }
    }
  
    /**
     * 1. 하루에 하나씩 분배 (장소 수 ≤ 일수)
     */
    distributeOnePerDay(places, daysCnt) {
      console.log("📍 하루 한 장소씩 분배");
      
      const dayGroups = [];
      for (let d = 0; d < daysCnt; d++) {
        dayGroups.push(places[d] ? [places[d]] : []);
      }
      
      return dayGroups;
    }
  
    /**
     * 2. 균등 분배 (기본)
     */
    distributeEven(places, daysCnt) {
      console.log("⚖️  균등 분배");
      
      const perDay = Math.ceil(places.length / daysCnt);
      const dayGroups = [];
      
      for (let d = 0; d < daysCnt; d++) {
        const startIdx = d * perDay;
        const endIdx = Math.min((d + 1) * perDay, places.length);
        dayGroups.push(places.slice(startIdx, endIdx));
      }
      
      return dayGroups;
    }
  
    /**
     * 3. 밸런스 분배 (하루 최대치 고려)
     */
    distributeBalanced(places, daysCnt, maxPerDay) {
      console.log(`⚖️  밸런스 분배 (최대 ${maxPerDay}개/일)`);
      
      const dayGroups = [];
      let placeIndex = 0;
      
      for (let d = 0; d < daysCnt && placeIndex < places.length; d++) {
        const remainingDays = daysCnt - d;
        const remainingPlaces = places.length - placeIndex;
        
        // 남은 일수를 고려한 적정 분배량 계산
        const idealForToday = Math.min(
          maxPerDay,
          Math.ceil(remainingPlaces / remainingDays)
        );
        
        const dayPlaces = places.slice(placeIndex, placeIndex + idealForToday);
        dayGroups.push(dayPlaces);
        placeIndex += idealForToday;
      }
      
      return dayGroups;
    }
  
    /**
     * 4. 앞쪽 집중 분배 (초반에 더 많이)
     */
    distributeFrontLoaded(places, daysCnt, maxPerDay) {
      console.log("🏃 앞쪽 집중 분배");
      
      const dayGroups = [];
      let placeIndex = 0;
      
      for (let d = 0; d < daysCnt && placeIndex < places.length; d++) {
        // 앞쪽 날일수록 더 많이 배정 (선형 감소)
        const ratio = (daysCnt - d) / daysCnt;
        const placesForToday = Math.min(
          maxPerDay,
          Math.max(1, Math.ceil(ratio * (places.length / daysCnt) * 1.5))
        );
        
        const actualPlaces = Math.min(placesForToday, places.length - placeIndex);
        const dayPlaces = places.slice(placeIndex, placeIndex + actualPlaces);
        
        dayGroups.push(dayPlaces);
        placeIndex += actualPlaces;
      }
      
      return dayGroups;
    }
  
    /**
     * 5. 스마트 분배 (선호도 + 실용성 고려)
     */
    distributeSmart(places, daysCnt, maxPerDay, preferredPerDay) {
      console.log(`🧠 스마트 분배 (선호: ${preferredPerDay}개/일, 최대: ${maxPerDay}개/일)`);
      
      const dayGroups = [];
      let placeIndex = 0;
      
      for (let d = 0; d < daysCnt && placeIndex < places.length; d++) {
        const remainingDays = daysCnt - d;
        const remainingPlaces = places.length - placeIndex;
        
        let placesForToday;
        
        if (remainingDays === 1) {
          // 마지막 날: 남은 모든 장소 (최대치 내에서)
          placesForToday = Math.min(maxPerDay, remainingPlaces);
        } else {
          // 선호 개수를 기준으로 하되, 남은 장소/일수 고려
          const minNeeded = Math.ceil(remainingPlaces / remainingDays);
          placesForToday = Math.min(
            maxPerDay,
            Math.max(minNeeded, preferredPerDay)
          );
        }
        
        const actualPlaces = Math.min(placesForToday, remainingPlaces);
        const dayPlaces = places.slice(placeIndex, placeIndex + actualPlaces);
        
        dayGroups.push(dayPlaces);
        placeIndex += actualPlaces;
      }
      
      return dayGroups;
    }
  
    /**
     * 빈 일차 생성
     */
    createEmptyDays(daysCnt) {
      const dayGroups = [];
      for (let d = 0; d < daysCnt; d++) {
        dayGroups.push([]);
      }
      return dayGroups;
    }
  
    /**
     * 분배 결과 요약 로그
     */
    logDistributionSummary(dayGroups) {
      console.log("\n📊 일차별 분배 결과:");
      console.log(`- 총 일수: ${dayGroups.length}일`);
      console.log(`- 총 장소: ${dayGroups.reduce((sum, day) => sum + day.length, 0)}개`);
      console.log(`- 평균 장소/일: ${(dayGroups.reduce((sum, day) => sum + day.length, 0) / dayGroups.length).toFixed(1)}개`);
      
      dayGroups.forEach((dayPlaces, idx) => {
        if (dayPlaces.length > 0) {
          const placeNames = dayPlaces.map(p => p.place_name || p['여행지명']).join(', ');
          console.log(`  ${idx + 1}일차: ${dayPlaces.length}개 (${placeNames})`);
        } else {
          console.log(`  ${idx + 1}일차: 0개 (휴식일)`);
        }
      });
      
      // 분배 균형 체크
      const placeCounts = dayGroups.map(day => day.length);
      const maxCount = Math.max(...placeCounts);
      const minCount = Math.min(...placeCounts.filter(c => c > 0)); // 0 제외
      
      if (maxCount - minCount <= 2) {
        console.log(`✅ 분배 균형: 양호 (최대차이: ${maxCount - minCount}개)`);
      } else {
        console.log(`⚠️  분배 균형: 불균형 (최대차이: ${maxCount - minCount}개)`);
      }
    }
  
    /**
     * 분배 방법별 미리보기 (여러 방법 비교)
     */
    previewDistributionMethods(places, daysCnt, maxPerDay = 8) {
      console.log("\n🔍 분배 방법별 미리보기:");
      
      const methods = ['even', 'balanced', 'smart', 'front_loaded'];
      
      methods.forEach(method => {
        try {
          const dayGroups = this.distributePlacesByDays(places, daysCnt, {
            distributionMethod: method,
            maxPlacesPerDay: maxPerDay
          });
          
          const placeCounts = dayGroups.map(day => day.length);
          const total = placeCounts.reduce((sum, count) => sum + count, 0);
          
          console.log(`${method}: [${placeCounts.join(', ')}] (총 ${total}개)`);
        } catch (error) {
          console.log(`${method}: 실패 - ${error.message}`);
        }
      });
    }
  
    /**
     * 통계 정보 반환
     */
    getDistributionStats() {
      return { ...this.distributionStats };
    }
  
    /**
     * 분배 품질 점수 계산 (0-100)
     */
    calculateDistributionQuality(dayGroups, maxPerDay) {
      let score = 100;
      
      const placeCounts = dayGroups.map(day => day.length);
      const maxCount = Math.max(...placeCounts);
      const minCount = Math.min(...placeCounts.filter(c => c > 0));
      const avgCount = placeCounts.reduce((sum, c) => sum + c, 0) / placeCounts.length;
      
      // 균형성 점수 (최대 40점)
      const imbalance = maxCount - minCount;
      const balanceScore = Math.max(0, 40 - imbalance * 10);
      
      // 효율성 점수 (최대 30점)
      const efficiencyScore = Math.max(0, 30 - (maxCount > maxPerDay ? (maxCount - maxPerDay) * 10 : 0));
      
      // 빈 날 페널티 (최대 30점)
      const emptyDays = placeCounts.filter(c => c === 0).length;
      const emptyDayScore = Math.max(0, 30 - emptyDays * 15);
      
      score = balanceScore + efficiencyScore + emptyDayScore;
      
      return {
        total: score,
        balance: balanceScore,
        efficiency: efficiencyScore,
        emptyDayPenalty: emptyDayScore,
        details: {
          imbalance,
          maxCount,
          minCount,
          avgCount: avgCount.toFixed(1),
          emptyDays
        }
      };
    }
  }
  
  module.exports = DayDistributor;