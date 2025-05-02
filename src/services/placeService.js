// src/services/placeService.js
const placeRepository = require('../repositories/placeRepository');
const { PlaceRecommendationDto } = require('../dtos/placePreferenceDto');
// const axios = require('axios');

class PlaceService {
  async getPlaceRecommendations(userId, preferenceDto) {
    try {
      // AI 서비스 요청 형식으로 변환
      const aiRequestData = preferenceDto.toAIRequestFormat();
      
      // 실제 AI 서비스 호출 (추후 구현)
      // const aiResponse = await this.callAIService(aiRequestData);
      
      // 모킹 데이터 - 도시별 추천 장소
      let mockPlaces;
      
      switch(preferenceDto.city) {
        case "서울":
          mockPlaces = [
            {
              "여행지명": "북촌 한옥마을",
              "여행지설명": "전통 한옥이 밀집한 서울의 역사적인 지역으로, 한국 전통 문화와 생활 양식을 체험할 수 있습니다.",
              "분류": "문화",
            },
            {
              "여행지명": "경복궁",
              "여행지설명": "조선 왕조의 법궁으로, 웅장한 건축물과 아름다운 정원을 감상할 수 있습니다.",
              "분류": "역사",
            },
            {
              "여행지명": "남산 타워",
              "여행지설명": "서울 시내를 한눈에 내려다볼 수 있는 전망대로, 특히 야경이 아름답습니다.",
              "분류": "랜드마크",
            }
          ];
          break;
        case "부산":
          mockPlaces = [
            {
              "여행지명": "해운대 해수욕장",
              "여행지설명": "부산의 대표적인 해변으로 아름다운 해안선과 다양한 먹거리, 축제 등을 즐길 수 있습니다.",
              "분류": "자연",
            },
            {
              "여행지명": "안목해변",
              "여행지설명": "일출 명소이자 유명한 강릉 커피거리에서 바다를 보며 커피를 즐길 수 있는 곳입니다.",
              "분류": "자연",
            },
            {
              "여행지명": "감천문화마을",
              "여행지설명": "색색의 집들이 산비탈에 모여 있는 마을로, 골목길을 따라 아기자기한 예술 작품들을 만날 수 있습니다.",
              "분류": "문화",
            }
          ];
          break;
        case "제주":
          mockPlaces = [
            {
              "여행지명": "성산일출봉",
              "여행지설명": "제주의 상징적인 자연경관으로 UNESCO 세계자연유산에 등재된 화산 분화구입니다.",
              "분류": "자연",
            },
            {
              "여행지명": "우도",
              "여행지설명": "제주 동쪽에 위치한 작은 섬으로, 아름다운 해변과 대표적인 관광지 우도등대가 있습니다.",
              "분류": "자연",
            },
            {
              "여행지명": "한라산 국립공원",
              "여행지설명": "제주 중앙에 위치한 대규모 산악 국립공원으로 다양한 등산로가 있어 하이킹을 즐길 수 있습니다.",
              "분류": "자연",
            }
          ];
          break;
        default:
          mockPlaces = [
            {
              "여행지명": "대표 관광지 1",
              "여행지설명": "이 도시의 대표적인 관광지입니다.",
              "분류": "관광",
            },
            {
              "여행지명": "대표 관광지 2",
              "여행지설명": "이 도시의 또 다른 인기 명소입니다.",
              "분류": "관광",
            },
            {
              "여행지명": "대표 관광지 3",
              "여행지설명": "이 도시에서 꼭 방문해야 할 곳입니다.",
              "분류": "관광",
            }
          ];
      }
      
      // 선호도 정보 저장
      const { scheduleId } = await placeRepository.savePlacePreferences(
        userId,
        preferenceDto
      );
      
      // 추천 장소 정보 저장
      await placeRepository.savePlaceRecommendations(scheduleId, mockPlaces);
      
      // 응답 DTO 생성
      const responseDto = new PlaceRecommendationDto(mockPlaces);
      return responseDto;
      
    } catch (error) {
      console.error('여행지 추천 서비스 오류:', error);
      throw new Error('여행지 추천을 가져오는 중 오류가 발생했습니다.');
    }
  }

  // 실제 AI 서비스 호출 메소드 - 나중에 구현
  /*
  async callAIService(requestData) {
    try {
      const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://ai-service/api';
      const response = await axios.post(`${aiServiceUrl}/ai/recommendations`, requestData);
      return response.data;
    } catch (error) {
      console.error('AI 서비스 호출 오류:', error);
      throw new Error('AI 서비스 호출 중 오류가 발생했습니다.');
    }
  }
  */
}

module.exports = new PlaceService();