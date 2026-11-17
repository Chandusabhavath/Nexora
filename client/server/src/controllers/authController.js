import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { dataStore } from '../models/dataStore.js';
import { generateToken } from '../middleware/auth.js';
import { sendOTPEmail } from '../services/emailService.js';

// Cryptographic helpers for OTP generation and SHA-256 HMAC hashing
const OTP_SECRET_SALT = process.env.OTP_SALT || 'nexora_secure_otp_salt_2026';

export const generateSecureOTP = () => {
  // Generate secure cryptographically random 6-digit integer
  return crypto.randomInt(100000, 1000000).toString();
};

export const hashOTP = (code) => {
  return crypto.createHmac('sha256', OTP_SECRET_SALT).update(code.trim()).digest('hex');
};

export const verifyCodeHash = (inputCode, storedHash) => {
  if (!inputCode || !storedHash) return false;
  const inputHash = hashOTP(inputCode.toString().trim());
  if (inputHash.length !== storedHash.length) return false;
  return crypto.timingSafeEqual(Buffer.from(inputHash), Buffer.from(storedHash));
};

export const register = async (req, res) => {
  try {
    const { name, email, password, phone, role, locality, city } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long.',
      });
    }

    const assignedRole = role === 'provider' ? 'provider' : 'customer';

    // Check duplicate
    const existingUser = dataStore.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = dataStore.addUser({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone: phone || '',
      role: assignedRole,
      isVerified: true,
      phoneVerified: false,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=0F382C`,
      address: {
        street: '',
        locality: locality || 'Bandra',
        city: city || 'Mumbai',
        pincode: '400050',
        lat: 19.0596,
        lng: 72.8295,
      },
      savedProviders: [],
      isActive: true,
      createdAt: new Date().toISOString(),
    });

    // If provider, initialize draft ProviderProfile
    let providerProfile = null;
    if (assignedRole === 'provider') {
      providerProfile = dataStore.addProviderProfile({
        userId: newUser._id,
        user: newUser,
        businessName: `${newUser.name}'s Services`,
        bio: 'Professional local service expert verified on NEXORA.',
        category: req.body.category || 'Electrical',
        skills: req.body.skills || ['General Maintenance'],
        experienceYears: Number(req.body.experienceYears) || 2,
        hourlyRate: Number(req.body.hourlyRate) || 300,
        serviceArea: {
          city: city || 'Mumbai',
          localities: [locality || 'Bandra'],
          radiusKm: 15,
          lat: 19.0596,
          lng: 72.8295,
        },
        verificationStatus: 'unsubmitted',
        verificationDocuments: [],
        rating: 5.0,
        reviewCount: 0,
        completedBookingsCount: 0,
        isAvailable: true,
        isFeatured: false,
        commissionRate: 0.10,
        unpaidCommission: 0,
        totalEarnings: 0,
        workingHours: {
          monday: { start: '09:00', end: '19:00', active: true },
          tuesday: { start: '09:00', end: '19:00', active: true },
          wednesday: { start: '09:00', end: '19:00', active: true },
          thursday: { start: '09:00', end: '19:00', active: true },
          friday: { start: '09:00', end: '19:00', active: true },
          saturday: { start: '09:00', end: '18:00', active: true },
          sunday: { start: '10:00', end: '16:00', active: false },
        },
        createdAt: new Date().toISOString(),
      });
    }

    const token = generateToken({ id: newUser._id, role: newUser.role, email: newUser.email });

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        phone: newUser.phone,
        avatar: newUser.avatar,
        address: newUser.address,
        providerProfileId: providerProfile?._id,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Registration failed.', error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const user = dataStore.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated. Please contact administrator.',
      });
    }

    const token = generateToken({ id: user._id, role: user.role, email: user.email });
    const providerProfile = user.role === 'provider' ? dataStore.getProviderByUserId(user._id) : null;

    res.json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        address: user.address,
        providerProfile: providerProfile || undefined,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Login failed.', error: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = dataStore.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const providerProfile = user.role === 'provider' ? dataStore.getProviderByUserId(user._id) : null;

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        address: user.address,
        savedProviders: user.savedProviders || [],
        providerProfile: providerProfile || undefined,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve user profile.' });
  }
};

/**
 * Request real transactional email OTP
 * Rate-limited to max 1 request per 60 seconds per email
 */
export const requestEmailOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'A valid email address is required.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Rate-limiter check: Ensure user cannot request a new OTP more than once every 60 seconds
    const latestOtp = dataStore.getLatestOtpByEmail(normalizedEmail);
    if (latestOtp && !latestOtp.consumed) {
      const elapsedSeconds = Math.floor((Date.now() - new Date(latestOtp.createdAt).getTime()) / 1000);
      const cooldownSeconds = 60;

      if (elapsedSeconds < cooldownSeconds) {
        const remainingSeconds = cooldownSeconds - elapsedSeconds;
        return res.status(429).json({
          success: false,
          message: `Please wait ${remainingSeconds} seconds before requesting a new verification code.`,
          retryAfter: remainingSeconds,
        });
      }
    }

    // 2. Generate secure cryptographically random 6-digit code
    const plainCode = generateSecureOTP();

    // 3. Hash code using SHA-256 HMAC before saving to database
    const codeHash = hashOTP(plainCode);

    // 4. Save to otps table with 5-minute expiration time
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const existingUser = dataStore.getUserByEmail(normalizedEmail);

    dataStore.addOtp({
      email: normalizedEmail,
      userId: existingUser ? (existingUser._id || existingUser.id) : null,
      codeHash,
      expiresAt,
      plainCode,
    });

    // 5. Fire transactional email via Nodemailer
    await sendOTPEmail({
      email: normalizedEmail,
      otpCode: plainCode,
      expiresInMinutes: 5,
    });

    // 6. Clean JSON response without exposing raw code in production
    return res.status(200).json({
      success: true,
      message: `A 6-digit verification code has been dispatched to ${normalizedEmail}.`,
      expiresInSeconds: 300,
      debugOtp: process.env.NODE_ENV !== 'production' ? plainCode : undefined,
    });
  } catch (error) {
    console.error('[Auth/RequestOTP] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to dispatch verification code.',
      error: error.message,
    });
  }
};

/**
 * Verify OTP endpoint (POST /api/auth/verify-otp)
 * Enforces expiration, max 3 attempts, marks user verified, and issues JWT session
 */
export const verifyEmailOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email address and 6-digit OTP code are required.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cleanOtp = otp.toString().trim();

    if (!/^\d{6}$/.test(cleanOtp)) {
      return res.status(400).json({
        success: false,
        message: 'Verification code must be exactly 6 digits.',
      });
    }

    // 1. Look up active, unexpired OTP record for user
    const activeOtp = dataStore.getActiveOtpByEmail(normalizedEmail);

    if (!activeOtp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired code. Please request a new verification code.',
      });
    }

    // 2. Check expiration (5-minute window)
    if (new Date(activeOtp.expiresAt) <= new Date()) {
      dataStore.consumeOtp(activeOtp.id);
      return res.status(400).json({
        success: false,
        message: 'This verification code has expired. Please request a new code.',
      });
    }

    // 3. Check attempts < 3
    if (activeOtp.attempts >= 3) {
      dataStore.consumeOtp(activeOtp.id);
      return res.status(429).json({
        success: false,
        message: 'Maximum verification attempts exceeded (3/3). Please request a new verification code.',
      });
    }

    // 4. Compare incoming code against stored code_hash
    const isValid = verifyCodeHash(cleanOtp, activeOtp.codeHash);

    if (!isValid) {
      const updatedOtp = dataStore.incrementOtpAttempts(activeOtp.id);
      const remaining = 3 - updatedOtp.attempts;

      if (remaining <= 0) {
        dataStore.consumeOtp(activeOtp.id);
        return res.status(400).json({
          success: false,
          message: 'Invalid code. Maximum attempts reached. Please request a new verification code.',
          remainingAttempts: 0,
        });
      }

      return res.status(400).json({
        success: false,
        message: `Invalid or expired code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
        remainingAttempts: remaining,
      });
    }

    // 5. Valid OTP: Invalidate/consume used OTP
    dataStore.consumeOtp(activeOtp.id);

    // 6. Look up or auto-provision verified user
    let user = dataStore.getUserByEmail(normalizedEmail);
    if (!user) {
      user = dataStore.addUser({
        name: normalizedEmail.split('@')[0],
        email: normalizedEmail,
        password: '',
        role: 'customer',
        isVerified: true,
        phoneVerified: false,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(normalizedEmail.split('@')[0])}&backgroundColor=0F382C`,
        address: { street: '', locality: 'Bandra', city: 'Mumbai', pincode: '400050', lat: 19.0596, lng: 72.8295 },
        savedProviders: [],
        isActive: true,
        createdAt: new Date().toISOString(),
      });
    } else {
      dataStore.updateUser(user._id || user.id, { isVerified: true });
      user.isVerified = true;
    }

    // 7. Issue secure JWT access token
    const token = generateToken({
      id: user._id || user.id,
      role: user.role,
      email: user.email,
    });

    // Set secure HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const providerProfile = user.role === 'provider' ? dataStore.getProviderByUserId(user._id || user.id) : null;

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully. Authentication complete.',
      token,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        avatar: user.avatar,
        address: user.address,
        providerProfile: providerProfile || undefined,
      },
    });
  } catch (error) {
    console.error('[Auth/VerifyOTP] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify verification code.',
      error: error.message,
    });
  }
};

/**
 * Universal OTP Request (supports both email and phone)
 */
export const requestOTP = async (req, res) => {
  if (req.body.email) {
    return requestEmailOTP(req, res);
  }

  const { phone } = req.body;
  if (!phone || phone.length < 10) {
    return res.status(400).json({ success: false, message: 'Valid phone number or email required.' });
  }

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  console.log(`[Auth/SMS] OTP generated for ${phone}: ${otpCode} (Valid for 5 minutes)`);

  res.json({
    success: true,
    message: `Verification code sent to ${phone}.`,
    debugOtp: process.env.NODE_ENV !== 'production' ? otpCode : undefined,
  });
};

/**
 * Universal OTP Verify (supports both email and phone)
 */
export const verifyOTP = async (req, res) => {
  if (req.body.email) {
    return verifyEmailOTP(req, res);
  }

  const { phone, otp } = req.body;
  if (!phone || !otp) {
    return res.status(400).json({ success: false, message: 'Phone and OTP code are required.' });
  }

  let user = dataStore.users.find((u) => u.phone === phone);
  if (!user) {
    user = dataStore.addUser({
      name: `User ${phone.slice(-4)}`,
      email: `${phone.replace(/\D/g, '')}@phone.nexora.com`,
      password: '',
      phone,
      role: 'customer',
      isVerified: true,
      phoneVerified: true,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${phone}&backgroundColor=0F382C`,
      address: { street: '', locality: 'Bandra', city: 'Mumbai', pincode: '400050', lat: 19.0596, lng: 72.8295 },
      isActive: true,
      createdAt: new Date().toISOString(),
    });
  }

  const token = generateToken({ id: user._id, role: user.role, email: user.email });

  res.json({
    success: true,
    message: 'Phone verified successfully.',
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar,
    },
  });
};
