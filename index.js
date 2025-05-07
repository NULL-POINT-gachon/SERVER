const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
const tripRoute = require('./src/routes/tripRoute');
const tripShareRouter = require('./src/routes/tripShareroute');
const transportationRoute = require('./src/routes/transportationRoute');
const reviewRoute = require('./src/routes/reviewRoute');
const adminRoute = require('./src/routes/adminRoute');
const morgan = require('morgan');


require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(morgan('dev'));
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
  },
  apis: ['./src/routes/*.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// ✅ trip 라우터 등록
app.use('/trip', tripRoute);
app.use('/trip/share', tripShareRouter); 
app.use('/transportations', transportationRoute);
app.use('/review', reviewRoute);
app.use('/admin', adminRoute);
// ✅ 기본 라우트
app.get('/', (req, res) => {
  res.send('api 서버 실행 중!');
});

app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`Swagger 문서: http://localhost:${PORT}/api-docs`);
});