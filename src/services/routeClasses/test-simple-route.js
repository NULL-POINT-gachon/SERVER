require("dotenv").config();
const axios = require('axios');

async function debugFullResponse() {
  try {
    console.log("🔍 전체 응답 내용 확인");
    
    const response = await axios.post(
      'https://routes.googleapis.com/directions/v2:computeRoutes',
      {
        "origin": {
          "location": {
            "latLng": {
              "latitude": 37.577613288258206,
              "longitude": 126.97689786832184
            }
          }
        },
        "destination": {
          "location": {
            "latLng": {
              "latitude": 37.563955663098106,
              "longitude": 126.98628182911085
            }
          }
        },
        "travelMode": "DRIVE",
        "routingPreference": "TRAFFIC_AWARE",
        "languageCode": "en-US",
        "units": "METRIC"
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': process.env.GOOGLE_API_KEY,
          'X-Goog-FieldMask': '*'
        }
      }
    );
    
    console.log("📦 전체 응답 데이터:");
    console.log(JSON.stringify(response.data, null, 2));
    
    console.log("\n📊 응답 분석:");
    console.log("- 응답 키들:", Object.keys(response.data));
    console.log("- geocodingResults:", response.data.geocodingResults);
    
    if (response.data.routes) {
      console.log("- routes 길이:", response.data.routes.length);
    } else {
      console.log("- routes: 없음!");
    }
    
  } catch (error) {
    console.error("❌ 에러:", error.response?.data || error.message);
  }
}

debugFullResponse();