const placeRepository = require('../repositories/placeRepository');
const { PlaceRecommendationDto } = require('../dtos/placePreferenceDto');
const { HotPlaceDto } = require('../dtos/hotPlaceDto');
const { FinalPlaceRecommendationDto } = require('../dtos/FinalPlacePreferenceDto');
const { spawn } = require('child_process');
const axios = require('axios');
const path = require('path');

// 🚀 우리가 개발한 3단계 시스템 Import
const CoordinateValidator = require('./routeClasses/CoordinateValidator');
const KakaoRouteOptimizer = require('./routeClasses/KakaoRouteOptimizer');
const DayDistributor = require('./routeClasses/DayDistributor');

class PlaceService {
  constructor() {
    // 🚀 3단계 시스템 인스턴스 생성
    this.coordinateValidator = new CoordinateValidator();
    this.routeOptimizer = new KakaoRouteOptimizer();
    this.dayDistributor = new DayDistributor();
  }
  
  async getHotplace(id){
    const place = await placeRepository.getHotplace(id);
    return HotPlaceDto.toDto(place);
  }

  getDefaultImage(category) {
    const categoryImages = {
      '식당/카페': '/public/images/default-restaurant.png',
      '상업지구(거리, 시장, 쇼핑시설)': '/public/images/default-market.png',
      '해수욕장/해변/등대': '/public/images/default-beach.png',
      '산/휴양림/수목원': '/public/images/default-mountain.png',
      '박물관/전시관/미술관/기념관/과학관': '/public/images/default-museum.png',
      '체험관': '/public/images/default-experience.png',
      '놀이공원/테마파크': '/public/images/default-themepark.png',
      '캠핑장/방갈로': '/public/images/default-camping.png'
    };
    
    return categoryImages[category] || '/public/images/default-place.png';
  }

  callPythonScript(detailArgs) {
    // ── 배열 아닌 경우를 대비한 보정 ───────────────────
    const actIds = Array.isArray(detailArgs.activity_ids)
                     ? detailArgs.activity_ids
                     : (detailArgs.activity_ids ? [detailArgs.activity_ids] : []);
  
    const emoIds = Array.isArray(detailArgs.emotion_ids)
                     ? detailArgs.emotion_ids
                     : (detailArgs.emotion_ids ? [detailArgs.emotion_ids] : []);
  
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(__dirname, '../../../ai/src/recommender/ai_recommendation.py');
      const proc = spawn('python', [
        scriptPath,
        '--mode', 'detail',
        '--city', detailArgs.city,
        '--activity_type', detailArgs.activity_type,
        '--activity_ids',  actIds.join(','),
        '--emotion_ids',   emoIds.join(','),
        '--preferred_transport', detailArgs.preferred_transport || '',
        '--companions_count', String(detailArgs.companions_count || 1),
        '--activity_level',  String(detailArgs.activity_level  || 5),
        '--place_name',      detailArgs.place_name      || '',
        '--trip_duration',   String(detailArgs.trip_duration   || 1),
        '--top_n',           String(detailArgs.top_n           || 3),
        '--alpha', '0.7'
      ]);

      let out = '', err = '';
      proc.stdout.on('data', d => out += d.toString());
      proc.stderr.on('data', d => err += d.toString());

      proc.on('close', code => {
        if (code !== 0) {
          console.error('PY err:', err);
          return reject(new Error('AI 추천 스크립트 실패'));
        }
        try {
          const parsed = JSON.parse(out);
          // AI 응답이 places 배열인 경우와 직접 배열인 경우 모두 처리
          const places = parsed.places || parsed;
          resolve(places);
        } catch (e) {
          console.error('JSON parse fail:', e, out);
          reject(new Error('AI 결과 파싱 오류'));
        }
      });
      proc.on('error', reject);
    });
  }

  async getPlaceRecommendations(userId, preferenceDto) {
    try {
      console.log('preferenceDto:', preferenceDto);
      // AI 서비스 요청 형식으로 변환
      const aiRequestData = preferenceDto.toAIRequestFormat();
      console.log('aiRequestData:', aiRequestData);
      
      // Python 스크립트 호출
      const aiResponse = await this.callPythonScript(aiRequestData);
      console.log('AI Response:', aiResponse);
      
      // Tour API를 통해 장소 정보 추가
      const enrichedPlaces = await this.enrichPlacesWithTourAPI(aiResponse, aiRequestData.city);
      
      // 프론트엔드 형식으로 변환
      const formattedPlaces = enrichedPlaces.map((place, index) => ({
        id: (index + 1).toString(),
        title: place.place_name || place['여행지명'],
        description: place.description || `${place.place_name || place['여행지명']}의 멋진 장소입니다.`,
        image: place.image || `/public/images/default-place.png`,
        tags: this.generatePlaceTags(place.activity_ids, place.emotion_ids, place['분류']),
      }));
      
      console.log("Formatted Places:", formattedPlaces);
      return formattedPlaces;
      
    } catch (error) {
      console.error('여행지 추천 서비스 오류:', error);
      throw new Error('여행지 추천을 가져오는 중 오류가 발생했습니다.');
    }
  }

  /**
   * 🚀 개선된 getFinalPlaceRecommendations - 우리의 3단계 시스템 적용
   */
  async getFinalPlaceRecommendations(userId, tripDto, tripId) {
    try {
      console.log("🚀 개선된 여행지 추천 시작");
      console.log("tripDto", tripDto);

      /* ===== 기존: AI 요청 → 응답 → Tour-API 보강 ===== */
      const aiReq = tripDto.toAIRequestFormat();
      console.log("aiReq", aiReq);
      
      const raw = await this.callPythonScript(aiReq);
      console.log(`📍 AI 추천 결과: ${raw.length}개 장소`);
      
      let places = await this.enrichPlacesWithTourAPI(raw, aiReq.city);
      console.log(`🏛️ Tour API 보강 완료: ${places.length}개 장소`);

      /* ===== 1단계: 좌표 검증 및 필터링 ===== */
      console.log("\n🔍 1단계: 좌표 검증 시작");
      const validationResult = await this.coordinateValidator.validatePlaceCoordinates(places, aiReq.city);
      
      if (validationResult.validPlaces.length === 0) {
        throw new Error("유효한 좌표를 가진 장소를 찾을 수 없습니다.");
      }

      places = validationResult.validPlaces;
      console.log(`✅ 1단계 완료: ${validationResult.stats.success}/${validationResult.stats.total}개 장소 유효`);

      /* ===== 2단계: 카카오 경로 최적화 ===== */
      console.log("\n🇰🇷 2단계: 카카오 경로 최적화 시작");
      const optimizedPlaces = await this.routeOptimizer.optimizePlaceOrder(places, {
        priority: 'RECOMMEND' // 카카오 추천 경로
      });
      console.log(`✅ 2단계 완료: ${optimizedPlaces.length}개 장소 최적화 완료`);

      /* ===== 날짜 범위 계산 (기존 로직 유지) ===== */
      const MS_DAY = 86_400_000;
      const startDate = aiReq.visit_date ? new Date(aiReq.visit_date) :
                       aiReq.departure_date ? new Date(aiReq.departure_date) :
                       new Date();

      let daysCnt = Number(aiReq.trip_duration) || 0;
      console.log("daysCnt", daysCnt);
      
      if (!daysCnt && aiReq.visit_date && aiReq.departure_date) {
        const dt1 = new Date(aiReq.visit_date.split('T')[0]);
        const dt2 = new Date(aiReq.departure_date.split('T')[0]);
        daysCnt = Math.max(1, Math.round((dt2 - dt1) / MS_DAY) + 1);
      }
      if (!daysCnt) daysCnt = 1;

      console.log(`📅 여행 기간: ${daysCnt}일`);

      /* ===== 3단계: 스마트 일차별 분배 ===== */
      console.log("\n📅 3단계: 스마트 일차별 분배 시작");
      const dayGroups = this.dayDistributor.distributePlacesByDays(optimizedPlaces, daysCnt, {
        distributionMethod: 'smart',
        maxPlacesPerDay: 6,
        preferredPlacesPerDay: Math.ceil(optimizedPlaces.length / daysCnt)
      });
      console.log(`✅ 3단계 완료: ${dayGroups.length}일 분배 완료`);

      /* ===== 기존 포맷으로 변환 (프론트엔드 호환성) ===== */
      console.log("\n🎨 기존 포맷으로 변환 중...");
      const plan = { days: [] };
      const flatPlaces = [];
      let globalOrder = 1;

      for (let d = 0; d < daysCnt; d++) {
        const visitDateObj = new Date(startDate.getTime() + d * MS_DAY);
        const visitDateISO = visitDateObj.toISOString().slice(0, 10);

        const dayPlaces = dayGroups[d] || [];
        
        const items = dayPlaces.map((p, idx) => {
          const title = p.place_name || p['여행지명'];

          /* DB 레코드 (좌표 정보 추가) */
          flatPlaces.push({
            title: title,
            description: p.description ?? `${title}의 멋진 장소입니다.`,
            image: p.image || '/images/default-place.png',
            category: this.generatePlaceTags(p.activity_ids, p.emotion_ids, p['분류'])[0] ?? null,
            order: globalOrder,
            visit_date: visitDateISO,
            // 🚀 좌표 정보 추가 (repository에서 기대하는 필드명으로)
            latitude: p.lat,           // lat -> latitude
            longitude: p.lng,          // lng -> longitude
            road_address: p.road_address || null,
            validation_source: p.source || 'kakao_api'
          });

          /* 프런트 카드 (좌표 정보 추가) */
          const card = {
            id: `${d + 1}-${idx + 1}`,
            title: title,
            description: p.description ?? `${title}의 멋진 장소입니다.`,
            image: p.image || '/images/default-place.png',
            tags: this.generatePlaceTags(p.activity_ids, p.emotion_ids, p['분류']),
            region: aiReq.city?.toLowerCase() || 'unknown',
            visit_date: visitDateISO,
            // 🚀 새로 추가: 좌표 정보
            lat: p.lat,
            lng: p.lng,
            road_address: p.road_address || null
          };

          console.log("card", card);
          globalOrder++;
          return card;
        });

        plan.days.push({ 
          day: d + 1, 
          items,
          totalPlaces: items.length // 추가 정보
        });
      }

      /* ===== DB 저장 ===== */
      console.log("\n💾 DB 저장 중...");
      await placeRepository.saveRecommendations(userId, tripId, flatPlaces);

      /* ===== 통계 출력 ===== */
      console.log("\n📊 처리 완료 통계:");
      console.log(`- 원본 장소: ${raw.length}개`);
      console.log(`- 좌표 검증: ${validationResult.stats.success}개 성공`);
      console.log(`- 경로 최적화: 카카오 API ${this.routeOptimizer.getStats().apiCallCount}회 호출`);
      console.log(`- 일차별 분배: ${this.dayDistributor.getDistributionStats().distributionMethod} 방식`);
      
      // 분배 품질 평가
      const quality = this.dayDistributor.calculateDistributionQuality(dayGroups, 6);
      console.log(`- 분배 품질: ${quality.total.toFixed(1)}/100점`);

      const finalResult = new FinalPlaceRecommendationDto(plan);
      console.log("🎉 개선된 여행지 추천 완료!");
      
      return finalResult;

    } catch (err) {
      console.error('개선된 여행지 추천 서비스 오류:', err);
      
      // 오류 발생 시 기존 방식으로 fallback
      console.log("🔄 기존 방식으로 fallback 실행...");
      return await this.getFinalPlaceRecommendationsFallback(userId, tripDto, tripId);
    }
  }

  /**
   * 🔄 Fallback: 기존 방식 (오류 발생 시)
   */
  async getFinalPlaceRecommendationsFallback(userId, tripDto, tripId) {
    try {
      console.log("🔄 Fallback: 기존 방식으로 처리");
      
      const aiReq = tripDto.toAIRequestFormat();
      const raw = await this.callPythonScript(aiReq);
      const places = await this.enrichPlacesWithTourAPI(raw, aiReq.city);

      const MS_DAY = 86_400_000;
      const startDate = aiReq.visit_date ? new Date(aiReq.visit_date) :
                       aiReq.departure_date ? new Date(aiReq.departure_date) :
                       new Date();

      let daysCnt = Number(aiReq.trip_duration) || 0;
      if (!daysCnt && aiReq.visit_date && aiReq.departure_date) {
        const dt1 = new Date(aiReq.visit_date.split('T')[0]);
        const dt2 = new Date(aiReq.departure_date.split('T')[0]);
        daysCnt = Math.max(1, Math.round((dt2 - dt1) / MS_DAY) + 1);
      }
      if (!daysCnt) daysCnt = 1;

      // 기존 균등분배 방식
      const perDay = Math.ceil(places.length / daysCnt);
      const plan = { days: [] };
      const flatPlaces = [];

      for (let d = 0; d < daysCnt; d++) {
        const visitDateObj = new Date(startDate.getTime() + d * MS_DAY);
        const visitDateISO = visitDateObj.toISOString().slice(0, 10);

        const slice = places.slice(d * perDay, (d + 1) * perDay);

        const items = slice.map((p, idx) => {
          const globalOrder = d * perDay + idx + 1;

          const card = {
            id: `${d + 1}-${idx + 1}`,
            title: p.place_name || p['여행지명'],
            description: p.description ?? `${p.place_name || p['여행지명']}의 멋진 장소입니다.`,
            image: p.image || '/images/default-place.png',
            tags: this.generatePlaceTags(p.activity_ids, p.emotion_ids, p['분류']),
            region: aiReq.city?.toLowerCase() || 'unknown',
            visit_date: visitDateISO,
          };

          flatPlaces.push({
            title: card.title,
            description: card.description,
            image: card.image,
            category: card.tags[0] ?? null,
            order: globalOrder,
            visit_date: visitDateISO,
          });

          return card;
        });

        plan.days.push({ day: d + 1, items });
      }

      await placeRepository.saveRecommendations(userId, tripId, flatPlaces);
      console.log("✅ Fallback 처리 완료");
      
      return new FinalPlaceRecommendationDto(plan);

    } catch (fallbackError) {
      console.error('Fallback도 실패:', fallbackError);
      throw new Error('여행지 추천을 가져오는 중 오류가 발생했습니다.');
    }
  }

  async enrichPlacesWithTourAPI(places, city) {
    const enrichedPlaces = [];
    const TOUR_API_KEY = process.env.TOUR_API_KEY;
    const TOUR_API_BASE_URL = 'http://apis.data.go.kr/B551011/KorService1';
    
    for (const place of places) {
      try {
        const placeName = place.place_name || place['여행지명'];
        const placeCategory = place['분류'];
        
        console.log(`Searching for: ${placeName} in ${city}`);
        
        // Tour API에서 장소 검색
        const searchResponse = await axios.get(`${TOUR_API_BASE_URL}/searchKeyword1`, {
          params: {
            ServiceKey: TOUR_API_KEY,
            keyword: `${placeName}`,
            numOfRows: 10,
            pageNo: 1,
            MobileOS: 'ETC',
            MobileApp: 'TravelRecommendation',
            _type: 'json'
          }
        });

        console.log('Search Response:', searchResponse.data);
        
        const items = searchResponse.data?.response?.body?.items?.item;
        let placeInfo = null;
        
        if (items) {
          // 배열인지 단일 객체인지 확인
          const itemArray = Array.isArray(items) ? items : [items];
          
          // 가장 적합한 장소 찾기
          const matchingItem = itemArray.find(item => 
            item.title.includes(placeName) || placeName.includes(item.title)
          ) || itemArray[0];
          
          if (matchingItem) {
            // 상세 정보 조회
            const detailResponse = await axios.get(`${TOUR_API_BASE_URL}/detailCommon1`, {
              params: {
                ServiceKey: TOUR_API_KEY,
                contentId: matchingItem.contentid,
                MobileOS: 'ETC',
                MobileApp: 'TravelRecommendation',
                defaultYN: 'Y',
                firstImageYN: 'Y',
                overviewYN: 'Y',
                _type: 'json'
              }
            });

            const detailItem = detailResponse.data?.response?.body?.items?.item;
            if (detailItem) {
              const detail = Array.isArray(detailItem) ? detailItem[0] : detailItem;
              
              placeInfo = {
                description: detail.overview ? 
                  detail.overview.replace(/<[^>]*>/g, '').substring(0, 150) + '...' :
                  `${placeName}은(는) ${city}의 인기 있는 ${placeCategory}입니다.`,
                image: detail.firstimage || detail.firstimage2
              };
            }
          }
        }
        
        // Tour API에서 정보를 찾지 못한 경우 기본값 사용
        enrichedPlaces.push({
          ...place,
          place_name: placeName,
          description: placeInfo?.description || this.getDefaultDescription(placeName, placeCategory),
          image: placeInfo?.image || this.getDefaultImage(placeCategory)
        });
        
      } catch (error) {
        console.error(`Tour API 오류 (${place['여행지명']}):`, error);
        
        // API 오류 시 기본값 사용
        const placeName = place.place_name || place['여행지명'];
        const placeCategory = place['분류'];
        
        enrichedPlaces.push({
          ...place,
          place_name: placeName,
          description: this.getDefaultDescription(placeName, placeCategory),
          image: this.getDefaultImage(placeCategory)
        });
      }
    }
    
    return enrichedPlaces;
  }

  generatePlaceTags(activityIds, emotionIds, category) {
    const tags = [];
    
    // 카테고리 기반 태그
    const categoryTags = {
      '식당/카페': ['맛집', '카페', '미식'],
      '상업지구(거리, 시장, 쇼핑시설)': ['쇼핑', '시장', '체험'],
      '놀이공원/테마파크': ['놀이', '액티비티', '즐거움'],
      '레포츠시설(스포츠)': ['스포츠', '운동', '활동'],
      '산/휴양림/수목원': ['자연', '힐링', '산책'],
      '해수욕장/해변/등대': ['바다', '해변', '휴양'],
      '종교시설(사찰, 교회, 성지)': ['문화', '역사', '고즈넉'],
      '체험관': ['체험', '교육', '가족'],
      '박물관/전시관/미술관/기념관/과학관': ['문화', '예술', '교육'],
      '펜션/민박': ['숙박', '휴식', '여유'],
      '특산품(농수산물)': ['특산품', '먹거리', '기념품'],
      '캠핑장/방갈로': ['캠핑', '자연', '아웃도어'],
      '축제/행사': ['축제', '이벤트', '문화']
    };
    
    // 감정 ID 매핑
    const emotionTags = {
      '1': '행복',
      '2': '슬픔',
      '3': '분노',
      '4': '여유',
      '5': '스트레스',
      '6': '우울',
      '7': '설렘',
      '8': '평온',
      '9': '외로움',
      '10': '감동',
      '11': '성취',
      '12': '자유',
      '13': '후회'
    };
    
    // 카테고리 기반 태그 추가
    if (category && categoryTags[category]) {
      tags.push(...categoryTags[category]);
    }
    
    // 감정 태그 추가
    if (emotionIds) {
      emotionIds.forEach(id => {
        if (emotionTags[id]) tags.push(emotionTags[id]);
      });
    }
    
    // 기본 태그 추가
    if (tags.length === 0) {
      tags.push('여행', '힐링', '관광');
    }
    
    // 중복 제거하고 최대 3개만 반환
    return [...new Set(tags)].slice(0, 3);
  }

  getDefaultDescription(placeName, category) {
    const descriptions = {
      '식당/카페': `${placeName}은(는) 지역 주민과 관광객들에게 사랑받는 맛집입니다. 특별한 메뉴와 분위기로 여행의 즐거움을 더해줍니다.`,
      '상업지구(거리, 시장, 쇼핑시설)': `${placeName}은(는) 다양한 상품과 먹거리가 있는 활기찬 장소입니다. 현지 문화를 체험하기에 좋습니다.`,
      '해수욕장/해변/등대': `${placeName}은(는) 아름다운 바다 풍경과 시원한 바람을 즐길 수 있는 해변입니다.`,
      '산/휴양림/수목원': `${placeName}은(는) 맑은 공기와 아름다운 자연 경관을 즐길 수 있는 힐링 명소입니다.`,
      '박물관/전시관/미술관/기념관/과학관': `${placeName}은(는) 문화와 예술을 체험할 수 있는 교육적인 공간입니다.`,
      '체험관': `${placeName}은(는) 다양한 체험 프로그램을 통해 특별한 추억을 만들 수 있는 곳입니다.`
    };
    
    return descriptions[category] || `${placeName}은(는) ${category}의 인기 명소입니다. 여행객들에게 특별한 경험을 제공합니다.`;
  }

  /**
   * 🔧 캐시 관리 메서드들 (운영용)
   */
  clearAllCaches() {
    this.coordinateValidator.clearCache();
    this.routeOptimizer.clearCache();
    console.log("🗑️ 모든 캐시가 초기화되었습니다.");
  }

  getSystemStats() {
    return {
      coordinateValidation: this.coordinateValidator.getCacheStats(),
      routeOptimization: this.routeOptimizer.getStats(),
      dayDistribution: this.dayDistributor.getDistributionStats()
    };
  }
}

module.exports = new PlaceService();