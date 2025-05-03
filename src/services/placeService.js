// src/services/placeService.js
const placeRepository = require('../repositories/placeRepository');
const { PlaceRecommendationDto } = require('../dtos/placePreferenceDto');
const { spawn } = require('child_process');
const axios = require('axios');

class PlaceService {

  callPythonScript(detailArgs) {
    return new Promise((resolve, reject) => {
      const scriptPath = '/home/hyeonwch/total/ai/src/recommender/ai_recommendation.py';

      const proc = spawn('python', [
        scriptPath,
        '--mode', 'detail',
        '--city', detailArgs.city,
        '--activity_type', detailArgs.activity_type,
        '--activity_ids', detailArgs.activity_ids.join(','),
        '--emotion_ids', detailArgs.emotion_ids.join(','),
        '--preferred_transport', detailArgs.preferred_transport || '',
        '--companions_count', String(detailArgs.companions_count || 1),
        '--activity_level', String(detailArgs.activity_level || 5),
        '--top_n', String(detailArgs.top_n || 3),
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
      // AI 서비스 요청 형식으로 변환
      const aiRequestData = preferenceDto.toAIRequestFormat();
      console.log('AI Request Data:', aiRequestData);
      
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
        image: place.image || `/images/default-place.jpg`,
        tags: this.generatePlaceTags(place.activity_ids, place.emotion_ids, place['분류']),
      }));
      
      console.log("Formatted Places:", formattedPlaces);
      return formattedPlaces;
      
    } catch (error) {
      console.error('여행지 추천 서비스 오류:', error);
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

  getDefaultImage(category) {
    const categoryImages = {
      '식당/카페': '/images/default-restaurant.jpg',
      '상업지구(거리, 시장, 쇼핑시설)': '/images/default-market.jpg',
      '해수욕장/해변/등대': '/images/default-beach.jpg',
      '산/휴양림/수목원': '/images/default-mountain.jpg',
      '박물관/전시관/미술관/기념관/과학관': '/images/default-museum.jpg',
      '체험관': '/images/default-experience.jpg',
      '놀이공원/테마파크': '/images/default-themepark.jpg',
      '캠핑장/방갈로': '/images/default-camping.jpg'
    };
    
    return categoryImages[category] || '/images/default-place.jpg';
  }
    
}

module.exports = new PlaceService();