// src/services/recommendationService.js
const recommendationRepository = require('../repositories/recommendationRepository');
const { RecommendationResponseDto } = require('../dtos/recommendationDto');
const axios = require('axios');
const { spawn } = require('child_process');
const path = require('path');

class RecommendationService {
  async callPythonScript(requestData) {
    return new Promise((resolve, reject) => {
      // Python 스크립트 경로 설정
      const pythonScriptPath = '/Users/chaejinseong/graduation-project/ai/src/recommender/ai_recommendation.py';

      // conda activate total
      // const pythonExecutable = '/home/hyeonwch/miniconda3/envs/ai_tavel_rec/bin/python';
      
      // 여행 기간 계산

      console.log(requestData);
      
      // Python 스크립트 실행
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
        result += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorData += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error(`Python 프로세스 오류 (코드: ${code}): ${errorData}`);
          reject(new Error('AI 추천 처리 중 오류가 발생했습니다.'));
          return;
        }

        try {
          // Python 스크립트 출력 결과를 JSON으로 파싱
          const parsedResult = JSON.parse(result);
          
          // recommendations 배열만 추출
          const recommendations = parsedResult.recommendations || [];
          
          resolve(recommendations);
        } catch (error) {
          console.error('JSON 파싱 오류:', error);
          console.error('받은 결과:', result);
          reject(new Error('결과 파싱 중 오류가 발생했습니다.'));
        }
      });

      // Python 프로세스 에러 처리
      pythonProcess.on('error', (error) => {
        console.error('Python 프로세스 실행 오류:', error);
        reject(new Error('Python 스크립트 실행 중 오류가 발생했습니다.'));
      });
    });
  }

  async getRecommendations(userId, requestDto) {
    try {
      // AI 서비스에 요청하기 위한 데이터 형식으로 변환
      const aiRequestData = requestDto.toAIRequestFormat();
      console.log(aiRequestData);
      
      // Python 스크립트 호출
      const recommendations = await this.callPythonScript(aiRequestData);
      
      // Tour API를 통해 추가 정보 가져오기
      const enrichedRecommendations = await this.enrichRecommendationsWithTourAPI(recommendations);
      
      // 추천 결과 저장
      // await recommendationRepository.saveRecommendation(
      //   userId,
      //   requestDto.startDate,
      //   requestDto.endDate,
      //   requestDto.companionsCount,
      //   requestDto.emotionIds,
      //   enrichedRecommendations
      // );
      
      // 프론트엔드가 원하는 형태로 변환
      const formattedRecommendations = enrichedRecommendations.map(recommendation => ({
        title: recommendation.item_name,
        description: recommendation.description || "대한민국의 아름다운 도시입니다.",
        image: recommendation.image || "/images/default-city.jpg",
        tags: this.generateTags(recommendation.related_activities)
      }));
      console.log("formattedRecommendations");
      console.log(formattedRecommendations);
      
      // userId와 함께 반환
      return {
        userId: userId,
        recommendations: formattedRecommendations
      };
      
    } catch (error) {
      console.error('추천 서비스 오류:', error);
      throw new Error('여행지 추천을 가져오는 중 오류가 발생했습니다.');
    }
  }

  async enrichRecommendationsWithTourAPI(recommendations) {
    const enrichedRecommendations = [];
    
    for (const recommendation of recommendations) {
      try {
        // Tour API에서 도시 정보 검색
        const cityInfo = await this.getCityInfoFromTourAPI(recommendation.item_name);
        console.log("cityInfo");
        console.log(cityInfo);
        
        enrichedRecommendations.push({
          ...recommendation,
          description: cityInfo.description,
          image: cityInfo.image
        });
        console.log("enrichedRecommendations");
        console.log(enrichedRecommendations);
      } catch (error) {
        console.error(`Tour API 오류 (${recommendation.item_name}):`, error);
        // API 호출 실패 시 기본값 사용
        enrichedRecommendations.push({
          ...recommendation,
          description: `${recommendation.item_name}의 아름다운 여행지입니다.`,
          image: `/images/${recommendation.item_name.toLowerCase()}.jpg`
        });
      }
    }
    
    return enrichedRecommendations;
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
          arrange: 'P', // 조회순으로 정렬
          contentTypeId: 12, // 관광지
          areaCode: await this.getAreaCode(searchKeyword), // 지역코드 조회
          _type: 'json'
        }
      });
  
      console.log('Search API Response:', JSON.stringify(searchResponse.data, null, 2));
  
      const items = searchResponse.data?.response?.body?.items?.item;
      
      if (!items) {
        // 관광지가 없으면 다른 콘텐츠 타입 검색
        return await this.fallbackSearch(cityName, searchKeyword);
      }
  
      // 가장 인기있는 관광지 선택
      const item = Array.isArray(items) ? items[0] : items;
      
      // 2. 상세 정보 조회
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
  
  // 지역코드 조회 헬퍼 함수
  async getAreaCode(cityName) {
    // Tour API의 지역코드
    const areaCodes = {
      '서울': 1,
      '인천': 2,
      '대전': 3,
      '대구': 4,
      '광주': 5,
      '부산': 6,
      '울산': 7,
      '세종특별자치시': 8,
      '경기도': 31,
      '강원도': 32,
      '충청북도': 33,
      '충청남도': 34,
      '경상북도': 35,
      '경상남도': 36,
      '전라북도': 37,
      '전라남도': 38,
      '제주도': 39
    };
    
    return areaCodes[cityName] || 1; // 기본값 서울
  }
  
  // 폴백 검색 함수
  async fallbackSearch(cityName, searchKeyword) {
    const TOUR_API_KEY = process.env.TOUR_API_KEY;
    const TOUR_API_BASE_URL = 'http://apis.data.go.kr/B551011/KorService1';
    
    try {
      // 키워드 검색으로 폴백
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
      
      if (!items) {
        throw new Error('관광 정보를 찾을 수 없습니다.');
      }
  
      const item = Array.isArray(items) ? items[0] : items;
      
      return {
        description: `${cityName}의 대표적인 여행지입니다. 다양한 관광명소와 문화체험을 즐기실 수 있습니다.`,
        image: item.firstimage || item.firstimage2 || this.getDefaultImage(cityName)
      };
    } catch (error) {
      throw error;
    }
  }

  generateTags(relatedActivities) {
    if (!relatedActivities || relatedActivities.length === 0) {
      return ["여행", "힐링", "관광"];
    }
    
    // 활동 내용을 기반으로 태그 생성
    const tags = [];
    const activityText = relatedActivities.join(' ');
    
    if (activityText.includes('바다') || activityText.includes('해수욕장')) tags.push('바다');
    if (activityText.includes('산') || activityText.includes('등산')) tags.push('자연');
    if (activityText.includes('카페') || activityText.includes('맛집')) tags.push('카페');
    if (activityText.includes('전통') || activityText.includes('한옥')) tags.push('전통');
    if (activityText.includes('야경') || activityText.includes('불빛')) tags.push('야경');
    
    // 기본 태그 추가
    if (tags.length === 0) {
      tags.push('여행', '힐링', '관광');
    } else if (tags.length < 3) {
      if (!tags.includes('힐링')) tags.push('힐링');
      if (!tags.includes('여행')) tags.push('여행');
    }
    
    return tags.slice(0, 3); // 최대 3개만 반환
  }

  async getMoodNames(moodIds) {
    const moodNames = [];
    for (const moodId of moodIds) {
      const mood = await recommendationRepository.getMoodById(moodId);
      if (mood) {
        moodNames.push(mood.mood_name);
      }
    }
    return moodNames;
  }
}

module.exports = new RecommendationService();