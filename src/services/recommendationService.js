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
          console.error(`Python 프로세스 오류 (코드: ${code}): ${errorData}`);
          reject(new Error('AI 추천 처리 중 오류가 발생했습니다.'));
          return;
        }

        try {
          const parsedResult = JSON.parse(result);
          console.log('파싱된 결과:', parsedResult);
          resolve(parsedResult.recommendations || []);
        } catch (error) {
          console.error('JSON 파싱 오류:', error);
          reject(new Error('결과 파싱 중 오류가 발생했습니다.'));
        }
      });

      pythonProcess.on('error', (error) => {
        console.error('Python 프로세스 실행 오류:', error);
        reject(new Error('Python 스크립트 실행 중 오류가 발생했습니다.'));
      });
    });
  }

  async getRecommendations(userId, requestDto) {
    try {
      const aiRequestData = requestDto.toAIRequestFormat();
      const recommendations = await this.callPythonScript(aiRequestData);
      const enrichedRecommendations = await this.enrichRecommendationsWithTourAPI(recommendations);

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

      const formattedRecommendations = enrichedRecommendations.map(recommendation => ({
        title: recommendation.item_name,
        description: recommendation.description || "대한민국의 아름다운 도시입니다.",
        image: recommendation.image || "/images/default-city.jpg",
        tags: this.generateTags(recommendation.related_activities)
      }));

      return {
        userId: userId,
        tripId: scheduleId,
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
        const cityInfo = await this.getCityInfoFromTourAPI(recommendation.item_name);
        enrichedRecommendations.push({
          ...recommendation,
          description: cityInfo.description,
          image: cityInfo.image
        });
      } catch (error) {
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

    const cityNameMapping = {
      '강원': '강원도', '경기': '경기도', '경상남': '경상남도', '경상북': '경상북도',
      '전라남': '전라남도', '전라북': '전라북도', '충청남': '충청남도', '충청북': '충청북도',
      '제주': '제주도', '서울': '서울', '부산': '부산', '대구': '대구', '인천': '인천',
      '광주': '광주', '대전': '대전', '울산': '울산'
    };
    const searchKeyword = cityNameMapping[cityName] || cityName;

    try {
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

      const detailItem = detailResponse.data?.response?.body?.items?.item;
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
