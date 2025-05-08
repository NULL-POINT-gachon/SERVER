// src/index.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ 미들웨어
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(helmet());
app.use(express.json());

// ✅ 라우터 import
const userRoute = require('./routes/userRoute');
const tripRoute = require('./routes/tripRoute');
const tripShareRouter = require('./routes/tripShareroute');
const transportationRoute = require('./routes/transportationRoute');
const reviewRoute = require('./routes/reviewRoute');
const adminRoute = require('./routes/adminRoute');
const adminDestinationRoute = require('./routes/adminDestinationRoute');
const adminReviewRoute = require('./routes/adminReviewRoute');
const placeRoutes = require('./routes/placeRoute');
const recommendationRoutes = require('./routes/recommendationRoutes');

// ✅ 라우터 등록
app.use('/user', userRoute);
app.use('/trip', tripRoute);
app.use('/trip/share', tripShareRouter);
app.use('/transportations', transportationRoute);
app.use('/review', reviewRoute);
app.use('/admin', adminRoute);
app.use('/admin', adminDestinationRoute);
app.use('/admin', adminReviewRoute);
app.use('/trip', recommendationRoutes);        // → /trip/recommendation/city
app.use('/trip', placeRoutes);


// ✅ Swagger 설정
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Exclamation API',
      version: '0.1.0',
      description: '감정 기반 여행 추천 서비스 API',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: '개발 서버',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        }
      }
    },
    security: [
      { bearerAuth: [] }
    ]
  },
  apis: ['./src/routes/*.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// ✅ 기본 루트
app.get('/', (req, res) => {
  res.json({ message: 'Exclamation API 서버가 실행 중입니다.' });
});

// ✅ 전역 에러 핸들러
app.use((err, req, res, next) => {
  console.error("서버 전역 에러:", err);
  res.status(500).json({
    success: false,
    message: '서버 내부 오류',
    error: err.message
  });
});

// ✅ 서버 실행
app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`Swagger 문서: http://localhost:${PORT}/api-docs`);
});