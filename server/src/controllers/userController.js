const bcrypt = require('bcrypt');
const User = require('../models/User');
const JobCheck = require('../models/JobCheck');

const BCRYPT_COST = 10;

/** GET /api/user/profile */
async function getProfile(req, res) {
  try {
    const user = await User.findById(req.userId).select('-passwordHash').lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    const totalChecks = await JobCheck.countDocuments({ userId: req.userId });
    return res.status(200).json({ ...user, totalChecks });
  } catch (err) {
    console.error('getProfile error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/** PUT /api/user/password */
async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'currentPassword and newPassword are required' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters' });
  }
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const match = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!match) return res.status(401).json({ error: 'Current password is incorrect' });

    user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_COST);
    await user.save();
    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('changePassword error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/** DELETE /api/user/account */
async function deleteAccount(req, res) {
  try {
    await JobCheck.deleteMany({ userId: req.userId });
    await User.findByIdAndDelete(req.userId);
    return res.status(200).json({ message: 'Account deleted' });
  } catch (err) {
    console.error('deleteAccount error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { getProfile, changePassword, deleteAccount };
