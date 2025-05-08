const adminService = require('../services/adminService');

exports.getAllUsers = async (req, res) => {
  const users = await adminService.getAllUsers();
  res.status(200).json(users);
};

exports.getUserById = async (req, res) => {
  const user = await adminService.getUserById(req.params.userId);
  if (user) {
    res.status(200).json(user);
  } else {
    res.status(404).json({ message: '사용자를 찾을 수 없습니다' });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;
    
    // 상태값 검증
    if (status !== 0 && status !== 1) {
      return res.status(400).json({ 
        success: false, 
        message: '유효하지 않은 상태값입니다. 0 또는 1이어야 합니다.' 
      });
    }
    
    const result = await adminService.updateUserStatus(userId, status);
    res.status(200).json({
      success: true,
      message: '사용자 상태가 변경되었습니다',
      data: result
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: '사용자 상태 변경 실패', 
      error: error.message 
    });
  }
};