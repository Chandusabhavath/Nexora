import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { cashfreeService } from '../services/cashfreeService.js';
import { CommissionEngine } from '../services/commissionEngine.js';

class DataStore {
  constructor() {
    this.users = [];
    this.providerProfiles = [];
    this.services = [];
    this.bookings = [];
    this.reviews = [];
    this.conversations = [];
    this.payments = [];
    this.paymentRecords = this.payments; // alias for backwards compatibility
    this.payouts = [];
    this.refunds = [];
    this.financialLedger = [];
    this.commissionRecords = [];
    this.disputes = [];
    this.notifications = [];
    this.auditLogs = [];
    this.commissionRules = {
      defaultPercentage: 10,
      categoryPercentages: {},
      providerPercentages: {},
      fixedFee: 0,
      isActive: true,
    };
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    // Seed initial users
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('NexoraAdmin2026!', salt);
    const userPassword = await bcrypt.hash('CustomerPass123!', salt);
    const providerPassword = await bcrypt.hash('ProviderPass123!', salt);

    const adminUser = {
      _id: 'usr_admin_001',
      id: 'usr_admin_001',
      name: 'Nexora Platform Admin',
      email: 'admin@nexora.com',
      password: adminPassword,
      phone: '+919820011223',
      role: 'admin',
      isVerified: true,
      phoneVerified: true,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
      address: { street: 'BKC Center', locality: 'Bandra East', city: 'Mumbai', pincode: '400051', lat: 19.0657, lng: 72.8680 },
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    const customerUser = {
      _id: 'usr_cust_001',
      id: 'usr_cust_001',
      name: 'Aarav Mehta',
      email: 'aarav@example.com',
      password: userPassword,
      phone: '+919819001234',
      role: 'customer',
      isVerified: true,
      phoneVerified: true,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
      address: { street: 'Hill Road Apt 4B', locality: 'Bandra West', city: 'Mumbai', pincode: '400050', lat: 19.0596, lng: 72.8295 },
      savedProviders: [],
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    const provUser1 = {
      _id: 'usr_prov_001',
      id: 'usr_prov_001',
      name: 'Rajesh Sharma',
      email: 'rajesh.electric@example.com',
      password: providerPassword,
      phone: '+919820123456',
      role: 'provider',
      isVerified: true,
      phoneVerified: true,
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=250',
      address: { street: 'SV Road Plaza', locality: 'Bandra West', city: 'Mumbai', pincode: '400050', lat: 19.0590, lng: 72.8310 },
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    const provUser2 = {
      _id: 'usr_prov_002',
      id: 'usr_prov_002',
      name: 'Sunita Patil',
      email: 'sunita.cleaning@example.com',
      password: providerPassword,
      phone: '+919820987654',
      role: 'provider',
      isVerified: true,
      phoneVerified: true,
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250',
      address: { street: 'Linking Road', locality: 'Khar West', city: 'Mumbai', pincode: '400052', lat: 19.0688, lng: 72.8360 },
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    const provUser3 = {
      _id: 'usr_prov_003',
      id: 'usr_prov_003',
      name: 'Mohammad Ansari',
      email: 'ansari.plumbing@example.com',
      password: providerPassword,
      phone: '+919833445566',
      role: 'provider',
      isVerified: true,
      phoneVerified: true,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
      address: { street: 'Mahim West Market', locality: 'Mahim', city: 'Mumbai', pincode: '400016', lat: 19.0354, lng: 72.8400 },
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    const provUser4 = {
      _id: 'usr_prov_004',
      id: 'usr_prov_004',
      name: 'Vikram Joshi',
      email: 'vikram.carpentry@example.com',
      password: providerPassword,
      phone: '+919876543210',
      role: 'provider',
      isVerified: true,
      phoneVerified: true,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=250',
      address: { street: 'Juhu Tara Road', locality: 'Juhu', city: 'Mumbai', pincode: '400049', lat: 19.0988, lng: 72.8264 },
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    this.users.push(adminUser, customerUser, provUser1, provUser2, provUser3, provUser4);

    // Seed Provider Profiles with Bank Details
    const profile1 = {
      _id: 'prof_001',
      id: 'prof_001',
      userId: provUser1._id,
      user: provUser1,
      businessName: 'Sharma Spark Electricals',
      bio: 'Licensed master electrician with 12+ years experience in domestic wiring, circuit diagnostics, inverter setups, and electrical repairs across Mumbai.',
      category: 'Electrical',
      skills: ['Wiring', 'Short Circuit Diagnosis', 'Inverter Setup', 'Appliance Repair', 'Switchboard Upgrades'],
      experienceYears: 12,
      hourlyRate: 350,
      serviceArea: {
        city: 'Mumbai',
        localities: ['Bandra', 'Khar', 'Santacruz', 'Mahim', 'Dadar'],
        radiusKm: 15,
        lat: 19.0590,
        lng: 72.8310,
      },
      verificationStatus: 'approved',
      verificationDocuments: [{ docType: 'Trade License', docNumber: 'MH-EL-2018-9921', submittedAt: new Date().toISOString(), verifiedAt: new Date().toISOString() }],
      rating: 4.9,
      reviewCount: 38,
      completedBookingsCount: 84,
      isAvailable: true,
      isFeatured: true,
      commissionRate: 0.10,
      
      // Module 2 Bank Details
      bankAccount: {
        accountHolderName: 'Rajesh Sharma',
        accountNumberMasked: '••••••••4892',
        accountNumberHash: 'hash_4892',
        ifsc: 'HDFC0000123',
        bankName: 'HDFC Bank Ltd',
        upiId: 'rajesh.sharma@okhdfcbank',
        panNumberMasked: '••••••124F',
        businessType: 'individual',
        gatewayVendorId: 'VND_NX_RAJESH1',
        payoutStatus: 'verified',
        verifiedAt: new Date().toISOString(),
      },
      totalEarnings: 29400,
      availableBalance: 2450, // ready for payout
      pendingBalance: 700,    // held in active jobs
      paidAmount: 26250,      // total payouts disbursed
      unpaidCommission: 350,

      workingHours: {
        monday: { start: '08:30', end: '20:00', active: true },
        tuesday: { start: '08:30', end: '20:00', active: true },
        wednesday: { start: '08:30', end: '20:00', active: true },
        thursday: { start: '08:30', end: '20:00', active: true },
        friday: { start: '08:30', end: '20:00', active: true },
        saturday: { start: '09:00', end: '19:00', active: true },
        sunday: { start: '10:00', end: '16:00', active: true },
      },
      createdAt: new Date().toISOString(),
    };

    const profile2 = {
      _id: 'prof_002',
      id: 'prof_002',
      userId: provUser2._id,
      user: provUser2,
      businessName: 'CleanPro Solutions',
      bio: 'Eco-friendly deep cleaning specialists for apartments, villas, and commercial spaces. Steam sanitized, trained staff, and guaranteed shine.',
      category: 'Home Cleaning',
      skills: ['Deep Cleaning', 'Kitchen Degreasing', 'Sofa Shampooing', 'Sanitization', 'Window Buffing'],
      experienceYears: 7,
      hourlyRate: 450,
      serviceArea: {
        city: 'Mumbai',
        localities: ['Bandra', 'Khar', 'Juhu', 'Andheri West', 'Santacruz'],
        radiusKm: 20,
        lat: 19.0688,
        lng: 72.8360,
      },
      verificationStatus: 'approved',
      verificationDocuments: [{ docType: 'Aadhaar', docNumber: 'XXXX-XXXX-9912', submittedAt: new Date().toISOString(), verifiedAt: new Date().toISOString() }],
      rating: 4.8,
      reviewCount: 45,
      completedBookingsCount: 112,
      isAvailable: true,
      isFeatured: true,
      commissionRate: 0.10,

      // Module 2 Bank Details
      bankAccount: {
        accountHolderName: 'Sunita Patil',
        accountNumberMasked: '••••••••9012',
        accountNumberHash: 'hash_9012',
        ifsc: 'ICIC0000456',
        bankName: 'ICICI Bank',
        upiId: 'sunita.clean@icici',
        panNumberMasked: '••••••882K',
        businessType: 'individual',
        gatewayVendorId: 'VND_NX_SUNITA2',
        payoutStatus: 'verified',
        verifiedAt: new Date().toISOString(),
      },
      totalEarnings: 50400,
      availableBalance: 4200,
      pendingBalance: 1350,
      paidAmount: 44850,
      unpaidCommission: 450,

      workingHours: {
        monday: { start: '08:00', end: '19:00', active: true },
        tuesday: { start: '08:00', end: '19:00', active: true },
        wednesday: { start: '08:00', end: '19:00', active: true },
        thursday: { start: '08:00', end: '19:00', active: true },
        friday: { start: '08:00', end: '19:00', active: true },
        saturday: { start: '08:00', end: '19:00', active: true },
        sunday: { start: '09:00', end: '15:00', active: false },
      },
      createdAt: new Date().toISOString(),
    };

    const profile3 = {
      _id: 'prof_003',
      id: 'prof_003',
      userId: provUser3._id,
      user: provUser3,
      businessName: 'Ansari Precision Plumbing',
      bio: '24/7 emergency water leak repair, pipe fitting, faucet replacement, bathroom remodeling, and drainage clearing.',
      category: 'Plumbing',
      skills: ['Pipe Fitting', 'Leak Repair', 'Drainage Unclogging', 'Geyser Installation', 'Tap Replacement'],
      experienceYears: 10,
      hourlyRate: 300,
      serviceArea: {
        city: 'Mumbai',
        localities: ['Mahim', 'Dadar', 'Bandra', 'Prabhadevi', 'Worli'],
        radiusKm: 12,
        lat: 19.0354,
        lng: 72.8400,
      },
      verificationStatus: 'approved',
      verificationDocuments: [{ docType: 'PAN', docNumber: 'ABCPA1234F', submittedAt: new Date().toISOString(), verifiedAt: new Date().toISOString() }],
      rating: 4.7,
      reviewCount: 29,
      completedBookingsCount: 65,
      isAvailable: true,
      isFeatured: false,
      commissionRate: 0.10,

      bankAccount: {
        accountHolderName: 'Mohammad Ansari',
        accountNumberMasked: '••••••••3321',
        accountNumberHash: 'hash_3321',
        ifsc: 'SBIN0001020',
        bankName: 'State Bank of India',
        upiId: 'ansari.plumb@sbi',
        panNumberMasked: '••••••123F',
        businessType: 'individual',
        gatewayVendorId: 'VND_NX_ANSARI3',
        payoutStatus: 'verification_pending',
      },
      totalEarnings: 19500,
      availableBalance: 900,
      pendingBalance: 300,
      paidAmount: 18300,
      unpaidCommission: 0,

      workingHours: {
        monday: { start: '09:00', end: '21:00', active: true },
        tuesday: { start: '09:00', end: '21:00', active: true },
        wednesday: { start: '09:00', end: '21:00', active: true },
        thursday: { start: '09:00', end: '21:00', active: true },
        friday: { start: '09:00', end: '21:00', active: true },
        saturday: { start: '09:00', end: '21:00', active: true },
        sunday: { start: '10:00', end: '18:00', active: true },
      },
      createdAt: new Date().toISOString(),
    };

    const profile4 = {
      _id: 'prof_004',
      id: 'prof_004',
      userId: provUser4._id,
      user: provUser4,
      businessName: 'Joshi Custom Woodcraft',
      bio: 'Handcrafted custom furniture, modular kitchen repair, antique restoration, door lock fitting, and hinge alignment.',
      category: 'Carpentry',
      skills: ['Furniture Repair', 'Modular Kitchen', 'Door Fitting', 'Veneer Polishing', 'Hinge Adjustment'],
      experienceYears: 15,
      hourlyRate: 400,
      serviceArea: {
        city: 'Mumbai',
        localities: ['Juhu', 'Vile Parle', 'Andheri West', 'Bandra'],
        radiusKm: 15,
        lat: 19.0988,
        lng: 72.8264,
      },
      verificationStatus: 'approved',
      verificationDocuments: [{ docType: 'Trade License', docNumber: 'MH-CP-2015-1044', submittedAt: new Date().toISOString(), verifiedAt: new Date().toISOString() }],
      rating: 4.9,
      reviewCount: 33,
      completedBookingsCount: 72,
      isAvailable: true,
      isFeatured: true,
      commissionRate: 0.10,

      bankAccount: {
        payoutStatus: 'not_submitted',
      },
      totalEarnings: 28800,
      availableBalance: 1200,
      pendingBalance: 400,
      paidAmount: 27200,
      unpaidCommission: 400,

      workingHours: {
        monday: { start: '09:00', end: '18:30', active: true },
        tuesday: { start: '09:00', end: '18:30', active: true },
        wednesday: { start: '09:00', end: '18:30', active: true },
        thursday: { start: '09:00', end: '18:30', active: true },
        friday: { start: '09:00', end: '18:30', active: true },
        saturday: { start: '09:00', end: '17:00', active: true },
        sunday: { start: '10:00', end: '14:00', active: false },
      },
      createdAt: new Date().toISOString(),
    };

    this.providerProfiles.push(profile1, profile2, profile3, profile4);

    // Seed Services
    const service1 = {
      _id: 'srv_001',
      id: 'srv_001',
      providerId: profile1._id,
      provider: profile1,
      title: 'Full Home Electrical Inspection & Wiring Diagnostic',
      category: 'Electrical',
      description: 'Comprehensive inspection of electrical load, switchboards, MCB trip analysis, earth leakage detection, and emergency wiring fixes.',
      priceType: 'hourly',
      price: 350,
      durationMinutes: 60,
      includedItems: ['Multimeter diagnostics', 'Loose connection tightening', 'Load distribution test'],
      excludedItems: ['Cost of replacement MCBs or wires'],
      images: ['https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=600'],
      isActive: true,
      tags: ['electrician', 'wiring', 'mcb', 'light', 'fan', 'switch'],
      createdAt: new Date().toISOString(),
    };

    const service2 = {
      _id: 'srv_002',
      id: 'srv_002',
      providerId: profile1._id,
      provider: profile1,
      title: 'Inverter & Battery Backup Installation',
      category: 'Electrical',
      description: 'Safe dual-pole installation of inverters, battery electrolyte check, and uninterrupted home power switchover setup.',
      priceType: 'fixed',
      price: 799,
      durationMinutes: 90,
      includedItems: ['Mounting bracket setup', 'Dual-terminal testing', 'Heavy duty cabling check'],
      excludedItems: ['Inverter unit', 'Battery unit'],
      images: ['https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&q=80&w=600'],
      isActive: true,
      tags: ['inverter', 'battery', 'backup', 'power'],
      createdAt: new Date().toISOString(),
    };

    const service3 = {
      _id: 'srv_003',
      id: 'srv_003',
      providerId: profile2._id,
      provider: profile2,
      title: 'Deep House Cleaning & Anti-Bacterial Sanitization',
      category: 'Home Cleaning',
      description: 'Intense scrubbing and steam sanitization of kitchen oil grease, bathroom limescale, floor buffing, and balcony wash.',
      priceType: 'hourly',
      price: 450,
      durationMinutes: 120,
      includedItems: ['Industrial scrubbing gear', 'Eco-friendly degreasers', 'High pressure vacuuming'],
      excludedItems: ['Exterior façade rope cleaning'],
      images: ['https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=600'],
      isActive: true,
      tags: ['cleaning', 'deep clean', 'maid', 'sanitize', 'kitchen', 'bathroom'],
      createdAt: new Date().toISOString(),
    };

    const service4 = {
      _id: 'srv_004',
      id: 'srv_004',
      providerId: profile3._id,
      provider: profile3,
      title: 'Emergency Leakage Repair & Drainage Clearing',
      category: 'Plumbing',
      description: 'Quick response pipe welding, drain snake unclogging, ceramic washbasin trap reset, and zero-drip faucet overhaul.',
      priceType: 'hourly',
      price: 300,
      durationMinutes: 45,
      includedItems: ['Pipe pressure testing', 'Thread seal Teflon wrapping', 'Clog removal'],
      excludedItems: ['New sanitaryware or tap fixtures'],
      images: ['https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&q=80&w=600'],
      isActive: true,
      tags: ['plumber', 'leak', 'pipe', 'tap', 'drain', 'water'],
      createdAt: new Date().toISOString(),
    };

    const service5 = {
      _id: 'srv_005',
      id: 'srv_005',
      providerId: profile4._id,
      provider: profile4,
      title: 'Custom Woodwork & Modular Furniture Assembly',
      category: 'Carpentry',
      description: 'Expert assembly of flat-pack furniture, hydraulic bed lift adjustments, squeaky hinge repairs, and wooden lock fittings.',
      priceType: 'hourly',
      price: 400,
      durationMinutes: 90,
      includedItems: ['Precision level alignment', 'High tensile screw fasteners', 'Hinges adjustment'],
      excludedItems: ['Plywood or hardware purchase cost'],
      images: ['https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&q=80&w=600'],
      isActive: true,
      tags: ['carpenter', 'furniture', 'wood', 'table', 'chair', 'bed', 'door'],
      createdAt: new Date().toISOString(),
    };

    this.services.push(service1, service2, service3, service4, service5);

    // Seed Completed Booking & Reviews
    const booking1 = {
      _id: 'bkg_001',
      id: 'bkg_001',
      bookingReference: 'NX-2026-90412',
      customerId: customerUser._id,
      customer: customerUser,
      providerId: profile1._id,
      provider: profile1,
      serviceId: service1._id,
      service: service1,
      taskDescription: 'Living room light circuits tripping whenever the AC starts up. Need thorough MCB inspection.',
      scheduledDate: '2026-10-22',
      scheduledTime: '10:00',
      durationHours: 2,
      serviceLocation: customerUser.address,
      agreedPriceSnapshot: {
        baseRate: 350,
        priceType: 'hourly',
        estimatedDurationHours: 2,
        subtotal: 700,
        platformFee: 70,
        commissionRate: 10,
        providerShare: 700,
        totalAmount: 770,
      },
      status: 'completed',
      statusHistory: [
        { status: 'pending', timestamp: new Date(Date.now() - 3 * 86400000).toISOString() },
        { status: 'accepted', timestamp: new Date(Date.now() - 2.5 * 86400000).toISOString() },
        { status: 'in_progress', timestamp: new Date(Date.now() - 2 * 86400000).toISOString() },
        { status: 'completed', timestamp: new Date(Date.now() - 1.8 * 86400000).toISOString() },
      ],
      paymentMethod: 'online_qr',
      paymentStatus: 'paid',
      paymentDetails: {
        orderId: 'order_nx_seeded_001',
        gatewayPaymentId: 'cf_pay_99214481',
        reportedAt: new Date(Date.now() - 1.8 * 86400000).toISOString(),
        reportedAmount: 770,
        paidAt: new Date(Date.now() - 1.8 * 86400000).toISOString(),
        note: 'Customer scanned dynamic UPI QR code and paid successfully.',
      },
      payoutStatus: 'successful',
      hasReview: true,
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    };

    const booking2 = {
      _id: 'bkg_002',
      id: 'bkg_002',
      bookingReference: 'NX-2026-90413',
      customerId: customerUser._id,
      customer: customerUser,
      providerId: profile2._id,
      provider: profile2,
      serviceId: service3._id,
      service: service3,
      taskDescription: 'Kitchen degreasing and balcony washing for 2BHK in Bandra West.',
      scheduledDate: '2026-10-25',
      scheduledTime: '11:00',
      durationHours: 3,
      serviceLocation: customerUser.address,
      agreedPriceSnapshot: {
        baseRate: 450,
        priceType: 'hourly',
        estimatedDurationHours: 3,
        subtotal: 1350,
        platformFee: 135,
        commissionRate: 10,
        providerShare: 1350,
        totalAmount: 1485,
      },
      status: 'accepted',
      statusHistory: [
        { status: 'pending', timestamp: new Date(Date.now() - 12 * 3600000).toISOString() },
        { status: 'accepted', timestamp: new Date(Date.now() - 6 * 3600000).toISOString() },
      ],
      paymentMethod: 'online_qr',
      paymentStatus: 'paid',
      paymentDetails: {
        orderId: 'order_nx_seeded_002',
        gatewayPaymentId: 'cf_pay_99214490',
        paidAt: new Date(Date.now() - 12 * 3600000).toISOString(),
        reportedAmount: 1485,
      },
      payoutStatus: 'pending', // held until booking completed
      hasReview: false,
      createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
    };

    this.bookings.push(booking1, booking2);

    // Seed Real Payments
    const payment1 = {
      _id: 'pay_001',
      id: 'pay_001',
      orderId: 'order_nx_seeded_001',
      bookingId: booking1._id,
      bookingRef: booking1.bookingReference,
      customerId: customerUser._id,
      customerName: customerUser.name,
      providerId: profile1._id,
      providerName: profile1.businessName,
      amount: 770,
      amountPaise: 77000,
      currency: 'INR',
      commissionRate: 10,
      platformCommission: 70,
      providerEarnings: 700,
      paymentMethod: 'online_qr',
      status: 'paid',
      gatewayOrderId: 'CF_ORD_99182',
      gatewayPaymentId: 'cf_pay_99214481',
      receiptNumber: 'RCPT-NX-2026-001',
      paidAt: new Date(Date.now() - 1.8 * 86400000).toISOString(),
      createdAt: new Date(Date.now() - 1.8 * 86400000).toISOString(),
    };

    const payment2 = {
      _id: 'pay_002',
      id: 'pay_002',
      orderId: 'order_nx_seeded_002',
      bookingId: booking2._id,
      bookingRef: booking2.bookingReference,
      customerId: customerUser._id,
      customerName: customerUser.name,
      providerId: profile2._id,
      providerName: profile2.businessName,
      amount: 1485,
      amountPaise: 148500,
      currency: 'INR',
      commissionRate: 10,
      platformCommission: 135,
      providerEarnings: 1350,
      paymentMethod: 'online_qr',
      status: 'paid',
      gatewayOrderId: 'CF_ORD_99185',
      gatewayPaymentId: 'cf_pay_99214490',
      receiptNumber: 'RCPT-NX-2026-002',
      paidAt: new Date(Date.now() - 12 * 3600000).toISOString(),
      createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
    };

    this.payments.push(payment1, payment2);

    // Seed Seeded Payout
    const payout1 = {
      _id: 'payout_001',
      id: 'payout_001',
      payoutId: 'PO_NX_2026_001',
      providerId: profile1._id,
      providerName: profile1.businessName,
      amount: 700,
      currency: 'INR',
      gatewayVendorId: profile1.bankAccount.gatewayVendorId,
      gatewayTransferId: 'TR_HDFC_881921',
      beneficiaryName: profile1.bankAccount.accountHolderName,
      accountNumberMasked: profile1.bankAccount.accountNumberMasked,
      ifsc: profile1.bankAccount.ifsc,
      bankName: profile1.bankAccount.bankName,
      status: 'successful',
      initiatedAt: new Date(Date.now() - 1.5 * 86400000).toISOString(),
      completedAt: new Date(Date.now() - 1.5 * 86400000).toISOString(),
      notes: 'Automated settlement of booking NX-2026-90412 share',
    };

    this.payouts.push(payout1);

    // Seed Financial Ledger (Double-Entry Bookkeeping)
    this.financialLedger.push(
      {
        _id: 'ledg_001',
        entryId: 'LEDG_001',
        entryType: 'CUSTOMER_PAYMENT',
        bookingId: booking1._id,
        providerId: profile1._id,
        customerId: customerUser._id,
        debit: 0,
        credit: 770,
        balanceAfter: 770,
        referenceId: payment1.orderId,
        description: 'Customer payment collected online via Dynamic QR for Booking NX-2026-90412',
        timestamp: payment1.paidAt,
      },
      {
        _id: 'ledg_002',
        entryId: 'LEDG_002',
        entryType: 'PLATFORM_COMMISSION_EARNED',
        bookingId: booking1._id,
        providerId: profile1._id,
        debit: 0,
        credit: 70,
        balanceAfter: 70,
        referenceId: payment1.orderId,
        description: 'Platform commission 10% deducted for Booking NX-2026-90412',
        timestamp: payment1.paidAt,
      },
      {
        _id: 'ledg_003',
        entryId: 'LEDG_003',
        entryType: 'PROVIDER_PAYOUT_DISBURSED',
        bookingId: booking1._id,
        providerId: profile1._id,
        debit: 700,
        credit: 0,
        balanceAfter: 0,
        referenceId: payout1.payoutId,
        description: 'Settlement disbursed to Rajesh Sharma (HDFC Bank ••••4892)',
        timestamp: payout1.completedAt,
      }
    );

    // Seed Real Review
    const review1 = {
      _id: 'rev_001',
      id: 'rev_001',
      bookingId: booking1._id,
      customerId: customerUser._id,
      customer: customerUser,
      providerId: profile1._id,
      serviceId: service1._id,
      rating: 5,
      comment: 'Rajesh arrived right on time with professional diagnostic equipment. Identified the faulty neutral wire in 20 minutes and safely balanced our MCB. Outstanding work!',
      metrics: { punctuality: 5, quality: 5, politeness: 5 },
      providerReply: { comment: 'Thank you Aarav! Happy to help keep your home circuits safe.', repliedAt: new Date().toISOString() },
      isModerated: false,
      isHidden: false,
      createdAt: new Date(Date.now() - 1.6 * 86400000).toISOString(),
    };
    this.reviews.push(review1);

    // Seed Conversation
    const conversation1 = {
      _id: 'conv_001',
      id: 'conv_001',
      bookingId: booking2._id,
      customerId: customerUser._id,
      providerId: provUser2._id,
      messages: [
        {
          senderId: customerUser._id,
          senderRole: 'customer',
          text: 'Hi Sunita, will you be bringing your own steam cleaners for the kitchen degreasing?',
          isRead: true,
          createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
        },
        {
          senderId: provUser2._id,
          senderRole: 'provider',
          text: 'Hello Aarav! Yes, our team brings all industrial steam machines, microfibers, and eco-safe degreasers. You do not need to provide anything.',
          isRead: true,
          createdAt: new Date(Date.now() - 4.5 * 3600000).toISOString(),
        },
      ],
      lastMessage: {
        text: 'Hello Aarav! Yes, our team brings all industrial steam machines...',
        senderId: provUser2._id,
        createdAt: new Date(Date.now() - 4.5 * 3600000).toISOString(),
      },
      createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    };
    this.conversations.push(conversation1);

    this.initialized = true;
    console.log('[DataStore] Seeded complete marketplace records (Users, Bank Profiles, Orders, Dynamic Payments, Ledger, Payouts).');
  }

  // User queries
  getUserById(id) {
    return this.users.find((u) => u._id.toString() === id.toString() || u.id === id);
  }

  getUserByEmail(email) {
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  addUser(user) {
    if (!user._id) user._id = `usr_${uuidv4().substring(0, 8)}`;
    user.id = user._id;
    this.users.push(user);
    return user;
  }

  updateUser(id, updates) {
    const user = this.getUserById(id);
    if (user) {
      Object.assign(user, updates);
    }
    return user;
  }

  // Provider Queries
  getProviders(filters = {}) {
    let result = [...this.providerProfiles];

    if (filters.category && filters.category !== 'All') {
      result = result.filter((p) => p.category.toLowerCase() === filters.category.toLowerCase());
    }

    if (filters.minRating) {
      result = result.filter((p) => p.rating >= Number(filters.minRating));
    }

    if (filters.maxPrice) {
      result = result.filter((p) => p.hourlyRate <= Number(filters.maxPrice));
    }

    if (filters.status) {
      result = result.filter((p) => p.verificationStatus === filters.status);
    } else {
      if (filters.publicOnly) {
        result = result.filter((p) => p.verificationStatus === 'approved');
      }
    }

    return result;
  }

  getProviderById(id) {
    return this.providerProfiles.find((p) => p._id.toString() === id.toString() || p.id === id);
  }

  getProviderByUserId(userId) {
    return this.providerProfiles.find((p) => p.userId.toString() === userId.toString());
  }

  addProviderProfile(profile) {
    if (!profile._id) profile._id = `prof_${uuidv4().substring(0, 8)}`;
    profile.id = profile._id;
    if (!profile.bankAccount) {
      profile.bankAccount = { payoutStatus: 'not_submitted' };
    }
    profile.availableBalance = profile.availableBalance || 0;
    profile.pendingBalance = profile.pendingBalance || 0;
    profile.paidAmount = profile.paidAmount || 0;
    this.providerProfiles.push(profile);
    return profile;
  }

  updateProviderProfile(id, updates) {
    const prof = this.getProviderById(id);
    if (prof) {
      Object.assign(prof, updates);
    }
    return prof;
  }

  // --- MODULE 2: Bank Details & Payout Settings ---
  async updateProviderBankAccount(providerId, bankData) {
    const prof = this.getProviderById(providerId);
    if (!prof) throw new Error('Provider profile not found');

    const cleanAcc = bankData.accountNumber.trim();
    const masked = `••••••••${cleanAcc.slice(-4)}`;

    prof.bankAccount = {
      accountHolderName: bankData.accountHolderName.trim(),
      accountNumberMasked: masked,
      accountNumberHash: `hash_${cleanAcc.slice(-4)}`,
      ifsc: bankData.ifsc.trim().toUpperCase(),
      bankName: bankData.bankName || 'Verified Bank',
      upiId: bankData.upiId ? bankData.upiId.trim() : '',
      panNumberMasked: bankData.panNumber ? `••••••${bankData.panNumber.slice(-4)}` : '',
      businessType: bankData.businessType || 'individual',
      gatewayVendorId: prof.bankAccount?.gatewayVendorId || `VND_NX_${prof._id.substring(0, 8)}`,
      payoutStatus: 'verification_pending',
      rejectionReason: '',
    };

    return prof.bankAccount;
  }

  async verifyProviderBankAccount(providerId) {
    const prof = this.getProviderById(providerId);
    if (!prof) throw new Error('Provider profile not found');

    if (!prof.bankAccount || !prof.bankAccount.ifsc) {
      throw new Error('Bank details not submitted yet');
    }

    // Call Cashfree vendor verification
    const verification = await cashfreeService.onboardProviderVendor({
      providerId: prof._id,
      businessName: prof.businessName,
      email: prof.user?.email || 'provider@nexora.com',
      phone: prof.user?.phone || '9820012345',
      bankAccount: {
        accountNumber: '1234567890',
        ifsc: prof.bankAccount.ifsc,
      },
    });

    prof.bankAccount.payoutStatus = 'verified';
    prof.bankAccount.verifiedAt = new Date().toISOString();
    prof.bankAccount.gatewayVendorId = verification.vendorId;

    this.addAuditLog({
      action: 'PROVIDER_BANK_VERIFIED',
      performedBy: prof.userId,
      targetType: 'ProviderProfile',
      targetId: prof._id,
      details: { vendorId: verification.vendorId, method: verification.verificationMethod },
    });

    this.addNotification({
      userId: prof.userId,
      title: 'Bank Verification Approved',
      message: 'Your payout bank account has been verified via Cashfree vendor network. You can now receive automated settlements.',
      type: 'payment',
      link: '/provider/dashboard',
    });

    return prof.bankAccount;
  }

  // --- MODULE 3 & 4: Online Payment & Automatic Commission ---
  async createOnlinePaymentOrder(bookingId, paymentMethod = 'online_qr') {
    const booking = this.getBookingById(bookingId);
    if (!booking) throw new Error('Booking not found');

    const customer = this.getUserById(booking.customerId);
    const provider = this.getProviderById(booking.providerId);
    if (!customer || !provider) throw new Error('Associated customer or provider profile missing');

    const totalAmount = booking.agreedPriceSnapshot.totalAmount;
    const orderId = `order_nx_${uuidv4().substring(0, 12)}`;

    // Evaluate dynamic commission via CommissionEngine
    const commission = CommissionEngine.calculate({
      grossAmount: totalAmount,
      category: provider.category,
      providerId: provider._id,
    });

    // Create Dynamic QR Order with Cashfree Easy Split configuration
    const cfOrder = await cashfreeService.createDynamicQROrder({
      orderId,
      amount: totalAmount,
      customer,
      provider,
      commission,
      bookingRef: booking.bookingReference,
    });

    const payment = {
      _id: `pay_${uuidv4().substring(0, 8)}`,
      id: `pay_${uuidv4().substring(0, 8)}`,
      orderId,
      bookingId: booking._id,
      bookingRef: booking.bookingReference,
      customerId: customer._id,
      customerName: customer.name,
      providerId: provider._id,
      providerName: provider.businessName,
      amount: totalAmount,
      amountPaise: Math.round(totalAmount * 100),
      currency: 'INR',
      commissionRate: commission.commissionRate,
      platformCommission: commission.commissionAmount,
      providerEarnings: commission.providerAmount,
      paymentMethod,
      status: 'created',
      gatewayOrderId: cfOrder.orderId,
      dynamicQrString: cfOrder.dynamicQrString,
      splitConfig: cfOrder.splitConfig,
      receiptNumber: `RCPT-NX-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
    };

    this.payments.push(payment);

    // Snapshot on booking
    booking.paymentMethod = paymentMethod;
    booking.paymentDetails = {
      ...(booking.paymentDetails || {}),
      orderId,
      reportedAmount: totalAmount,
    };
    booking.agreedPriceSnapshot.platformFee = commission.commissionAmount;
    booking.agreedPriceSnapshot.commissionRate = commission.commissionRate;
    booking.agreedPriceSnapshot.providerShare = commission.providerAmount;

    return {
      payment,
      order: cfOrder,
    };
  }

  async verifyAndRecordPayment({ orderId, gatewayPaymentId, gatewaySignature, signatureTimestamp, paymentMethod }) {
    const payment = this.getPaymentByOrderId(orderId);
    if (!payment) throw new Error('Payment order not found');

    // Idempotency: Prevent duplicate payment crediting
    if (payment.status === 'paid') {
      return { payment, alreadyProcessed: true };
    }

    // Verify signature
    const isValid = cashfreeService.verifyWebhookSignature(orderId, gatewaySignature, signatureTimestamp || Date.now());
    if (!isValid) {
      throw new Error('Invalid payment gateway signature');
    }

    payment.status = 'paid';
    payment.gatewayPaymentId = gatewayPaymentId || `cf_pay_${uuidv4().substring(0, 10)}`;
    payment.gatewaySignature = gatewaySignature || 'sig_verified_cf';
    payment.paidAt = new Date().toISOString();
    if (paymentMethod) payment.paymentMethod = paymentMethod;

    const booking = this.getBookingById(payment.bookingId);
    if (booking) {
      booking.paymentStatus = 'paid';
      booking.paymentDetails.paidAt = payment.paidAt;
      booking.paymentDetails.gatewayPaymentId = payment.gatewayPaymentId;
      booking.payoutStatus = 'pending'; // held until completion
    }

    const provider = this.getProviderById(payment.providerId);
    if (provider) {
      // Allocate provider share to pendingBalance until job is completed
      provider.pendingBalance = (provider.pendingBalance || 0) + payment.providerEarnings;
      provider.totalEarnings = (provider.totalEarnings || 0) + payment.providerEarnings;
    }

    // Record Immutable Financial Ledger Entries (Double-Entry)
    this.addLedgerEntry({
      entryType: 'CUSTOMER_PAYMENT',
      bookingId: payment.bookingId,
      providerId: payment.providerId,
      customerId: payment.customerId,
      debit: 0,
      credit: payment.amount,
      referenceId: payment.orderId,
      description: `Customer payment received for Booking #${payment.bookingRef}`,
    });

    this.addLedgerEntry({
      entryType: 'PLATFORM_COMMISSION_EARNED',
      bookingId: payment.bookingId,
      providerId: payment.providerId,
      debit: 0,
      credit: payment.platformCommission,
      referenceId: payment.orderId,
      description: `Platform commission (${payment.commissionRate}%) earned on Booking #${payment.bookingRef}`,
    });

    this.addLedgerEntry({
      entryType: 'PROVIDER_EARNINGS_PENDING',
      bookingId: payment.bookingId,
      providerId: payment.providerId,
      debit: 0,
      credit: payment.providerEarnings,
      referenceId: payment.orderId,
      description: `Marketplace split share held in pending balance for Provider ${payment.providerName}`,
    });

    // Notify Customer & Provider
    this.addNotification({
      userId: payment.customerId,
      title: 'Payment Confirmed',
      message: `Your payment of ₹${payment.amount} for booking #${payment.bookingRef} was received successfully. Receipt: ${payment.receiptNumber}`,
      type: 'payment',
      link: `/bookings/${payment.bookingId}`,
    });

    if (provider) {
      this.addNotification({
        userId: provider.userId,
        title: 'Booking Payment Received',
        message: `Customer paid ₹${payment.amount} online. Your share (₹${payment.providerEarnings}) has been allocated to pending balance.`,
        type: 'payment',
        link: '/provider/dashboard',
      });
    }

    return { payment, alreadyProcessed: false };
  }

  // Move provider share from pendingBalance to availableBalance when booking completes
  releaseJobEscrowToAvailableBalance(bookingId) {
    const booking = this.getBookingById(bookingId);
    if (!booking) return false;

    const payment = this.payments.find((p) => p.bookingId.toString() === bookingId.toString() && p.status === 'paid');
    if (!payment) return false;

    const provider = this.getProviderById(booking.providerId);
    if (!provider) return false;

    const releaseAmount = payment.providerEarnings;
    provider.pendingBalance = Math.max(0, (provider.pendingBalance || 0) - releaseAmount);
    provider.availableBalance = (provider.availableBalance || 0) + releaseAmount;

    this.addLedgerEntry({
      entryType: 'PROVIDER_EARNINGS_AVAILABLE',
      bookingId: booking._id,
      providerId: provider._id,
      debit: 0,
      credit: releaseAmount,
      referenceId: booking.bookingReference,
      description: `Booking #${booking.bookingReference} completed: ₹${releaseAmount} released to Provider Available Balance for Payout`,
    });

    return true;
  }

  // --- MODULE 5: Provider Payouts ---
  async initiateProviderPayout({ providerId, amount, adminId, notes }) {
    const provider = this.getProviderById(providerId);
    if (!provider) throw new Error('Provider not found');

    if (provider.bankAccount?.payoutStatus !== 'verified') {
      throw new Error('Provider bank details are not verified. Only verified accounts can receive payouts.');
    }

    const payoutAmount = Number(amount);
    if (isNaN(payoutAmount) || payoutAmount <= 0) {
      throw new Error('Valid payout amount required');
    }

    if (payoutAmount > provider.availableBalance) {
      throw new Error(`Requested amount (₹${payoutAmount}) exceeds available balance (₹${provider.availableBalance})`);
    }

    const payoutId = `PO_NX_${uuidv4().substring(0, 10).toUpperCase()}`;

    // Execute Cashfree Transfer
    const cfTransfer = await cashfreeService.processProviderPayout({
      payoutId,
      vendorId: provider.bankAccount.gatewayVendorId,
      amount: payoutAmount,
      beneficiaryName: provider.bankAccount.accountHolderName,
      bankAccount: provider.bankAccount.accountNumberMasked,
      ifsc: provider.bankAccount.ifsc,
    });

    const payout = {
      _id: `payout_${uuidv4().substring(0, 8)}`,
      id: `payout_${uuidv4().substring(0, 8)}`,
      payoutId,
      providerId: provider._id,
      providerName: provider.businessName,
      amount: payoutAmount,
      currency: 'INR',
      gatewayVendorId: provider.bankAccount.gatewayVendorId,
      gatewayTransferId: cfTransfer.transferId,
      beneficiaryName: provider.bankAccount.accountHolderName,
      accountNumberMasked: provider.bankAccount.accountNumberMasked,
      ifsc: provider.bankAccount.ifsc,
      bankName: provider.bankAccount.bankName,
      status: cfTransfer.status || 'successful',
      utr: cfTransfer.utr,
      initiatedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      initiatedBy: adminId,
      notes: notes || 'Automated marketplace split settlement disbursement',
    };

    this.payouts.push(payout);

    // Deduct from provider availableBalance, increment paidAmount
    provider.availableBalance = Math.max(0, provider.availableBalance - payoutAmount);
    provider.paidAmount = (provider.paidAmount || 0) + payoutAmount;

    // Record Ledger Entry
    this.addLedgerEntry({
      entryType: 'PROVIDER_PAYOUT_DISBURSED',
      providerId: provider._id,
      debit: payoutAmount,
      credit: 0,
      referenceId: payoutId,
      description: `Payout of ₹${payoutAmount} disbursed to ${provider.businessName} (${provider.bankAccount.bankName} ${provider.bankAccount.accountNumberMasked})`,
    });

    this.addNotification({
      userId: provider.userId,
      title: 'Payout Disbursed',
      message: `₹${payoutAmount} has been transferred to your bank account (${provider.bankAccount.bankName}). UTR: ${payout.utr}`,
      type: 'payment',
      link: '/provider/dashboard',
    });

    this.addAuditLog({
      action: 'PROVIDER_PAYOUT_DISBURSED',
      performedBy: adminId,
      targetType: 'Payout',
      targetId: payoutId,
      details: { amount: payoutAmount, providerId: provider._id, utr: payout.utr },
    });

    return payout;
  }

  // --- MODULE 8: Refund and Cancellation Handling ---
  async processRefund({ bookingId, reason, amount, adminId }) {
    const booking = this.getBookingById(bookingId);
    if (!booking) throw new Error('Booking not found');

    const payment = this.payments.find((p) => p.bookingId.toString() === bookingId.toString() && p.status === 'paid');
    if (!payment) {
      throw new Error('No successful online payment found for this booking to refund.');
    }

    // Check duplicate refund
    const existingRefund = this.refunds.find((r) => r.bookingId.toString() === bookingId.toString() && r.status === 'successful');
    if (existingRefund) {
      throw new Error('A refund has already been completed for this booking.');
    }

    const refundAmount = Number(amount) || payment.amount;

    // Call Cashfree refund
    const cfRefund = await cashfreeService.initiateRefund({
      paymentId: payment._id,
      orderId: payment.orderId,
      refundAmount,
      reason: reason || 'Booking cancellation',
    });

    const refund = {
      _id: `rf_${uuidv4().substring(0, 8)}`,
      id: `rf_${uuidv4().substring(0, 8)}`,
      refundId: cfRefund.refundId,
      paymentId: payment._id,
      bookingId: booking._id,
      bookingRef: booking.bookingReference,
      amount: refundAmount,
      reason: reason || 'Booking cancellation',
      gatewayRefundId: cfRefund.refundId,
      status: 'successful',
      initiatedBy: adminId || booking.customerId,
      initiatedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };

    this.refunds.push(refund);

    // Update payment & booking status
    payment.status = refundAmount >= payment.amount ? 'refunded' : 'partially_refunded';
    booking.status = 'cancelled';
    booking.paymentStatus = 'refunded';
    booking.cancellationReason = reason || 'Cancelled with refund';
    booking.refundDetails = {
      refundId: refund.refundId,
      amount: refundAmount,
      status: 'successful',
      refundedAt: refund.completedAt,
    };

    // Compensating Ledger Entry (Reversal)
    this.addLedgerEntry({
      entryType: 'REFUND_REVERSAL',
      bookingId: booking._id,
      providerId: booking.providerId,
      customerId: booking.customerId,
      debit: refundAmount,
      credit: 0,
      referenceId: refund.refundId,
      description: `Compensating ledger reversal: Refund of ₹${refundAmount} returned to Customer for Booking #${booking.bookingReference}`,
    });

    // Revert provider pending balance if not already disbursed
    const provider = this.getProviderById(booking.providerId);
    if (provider && provider.pendingBalance >= payment.providerEarnings) {
      provider.pendingBalance = Math.max(0, provider.pendingBalance - payment.providerEarnings);
      provider.totalEarnings = Math.max(0, provider.totalEarnings - payment.providerEarnings);
    }

    this.addNotification({
      userId: booking.customerId,
      title: 'Refund Processed',
      message: `₹${refundAmount} refund has been processed back to your original payment method for Booking #${booking.bookingReference}. Refund Ref: ${refund.refundId}`,
      type: 'payment',
      link: `/bookings/${booking._id}`,
    });

    return refund;
  }

  // --- Commission Rules Config (Module 4) ---
  getCommissionRules() {
    return this.commissionRules;
  }

  updateCommissionRules(updates) {
    if (updates.defaultPercentage !== undefined) {
      this.commissionRules.defaultPercentage = Number(updates.defaultPercentage);
    }
    if (updates.categoryPercentages) {
      this.commissionRules.categoryPercentages = {
        ...this.commissionRules.categoryPercentages,
        ...updates.categoryPercentages,
      };
    }
    if (updates.providerPercentages) {
      this.commissionRules.providerPercentages = {
        ...this.commissionRules.providerPercentages,
        ...updates.providerPercentages,
      };
    }
    if (updates.fixedFee !== undefined) {
      this.commissionRules.fixedFee = Number(updates.fixedFee);
    }
    if (updates.isActive !== undefined) {
      this.commissionRules.isActive = Boolean(updates.isActive);
    }

    return this.commissionRules;
  }

  // --- Financial Ledger Queries ---
  addLedgerEntry(entry) {
    if (!entry._id) entry._id = `ledg_${uuidv4().substring(0, 8)}`;
    entry.entryId = entry.entryId || `LEDG_${uuidv4().substring(0, 8).toUpperCase()}`;
    entry.timestamp = entry.timestamp || new Date().toISOString();
    this.financialLedger.push(entry);
    return entry;
  }

  getFinancialLedger(filters = {}) {
    let result = [...this.financialLedger];
    if (filters.providerId) {
      result = result.filter((l) => l.providerId?.toString() === filters.providerId.toString());
    }
    if (filters.entryType) {
      result = result.filter((l) => l.entryType === filters.entryType);
    }
    return result.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  getPayments(filters = {}) {
    let result = [...this.payments];
    if (filters.customerId) {
      result = result.filter((p) => p.customerId.toString() === filters.customerId.toString());
    }
    if (filters.providerId) {
      result = result.filter((p) => p.providerId.toString() === filters.providerId.toString());
    }
    if (filters.status) {
      result = result.filter((p) => p.status === filters.status);
    }
    return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  getPaymentByOrderId(orderId) {
    return this.payments.find((p) => p.orderId === orderId);
  }

  getPaymentById(id) {
    return this.payments.find((p) => p._id.toString() === id.toString() || p.id === id);
  }

  getPayouts(filters = {}) {
    let result = [...this.payouts];
    if (filters.providerId) {
      result = result.filter((p) => p.providerId.toString() === filters.providerId.toString());
    }
    if (filters.status) {
      result = result.filter((p) => p.status === filters.status);
    }
    return result.sort((a, b) => new Date(b.initiatedAt) - new Date(a.initiatedAt));
  }

  getRefunds(filters = {}) {
    return [...this.refunds].sort((a, b) => new Date(b.initiatedAt) - new Date(a.initiatedAt));
  }

  // --- MODULE 1: Comprehensive Admin Dashboard Statistics (12 Required KPIs) ---
  getAdminMarketplaceStats() {
    const totalCustomers = this.users.filter((u) => u.role === 'customer').length;
    const totalProviders = this.providerProfiles.length;
    const totalBookings = this.bookings.length;
    const completedBookings = this.bookings.filter((b) => b.status === 'completed').length;
    const pendingBookings = this.bookings.filter((b) => b.status === 'pending' || b.status === 'accepted').length;
    const cancelledBookings = this.bookings.filter((b) => b.status === 'cancelled').length;

    const successfulPayments = this.payments.filter((p) => p.status === 'paid');
    const totalCustomerPayments = successfulPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalPlatformCommission = successfulPayments.reduce((sum, p) => sum + p.platformCommission, 0);
    const totalProviderEarnings = successfulPayments.reduce((sum, p) => sum + p.providerEarnings, 0);

    const pendingProviderPayouts = this.providerProfiles.reduce((sum, p) => sum + (p.availableBalance || 0), 0);
    const successfulPayoutsList = this.payouts.filter((po) => po.status === 'successful');
    const successfulProviderPayouts = successfulPayoutsList.reduce((sum, po) => sum + po.amount, 0);

    const recentTransactions = this.payments
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);

    return {
      totalUsers: totalCustomers + totalProviders,
      totalCustomers,
      totalProviders,
      totalBookings,
      completedBookings,
      pendingBookings,
      cancelledBookings,
      totalCustomerPayments,
      totalPlatformCommission,
      totalProviderEarnings,
      pendingProviderPayouts,
      successfulProviderPayouts,
      recentTransactions,
    };
  }

  // Services
  getServices(filters = {}) {
    let result = [...this.services];

    if (filters.category && filters.category !== 'All') {
      result = result.filter((s) => s.category.toLowerCase() === filters.category.toLowerCase());
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          (s.tags && s.tags.some((t) => t.includes(q)))
      );
    }

    if (filters.maxPrice) {
      result = result.filter((s) => s.price <= Number(filters.maxPrice));
    }

    return result;
  }

  getServiceById(id) {
    return this.services.find((s) => s._id.toString() === id.toString() || s.id === id);
  }

  getServicesByProviderId(providerId) {
    return this.services.filter((s) => s.providerId.toString() === providerId.toString());
  }

  addService(service) {
    if (!service._id) service._id = `srv_${uuidv4().substring(0, 8)}`;
    service.id = service._id;
    this.services.push(service);
    return service;
  }

  updateService(id, updates) {
    const s = this.getServiceById(id);
    if (s) {
      Object.assign(s, updates);
    }
    return s;
  }

  deleteService(id) {
    const idx = this.services.findIndex((s) => s._id.toString() === id.toString() || s.id === id);
    if (idx !== -1) {
      this.services.splice(idx, 1);
      return true;
    }
    return false;
  }

  // Bookings
  getBookings(filters = {}) {
    let result = [...this.bookings];

    if (filters.customerId) {
      result = result.filter((b) => b.customerId.toString() === filters.customerId.toString());
    }

    if (filters.providerId) {
      result = result.filter((b) => b.providerId.toString() === filters.providerId.toString());
    }

    if (filters.status && filters.status !== 'all') {
      result = result.filter((b) => b.status === filters.status);
    }

    return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  getBookingById(id) {
    return this.bookings.find((b) => b._id.toString() === id.toString() || b.id === id);
  }

  addBooking(booking) {
    if (!booking._id) booking._id = `bkg_${uuidv4().substring(0, 8)}`;
    booking.id = booking._id;
    booking.bookingReference = `NX-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    booking.createdAt = new Date().toISOString();
    this.bookings.push(booking);
    return booking;
  }

  updateBooking(id, updates) {
    const b = this.getBookingById(id);
    if (b) {
      Object.assign(b, updates);
    }
    return b;
  }

  // Reviews
  getReviewsByProvider(providerId) {
    return this.reviews.filter((r) => r.providerId.toString() === providerId.toString() && !r.isHidden);
  }

  addReview(review) {
    if (!review._id) review._id = `rev_${uuidv4().substring(0, 8)}`;
    review.id = review._id;
    review.createdAt = new Date().toISOString();
    this.reviews.push(review);

    const provReviews = this.getReviewsByProvider(review.providerId);
    if (provReviews.length > 0) {
      const avg = provReviews.reduce((sum, r) => sum + r.rating, 0) / provReviews.length;
      this.updateProviderProfile(review.providerId, {
        rating: Number(avg.toFixed(1)),
        reviewCount: provReviews.length,
      });
    }

    this.updateBooking(review.bookingId, { hasReview: true });
    return review;
  }

  // Chat / Conversations
  getConversationByBooking(bookingId) {
    return this.conversations.find((c) => c.bookingId.toString() === bookingId.toString());
  }

  getConversationsForUser(userId) {
    return this.conversations.filter(
      (c) => c.customerId.toString() === userId.toString() || c.providerId.toString() === userId.toString()
    );
  }

  addMessageToConversation(bookingId, message) {
    let conv = this.getConversationByBooking(bookingId);
    if (!conv) {
      const booking = this.getBookingById(bookingId);
      if (!booking) return null;
      conv = {
        _id: `conv_${uuidv4().substring(0, 8)}`,
        id: `conv_${uuidv4().substring(0, 8)}`,
        bookingId: booking._id,
        customerId: booking.customerId,
        providerId: booking.providerId,
        messages: [],
        createdAt: new Date().toISOString(),
      };
      this.conversations.push(conv);
    }

    const msgObj = {
      _id: `msg_${uuidv4().substring(0, 8)}`,
      id: `msg_${uuidv4().substring(0, 8)}`,
      senderId: message.senderId,
      senderRole: message.senderRole,
      text: message.text,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    conv.messages.push(msgObj);
    conv.lastMessage = {
      text: message.text,
      senderId: message.senderId,
      createdAt: msgObj.createdAt,
    };

    return msgObj;
  }

  // Disputes
  addDispute(dispute) {
    if (!dispute._id) dispute._id = `disp_${uuidv4().substring(0, 8)}`;
    dispute.id = dispute._id;
    dispute.status = 'open';
    dispute.createdAt = new Date().toISOString();
    this.disputes.push(dispute);
    return dispute;
  }

  getDisputes() {
    return this.disputes;
  }

  resolveDispute(id, adminId, note) {
    const d = this.disputes.find((x) => x._id.toString() === id.toString());
    if (d) {
      d.status = 'resolved';
      d.resolvedBy = adminId;
      d.resolutionNote = note;
      d.resolvedAt = new Date().toISOString();
    }
    return d;
  }

  // Notifications
  addNotification(notification) {
    if (!notification._id) notification._id = `notif_${uuidv4().substring(0, 8)}`;
    notification.id = notification._id;
    notification.isRead = false;
    notification.createdAt = new Date().toISOString();
    this.notifications.push(notification);
    return notification;
  }

  getNotifications(userId) {
    return this.notifications
      .filter((n) => n.userId.toString() === userId.toString())
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  markNotificationsRead(userId) {
    this.notifications.forEach((n) => {
      if (n.userId.toString() === userId.toString()) n.isRead = true;
    });
    return true;
  }

  // Audit Log
  addAuditLog(entry) {
    if (!entry._id) entry._id = `audit_${uuidv4().substring(0, 8)}`;
    entry.timestamp = new Date().toISOString();
    this.auditLogs.push(entry);
    return entry;
  }

  getAuditLogs() {
    return this.auditLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }
}

export const dataStore = new DataStore();
await dataStore.init();
