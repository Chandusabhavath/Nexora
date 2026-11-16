import { dataStore } from '../models/dataStore.js';

export class AIMatchingService {
  /**
   * Parse natural language task description into structured intent and constraints
   */
  static parseIntent(promptText, userLocation = 'Bandra') {
    const text = promptText.toLowerCase();

    // 1. Detect Category
    let detectedCategory = null;
    let confidence = 0.5;

    const categoryKeywords = {
      Electrical: ['electric', 'electrician', 'wiring', 'mcb', 'switch', 'light', 'fan', 'inverter', 'short circuit', 'current', 'fuse'],
      Plumbing: ['plumb', 'plumber', 'pipe', 'leak', 'water', 'tap', 'drain', 'clog', 'sink', 'toilet', 'flush', 'geyser'],
      'Home Cleaning': ['clean', 'cleaning', 'sweep', 'mop', 'wash', 'deep clean', 'sanitize', 'kitchen grease', 'sofa', 'bathroom'],
      Carpentry: ['carpent', 'carpenter', 'wood', 'furniture', 'door', 'lock', 'hinge', 'table', 'chair', 'bed', 'cabinet'],
      Painting: ['paint', 'painter', 'whitewash', 'distemper', 'primer', 'wall color', 'stencil', 'waterproof'],
      'Appliance Repair': ['appliance', 'fridge', 'refrigerator', 'washing machine', 'microwave', 'oven', 'ac repair', 'air conditioner'],
      Gardening: ['garden', 'gardener', 'plant', 'lawn', 'pruning', 'grass', 'potting', 'soil'],
      'Moving & Helpers': ['helper', 'moving', 'shifting', 'heavy lifting', 'luggage', 'relocation', 'packers', 'unloading'],
    };

    for (const [cat, keywords] of Object.entries(categoryKeywords)) {
      for (const kw of keywords) {
        if (text.includes(kw)) {
          detectedCategory = cat;
          confidence = 0.9;
          break;
        }
      }
      if (detectedCategory) break;
    }

    // 2. Detect Timing & Urgency
    let requestedTiming = 'Flexible';
    let urgency = 'normal';

    if (text.includes('urgent') || text.includes('emergency') || text.includes('asap') || text.includes('right now')) {
      requestedTiming = 'Immediate';
      urgency = 'high';
    } else if (text.includes('today evening')) {
      requestedTiming = 'Today Evening';
    } else if (text.includes('today')) {
      requestedTiming = 'Today';
    } else if (text.includes('tomorrow morning')) {
      requestedTiming = 'Tomorrow Morning (09:00 - 12:00)';
    } else if (text.includes('tomorrow')) {
      requestedTiming = 'Tomorrow';
    } else if (text.includes('weekend')) {
      requestedTiming = 'This Weekend';
    }

    // 3. Detect Budget (e.g., "under 500", "budget 800", "₹1000")
    let maxBudget = null;
    const budgetMatch = text.match(/(?:under|budget|below|max|around|rs\.?|inr|₹)\s*(\d{3,5})/i);
    if (budgetMatch && budgetMatch[1]) {
      maxBudget = parseInt(budgetMatch[1], 10);
    }

    // 4. Detect Duration (e.g., "for 4 hours", "2 hrs")
    let estimatedHours = 2;
    const durationMatch = text.match(/(\d+)\s*(?:hours|hour|hrs|hr)/i);
    if (durationMatch && durationMatch[1]) {
      estimatedHours = parseInt(durationMatch[1], 10);
    }

    // 5. Detect Locality
    let locality = userLocation;
    const knownLocalities = ['bandra', 'khar', 'juhu', 'andheri', 'mahim', 'dadar', 'santacruz', 'prabhadevi', 'worli'];
    for (const loc of knownLocalities) {
      if (text.includes(loc)) {
        locality = loc.charAt(0).toUpperCase() + loc.slice(1);
        break;
      }
    }

    // 6. Generate Clarifying Questions if ambiguous
    const clarifyingQuestions = [];
    if (!detectedCategory) {
      clarifyingQuestions.push('Which service category best describes your need (e.g. Electrical, Plumbing, Cleaning)?');
    }
    if (requestedTiming === 'Flexible') {
      clarifyingQuestions.push('Do you need assistance today, tomorrow, or over the weekend?');
    }
    if (!maxBudget) {
      clarifyingQuestions.push('Do you have an approximate budget target in mind?');
    }

    return {
      rawPrompt: promptText,
      detectedCategory: detectedCategory || 'General Assistance',
      confidence,
      requestedTiming,
      urgency,
      maxBudget,
      estimatedHours,
      locality,
      clarifyingQuestions,
    };
  }

  /**
   * Match providers with multi-factor scoring and detailed explanation
   */
  static matchProviders(parsedIntent) {
    const allProviders = dataStore.getProviders({ publicOnly: true });

    const scoredProviders = allProviders.map((provider) => {
      let score = 0;
      const matchReasons = [];

      // 1. Category Match (40 pts)
      if (
        parsedIntent.detectedCategory &&
        provider.category.toLowerCase() === parsedIntent.detectedCategory.toLowerCase()
      ) {
        score += 40;
        matchReasons.push(`Direct specialist in ${provider.category}`);
      } else {
        // Partial relevance
        score += 10;
      }

      // 2. Locality / Service Area Match (25 pts)
      const servesArea =
        provider.serviceArea.localities.some((loc) =>
          loc.toLowerCase().includes(parsedIntent.locality.toLowerCase())
        ) || provider.serviceArea.city.toLowerCase() === 'mumbai';

      if (servesArea) {
        score += 25;
        matchReasons.push(`Covers your service area in ${parsedIntent.locality}`);
      } else {
        score += 5;
      }

      // 3. Rating & Verified Trust (20 pts)
      if (provider.rating >= 4.8) {
        score += 20;
        matchReasons.push(`Exceptional ${provider.rating}★ rating from ${provider.reviewCount} verified customers`);
      } else if (provider.rating >= 4.5) {
        score += 15;
        matchReasons.push(`High customer satisfaction rating of ${provider.rating}★`);
      } else {
        score += 10;
      }

      // 4. Budget Compatibility (15 pts)
      if (parsedIntent.maxBudget) {
        const estCost = provider.hourlyRate * parsedIntent.estimatedHours;
        if (estCost <= parsedIntent.maxBudget) {
          score += 15;
          matchReasons.push(`Estimated total (₹${estCost}) fits well inside your budget (₹${parsedIntent.maxBudget})`);
        } else if (estCost <= parsedIntent.maxBudget * 1.2) {
          score += 8;
          matchReasons.push(`Slightly above target budget (₹${estCost}) with premium quality assurance`);
        } else {
          score += 2;
        }
      } else {
        score += 15; // Neutral default
      }

      // Find services associated with this provider
      const providerServices = dataStore.getServicesByProviderId(provider._id);

      return {
        providerId: provider._id,
        businessName: provider.businessName,
        category: provider.category,
        hourlyRate: provider.hourlyRate,
        rating: provider.rating,
        reviewCount: provider.reviewCount,
        avatar: provider.user?.avatar || '',
        experienceYears: provider.experienceYears,
        skills: provider.skills,
        serviceArea: provider.serviceArea,
        matchScore: Math.min(100, score),
        matchReasons,
        recommendedServices: providerServices,
      };
    });

    // Sort by matchScore descending
    scoredProviders.sort((a, b) => b.matchScore - a.matchScore);

    return {
      parsedIntent,
      engine: 'NEXORA-Hyperlocal-AI-v2.6',
      totalMatches: scoredProviders.length,
      matches: scoredProviders,
    };
  }
}
