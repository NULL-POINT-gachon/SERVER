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
  const { userId } = req.params;
  const { status } = req.body;
  const result = await adminService.updateUserStatus(userId, status);
  res.status(200).json(result);
};