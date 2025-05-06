const transportationService = require('../services/transportationService');

exports.getTransportations = async (req, res) => {
  try {
    const data = await transportationService.getTransportations();
    res.status(200).json(data);
  } catch (error) {
    console.error('이동수단 목록 조회 중 오류:', error);
    res.status(500).json({ message: '이동수단 목록 조회 실패' });
  }
};