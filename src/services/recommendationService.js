// src/services/recommendationService.js
const recommendationRepository = require('../repositories/recommendationRepository');
const { RecommendationResponseDto } = require('../dtos/recommendationDto');
const axios = require('axios');
const { spawn } = require('child_process');
const path = require('path');

class RecommendationService {
  async callPythonScript(requestData) {
    return new Promise((resolve, reject) => {
      const pythonScriptPath = path.join(__dirname, '../../../ai/src/recommender/ai_recommendation.py');
      console.log('Python 스크립트 경로:', pythonScriptPath);
      console.log('요청 데이터:', requestData);

      const pythonProcess = spawn('python', [
        pythonScriptPath,
        '--mode', 'city',
        '--trip_duration', requestData.trip_duration.toString(),
        '--companions_count', (requestData.companions_count || 1).toString(),
        '--emotion_ids', (requestData.emotion_ids || [1]).join(','),
        '--top_n', '3',
        '--recommendation_type', 'both',
        '--alpha', '0.7'
      ]);

      let result = '';
      let errorData = '';

      pythonProcess.stdout.on('data', (data) => {
        console.log('Python 출력:', data.toString());
        result += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        console.error('Python 에러:', data.toString());
        errorData += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          // console.error(`Python 프로세스 오류 (코드: ${code}): ${errorData}`);
          reject(new Error('AI 추천 처리 중 오류가 발생했습니다.'));
          return;
        }

        try {
          const parsedResult = JSON.parse(result);
          console.log('파싱된 결과:', parsedResult);
          resolve(parsedResult.recommendations || []);
        } catch (error) {
          // console.error('JSON 파싱 오류:', error);
          console.error('받은 결과:', result);
          reject(new Error('결과 파싱 중 오류가 발생했습니다.'));
        }
      });

      pythonProcess.on('error', (error) => {
        // console.error('Python 프로세스 실행 오류:', error);
        reject(new Error('Python 스크립트 실행 중 오류가 발생했습니다.'));
      });
    });
  }

  async getRecommendations(userId, requestDto) {
    try {
      const aiRequestData = requestDto.toAIRequestFormat();
      console.log(aiRequestData);
      
      // Python 스크립트 호출
      const recommendations = await this.callPythonScript(aiRequestData);
      console.log('[step ①] AI 결과', recommendations);
      const enrichedRecommendations = await this.enrichRecommendationsWithTourAPI(recommendations);
      console.log('[step ②] Tour API 결과', enrichedRecommendations);
      const depDate = requestDto.startDate.split('T')[0];
      const endDate = requestDto.endDate.split('T')[0];
      

      const { scheduleId } = await recommendationRepository.saveRecommendation(
        userId,
        depDate,
        endDate,
        requestDto.companionsCount,
        requestDto.emotionIds,
        enrichedRecommendations
      );
      console.log('[step ③] 추천 저장 결과', scheduleId);
      const formattedRecommendations = enrichedRecommendations.map(recommendation => ({
        title: recommendation.item_name,
        description: recommendation.description || "대한민국의 아름다운 도시입니다.",
        image: recommendation.image || "/images/default-city.png",
        tags: this.generateTags(recommendation.related_activities)
      }));
      // console.log("formattedRecommendations");
      // console.log(formattedRecommendations);
      
      // userId와 함께 반환
      return {
        userId: userId,
        tripId: scheduleId,
        recommendations: formattedRecommendations
      };
    } catch (error) {
      // console.error('추천 서비스 오류:', error);
      throw new Error('여행지 추천을 가져오는 중 오류가 발생했습니다.');
    }
  }

  async enrichRecommendationsWithTourAPI(recommendations) {
    const enrichedRecommendations = [];
    for (const recommendation of recommendations) {
      try {
        // Tour API에서 도시 정보 검색 (이미지가 있는 항목 찾기)
        const cityInfo = await this.findCityInfoWithImage(recommendation.item_name);
        
        enrichedRecommendations.push({
          ...recommendation,
          description: cityInfo.description,
          image: cityInfo.image
        });
      } catch (error) {
        console.error(`Tour API 오류 (${recommendation.item_name}):`, error);
        // API 호출 실패 시 기본값 사용
        enrichedRecommendations.push({
          ...recommendation,
          description: `${recommendation.item_name}의 아름다운 여행지입니다.`,
          image: `/public/images/${recommendation.item_name.toLowerCase()}.png`
        });
      }
    }
    return enrichedRecommendations;
  }

  async findCityInfoWithImage(cityName) {
    const TOUR_API_KEY = process.env.TOUR_API_KEY;
    const TOUR_API_BASE_URL = 'http://apis.data.go.kr/B551011/KorService1';
    
    try {
      // 지역명 매핑 (AI 추천 결과 -> Tour API 검색어)
      const cityNameMapping = {
        '강원': '강원도',
        '경기': '경기도',
        '경상남': '경상남도',
        '경상북': '경상북도',
        '전라남': '전라남도',
        '전라북': '전라북도',
        '충청남': '충청남도',
        '충청북': '충청북도',
        '제주': '제주도',
        '제주특별자치도': '제주도',
        '서울': '서울',
        '부산': '부산',
        '대구': '대구',
        '인천': '인천',
        '광주': '광주',
        '대전': '대전',
        '울산': '울산'
      };
  
      const searchKeyword = cityNameMapping[cityName] || cityName;
      
      // 1. 키워드 검색으로 변경 (정확한 지역의 관광지를 찾기 위해)
      const searchResponse = await axios.get(`${TOUR_API_BASE_URL}/searchKeyword1`, {
        params: {
          ServiceKey: TOUR_API_KEY,
          keyword: `${searchKeyword} 관광`, // 도시명 + "관광"으로 검색
          numOfRows: 30,
          pageNo: 1,
          MobileOS: 'ETC',
          MobileApp: 'TravelRecommendation',
          arrange: 'P', // 조회순으로 정렬
          contentTypeId: 12, // 관광지
          _type: 'json'
        }
      });
  
      let items = searchResponse.data?.response?.body?.items?.item;
      
      if (!items) {
        // 결과가 없으면 다른 콘텐츠 타입으로 검색
        return await this.fallbackSearchWithImage(cityName, searchKeyword);
      }
  
      // 배열로 변환
      if (!Array.isArray(items)) {
        items = [items];
      }
      
      // 이미지가 있는 항목만 필터링
      const itemsWithImages = items.filter(item => item.firstimage || item.firstimage2);
      
      if (itemsWithImages.length === 0) {
        return await this.fallbackSearchWithImage(cityName, searchKeyword);
      }
      
      // 원하는 지역에 속하는 결과만 필터링 (title에 지역명이 포함되는지 확인)
      const regionItems = itemsWithImages.filter(item => {
        // 지역명이 title에 포함되어 있거나, addr1(주소)에 지역명이 포함되어 있는 항목만 선택
        return (
          item.title?.includes(searchKeyword) || 
          item.addr1?.includes(searchKeyword)
        );
      });
      
      // 지역 필터링된 결과가 없으면 이미지 있는 모든 결과 중에서 선택
      const filteredItems = regionItems.length > 0 ? regionItems : itemsWithImages;
      
      // 첫 번째 항목 선택
      const selectedItem = filteredItems[0];
      
      // 상세 정보 조회
      const detailResponse = await axios.get(`${TOUR_API_BASE_URL}/detailCommon1`, {
        params: {
          ServiceKey: TOUR_API_KEY,
          contentId: selectedItem.contentid,
          MobileOS: 'ETC',
          MobileApp: 'TravelRecommendation',
          defaultYN: 'Y',
          firstImageYN: 'Y',
          areacodeYN: 'Y',
          addrinfoYN: 'Y',
          overviewYN: 'Y',
          _type: 'json'
        }
      });
  
      const detailItem = detailResponse.data?.response?.body?.items?.item;
      
      if (!detailItem) {
        throw new Error('상세 정보를 찾을 수 없습니다.');
      }
  
      const finalItem = Array.isArray(detailItem) ? detailItem[0] : detailItem;
      
      return {
        description: finalItem.overview ? 
          finalItem.overview.replace(/<[^>]*>/g, '').substring(0, 100) + '...' : 
          `${cityName}의 대표적인 관광지입니다.`,
        image: finalItem.firstimage || finalItem.firstimage2 || this.getDefaultImage(cityName)
      };
      
    } catch (error) {
      throw error;
    }
  }
  
  // 폴백 검색 함수도 업데이트
  async fallbackSearchWithImage(cityName, searchKeyword) {
    const TOUR_API_KEY = process.env.TOUR_API_KEY;
    const TOUR_API_BASE_URL = 'http://apis.data.go.kr/B551011/KorService1';
    
    try {
      // 다양한 콘텐츠 타입으로 검색 시도 (관광지 외에도 문화시설, 레포츠 등)
      const searchResponse = await axios.get(`${TOUR_API_BASE_URL}/searchKeyword1`, {
        params: {
          ServiceKey: TOUR_API_KEY,
          keyword: `${searchKeyword} 명소`, // "명소"로 키워드 변경
          numOfRows: 30,
          pageNo: 1,
          MobileOS: 'ETC',
          MobileApp: 'TravelRecommendation',
          _type: 'json'
        }
      });
  
      let items = searchResponse.data?.response?.body?.items?.item;
      
      if (!items) {
        // 최종 폴백: 지역명만으로 검색
        const lastResponse = await axios.get(`${TOUR_API_BASE_URL}/searchKeyword1`, {
          params: {
            ServiceKey: TOUR_API_KEY,
            keyword: searchKeyword,
            numOfRows: 30,
            pageNo: 1,
            MobileOS: 'ETC',
            MobileApp: 'TravelRecommendation',
            _type: 'json'
          }
        });
        
        items = lastResponse.data?.response?.body?.items?.item;
        
        if (!items) {
          throw new Error('관광 정보를 찾을 수 없습니다.');
        }
      }
  
      // 배열로 변환
      if (!Array.isArray(items)) {
        items = [items];
      }
      
      // 이미지가 있는 항목 필터링
      const itemsWithImages = items.filter(item => item.firstimage || item.firstimage2);
      
      if (itemsWithImages.length === 0) {
        // 이미지가 있는 항목이 없는 경우 기본 이미지 사용
        return {
          description: `${cityName}의 대표적인 여행지입니다. 다양한 관광명소와 문화체험을 즐기실 수 있습니다.`,
          image: this.getDefaultImage(cityName)
        };
      }
      
      // 원하는 지역에 속하는 결과만 필터링
      const regionItems = itemsWithImages.filter(item => {
        return (
          item.title?.includes(searchKeyword) || 
          item.addr1?.includes(searchKeyword)
        );
      });
      
      // 지역 필터링된 결과가 없으면 이미지 있는 모든 결과 중에서 선택
      const filteredItems = regionItems.length > 0 ? regionItems : itemsWithImages;
      
      // 첫 번째 항목 선택
      const selectedItem = filteredItems[0];
      
      return {
        description: selectedItem.title ? 
          `${cityName}의 대표 관광지 "${selectedItem.title}". 다양한 관광명소와 문화체험을 즐기실 수 있습니다.` : 
          `${cityName}의 대표적인 여행지입니다.`,
        image: selectedItem.firstimage || selectedItem.firstimage2 || this.getDefaultImage(cityName)
      };
    } catch (error) {
      throw error;
    }
  }

  getDefaultImage(category) {
    const categoryImages = {
      '식당/카페': '/images/default-restaurant.png',
      '상업지구(거리, 시장, 쇼핑시설)': '/images/default-market.png',
      '해수욕장/해변/등대': '/images/default-beach.png',
      '산/휴양림/수목원': '/images/default-mountain.png',
      '박물관/전시관/미술관/기념관/과학관': '/images/default-museum.png',
      '체험관': '/images/default-experience.png',
      '놀이공원/테마파크': '/images/default-themepark.png',
      '캠핑장/방갈로': '/images/default-camping.png'
    };
    
    return categoryImages[category] || '/images/default-place.png';
  }

  async getCityInfoFromTourAPI(cityName) {
    const TOUR_API_KEY = process.env.TOUR_API_KEY;
    const TOUR_API_BASE_URL = 'http://apis.data.go.kr/B551011/KorService1';
    
    try {
      console.log(`Tour API 호출 시작: ${cityName}`);
      
      // 지역명 매핑 (AI 추천 결과 -> Tour API 검색어)
      const cityNameMapping = {
        '강원': '강원도',
        '경기': '경기도',
        '경상남': '경상남도',
        '경상북': '경상북도',
        '전라남': '전라남도',
        '전라북': '전라북도',
        '충청남': '충청남도',
        '충청북': '충청북도',
        '제주': '제주도',
        '서울': '서울',
        '부산': '부산',
        '대구': '대구',
        '인천': '인천',
        '광주': '광주',
        '대전': '대전',
        '울산': '울산'
      };
  
      const searchKeyword = cityNameMapping[cityName] || cityName;
      
      // 1. 지역별 관광정보 조회 (관광지 contenttypeid=12로 필터링)
      const searchResponse = await axios.get(`${TOUR_API_BASE_URL}/areaBasedList1`, {
        params: {
          ServiceKey: TOUR_API_KEY,
          pageNo: 1,
          numOfRows: 10,
          MobileApp: 'TravelRecommendation',
          MobileOS: 'ETC',
          arrange: 'P',
          contentTypeId: 12,
          areaCode: await this.getAreaCode(searchKeyword),
          _type: 'json'
        }
      });
  
      console.log('Search API Response:', JSON.stringify(searchResponse.data, null, 2));
  
      const items = searchResponse.data?.response?.body?.items?.item;
      if (!items) return await this.fallbackSearch(cityName, searchKeyword);

      const item = Array.isArray(items) ? items[0] : items;

      const detailResponse = await axios.get(`${TOUR_API_BASE_URL}/detailCommon1`, {
        params: {
          ServiceKey: TOUR_API_KEY,
          contentId: item.contentid,
          MobileOS: 'ETC',
          MobileApp: 'TravelRecommendation',
          defaultYN: 'Y',
          firstImageYN: 'Y',
          areacodeYN: 'Y',
          addrinfoYN: 'Y',
          overviewYN: 'Y',
          _type: 'json'
        }
      });
      console.log('Detail API Response:', JSON.stringify(detailResponse.data, null, 2));
  
      const detailItem = detailResponse.data?.response?.body?.items?.item;
      
      if (!detailItem) {
        throw new Error('상세 정보를 찾을 수 없습니다.');
      }
  
      const finalItem = Array.isArray(detailItem) ? detailItem[0] : detailItem;

      return {
        description: finalItem.overview ?
          finalItem.overview.replace(/<[^>]*>/g, '').substring(0, 100) + '...' :
          `${cityName}의 대표적인 관광지입니다.`,
        image: finalItem.firstimage || finalItem.firstimage2 || this.getDefaultImage(cityName)
      };
    } catch (error) {
      console.error('Tour API 호출 오류:', error);
      throw error;
    }
  }

  async getAreaCode(cityName) {
    const areaCodes = {
      '서울': 1, '인천': 2, '대전': 3, '대구': 4, '광주': 5, '부산': 6,
      '울산': 7, '세종특별자치시': 8, '경기도': 31, '강원도': 32, '충청북도': 33,
      '충청남도': 34, '경상북도': 35, '경상남도': 36, '전라북도': 37,
      '전라남도': 38, '제주도': 39
    };
    return areaCodes[cityName] || 1;
  }

  async fallbackSearch(cityName, searchKeyword) {
    const TOUR_API_KEY = process.env.TOUR_API_KEY;
    const TOUR_API_BASE_URL = 'http://apis.data.go.kr/B551011/KorService1';

    try {
      const searchResponse = await axios.get(`${TOUR_API_BASE_URL}/searchKeyword1`, {
        params: {
          ServiceKey: TOUR_API_KEY,
          keyword: `${searchKeyword} 관광`,
          numOfRows: 5,
          pageNo: 1,
          MobileOS: 'ETC',
          MobileApp: 'TravelRecommendation',
          _type: 'json'
        }
      });

      const items = searchResponse.data?.response?.body?.items?.item;
      const item = Array.isArray(items) ? items[0] : items;

      return {
        description: `${cityName}의 대표적인 여행지입니다. 다양한 관광명소와 문화체험을 즐기실 수 있습니다.`,
        image: item.firstimage || item.firstimage2 || this.getDefaultImage(cityName)
      };
    } catch (error) {
      throw error;
    }
  }

  getDefaultImage(cityName) {
    const defaultImages = {
      '제주특별자치도': '/images/제주특별자치도.jpg',
      '전라남도': '/images/전라남도.jpg',
      '강원도': '/images/강원도.jpg',
      '서울': '/images/서울.jpg',
      '부산': '/images/부산.jpg'
    };
    return defaultImages[cityName] || '/images/default.jpg';
  }

  generateTags(relatedActivities) {
    if (!relatedActivities || relatedActivities.length === 0) return ["여행", "힐링", "관광"];

    const tags = [];
    const activityText = relatedActivities.join(' ');
    if (activityText.includes('바다') || activityText.includes('해수욕장')) tags.push('바다');
    if (activityText.includes('산') || activityText.includes('등산')) tags.push('자연');
    if (activityText.includes('카페') || activityText.includes('맛집')) tags.push('카페');
    if (activityText.includes('전통') || activityText.includes('한옥')) tags.push('전통');
    if (activityText.includes('야경') || activityText.includes('불빛')) tags.push('야경');

    if (tags.length === 0) tags.push('여행', '힐링', '관광');
    else if (tags.length < 3) {
      if (!tags.includes('힐링')) tags.push('힐링');
      if (!tags.includes('여행')) tags.push('여행');
    }

    return tags.slice(0, 3);
  }

  async getMoodNames(moodIds) {
    const moodNames = [];
    for (const moodId of moodIds) {
      const mood = await recommendationRepository.getMoodById(moodId);
      if (mood) moodNames.push(mood.mood_name);
    }
    return moodNames;
  }
}

module.exports = new RecommendationService();
