import { dataStore } from '../models/dataStore.js';

export class CommissionEngine {
  /**
   * Calculate Commission and Provider Share
   * Priority: Provider Override > Category Override > Default
   * Uses decimal-safe calculations in paise
   */
  static calculate({ grossAmount, category, providerId }) {
    const rules = dataStore.getCommissionRules();

    if (!rules.isActive) {
      return {
        commissionRate: 0,
        fixedFee: 0,
        commissionAmount: 0,
        providerAmount: grossAmount,
        grossAmount,
        appliedRule: 'COMMISSION_DISABLED',
      };
    }

    let rate = rules.defaultPercentage ?? 10;
    let ruleType = 'DEFAULT_RATE';

    // Check category override
    if (category && rules.categoryPercentages && rules.categoryPercentages[category] !== undefined) {
      rate = Number(rules.categoryPercentages[category]);
      ruleType = `CATEGORY_OVERRIDE_${category.toUpperCase()}`;
    }

    // Check provider override
    if (providerId && rules.providerPercentages && rules.providerPercentages[providerId] !== undefined) {
      rate = Number(rules.providerPercentages[providerId]);
      ruleType = `PROVIDER_CUSTOM_OVERRIDE`;
    }

    const fixedFee = Number(rules.fixedFee) || 0;

    // Decimal-safe in paise (1 INR = 100 Paise)
    const grossPaise = Math.round(grossAmount * 100);
    const variableFeePaise = Math.round(grossPaise * (rate / 100));
    const fixedFeePaise = Math.round(fixedFee * 100);

    const totalCommissionPaise = Math.min(grossPaise, variableFeePaise + fixedFeePaise);
    const providerSharePaise = grossPaise - totalCommissionPaise;

    const commissionAmount = Number((totalCommissionPaise / 100).toFixed(2));
    const providerAmount = Number((providerSharePaise / 100).toFixed(2));

    return {
      commissionRate: rate,
      fixedFee,
      commissionAmount,
      providerAmount,
      grossAmount,
      appliedRule: ruleType,
      calculatedAt: new Date().toISOString(),
    };
  }
}
