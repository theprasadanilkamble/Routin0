const User = require('../models/User');

const getHeaderUserId = (req) => {
  const explicitHeader = req.header('x-user-id');
  if (explicitHeader) return explicitHeader.trim();

  const authHeader = req.header('authorization');
  if (!authHeader) return null;

  const token = authHeader.replace('Bearer', '').trim();
  if (token.startsWith('dev:')) {
    return token.split(':')[1];
  }

  // TODO: verify Firebase ID token once credentials are available
  return null;
};

const requireUser = async (req, res, next) => {
  try {
    const externalId = getHeaderUserId(req);

    if (!externalId) {
      return res.status(401).json({ message: 'Missing user identity' });
    }

    let user = await User.findOne({ firebaseUid: externalId });

    if (!user) {
      user = await User.create({
        firebaseUid: externalId,
        email: req.header('x-user-email') || undefined,
        displayName: req.header('x-user-name') || undefined,
      });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { requireUser };


