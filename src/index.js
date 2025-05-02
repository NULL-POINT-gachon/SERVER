const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
const transportationRoute = require('./routes/transportationRoute');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(cors({ origin: 'http://localhost:5173' })); // React 개발 서버 포트


const userRoutes = require('./routes/userRoute');
const recommendationRoutes = require('./routes/recommendationRoutes');


// 라우트
app.use('/user',userRoutes );
app.use('/trip', recommendationRoutes);

// 에러 핸들링


// Swagger 설정
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
    components : {
      securitySchemes : {
        bearerAuth : {
          type : 'http' , 
          scheme : 'bearer' , 
          bearerFormat : 'JWT'
        }
      }
    },
  
    security : [
    {
      bearerAuth : []
    }
  ]
},
  apis: ['src/routes/*.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// 라우트 (기본 테스트용)
app.get('/', (req, res) => {
  res.json({ message: 'Exclamation API 서버가 실행 중입니다.' });
});

app.use('/transportations', transportationRoute);

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`Swagger 문서: http://localhost:${PORT}/api-docs`);
});