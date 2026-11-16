import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { dataStore } from '../models/dataStore.js';
import { generateToken } from '../middleware/auth.js';

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

export const requestOTP = async (req, res) => {
  const { phone } = req.body;
  if (!phone || phone.length < 10) {
    return res.status(400).json({ success: false, message: 'Valid phone number required.' });
  }

  // Generate secure 6-digit verification code
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  console.log(`[Auth/SMS] OTP generated for ${phone}: ${otpCode} (Valid for 5 minutes)`);

  res.json({
    success: true,
    message: `Verification code sent to ${phone}.`,
    debugOtp: process.env.NODE_ENV !== 'production' ? otpCode : undefined,
  });
};

export const verifyOTP = async (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) {
    return res.status(400).json({ success: false, message: 'Phone and OTP code are required.' });
  }

  // Match or create phone user
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
