const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository'); // userRepository가 필요하다면 불러옴

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URL = process.env.GOOGLE_REDIRECT_URL || 'http://localhost:3000/user/google/callback';

console.log('Google OAuth Config:', {
  clientId: GOOGLE_CLIENT_ID ? 'Set' : 'Not set',
  clientSecret: GOOGLE_CLIENT_SECRET ? 'Set' : 'Not set',
  redirectUrl: REDIRECT_URL
});

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT_URL);

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  let token;
  if (authHeader) {
    token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
  }

  console.log('Auth Header:', authHeader);
  console.log('Token:', token);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: '유효하지 않은 토큰입니다'
      });
    }

    req.user = user;
    next();
  });
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: '관리자 권한이 필요합니다'
    });
  }
  next();
};

// 관리자 인증 미들웨어
const authenticateAdmin = (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '관리자 권한이 필요합니다.' });
    }
    next(); // 관리자 인증 완료 후 다음 미들웨어로 진행
  } catch (error) {
    console.error('관리자 인증 오류:', error);
    return res.status(500).json({ success: false, message: '서버 오류' });
  }
};

module.exports = { googleClient, authenticateToken, requireAdmin, authenticateAdmin };