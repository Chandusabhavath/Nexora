import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { dataStore } from '../models/dataStore.js';

const JWT_SECRET = process.env.JWT_SECRET || 'nexora_secure_secret_key_2026_production_grade_jwt';

export const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyAuth = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No authorization token provided.',
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if user exists in database or dataStore
    let user = null;
    try {
      user = await User.findById(decoded.id).select('-password');
    } catch {
      // Fallback to dataStore if live DB is unavailable
    }

    if (!user) {
      user = dataStore.getUserById(decoded.id);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User account does not exist or has been deleted.',
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated. Please contact support.',
      });
    }

    req.user = {
      _id: user._id.toString(),
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token verification failed or token has expired.',
      error: error.message,
    });
  }
};
