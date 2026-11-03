import { WalletService } from '../mocks/wallet.mock';
import { AdminManagementService } from './adminManagementService';

export interface OnboardingStageDef {
  stageNumber: number;
  id: string;
  title: string;
  description: string;
  isRequiredForGoLive: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

export const ONBOARDING_STAGES_CONFIG: OnboardingStageDef[] = [
  {
    stageNumber: 1,
    id: 'ACCOUNT_CREATED',
    title: 'Account Created',
    description: 'Initial signup and merchant tenant registration created',
    isRequiredForGoLive: true,
  },
  {
    stageNumber: 2,
    id: 'EMAIL_VERIFIED',
    title: 'Email Verified',
    description: 'Email address confirmed via OTP verification',
    isRequiredForGoLive: true,
    actionUrl: '/app/settings/profile',
    actionLabel: 'Verify Email',
  },
  {
    stageNumber: 3,
    id: 'MOBILE_VERIFIED',
    title: 'Mobile Verified',
    description: 'Primary mobile number confirmed via SMS OTP',
    isRequiredForGoLive: true,
    actionUrl: '/app/settings/profile',
    actionLabel: 'Verify Mobile',
  },
  {
    stageNumber: 4,
    id: 'PROFILE_COMPLETED',
    title: 'Company Profile Completed',
    description: 'Registered business name, GST, PAN & pickup address filled',
    isRequiredForGoLive: true,
    actionUrl: '/app/settings/company',
    actionLabel: 'Complete Profile',
  },
  {
    stageNumber: 5,
    id: 'KYC_SUBMITTED',
    title: 'KYC Submitted',
    description: 'GST, PAN, Cheque & Bank verification docs uploaded',
    isRequiredForGoLive: true,
    actionUrl: '/app/kyc',
    actionLabel: 'Submit KYC',
  },
  {
    stageNumber: 6,
    id: 'KYC_APPROVED',
    title: 'KYC Approved',
    description: 'Super Admin compliance team verification completed',
    isRequiredForGoLive: true,
    actionUrl: '/app/kyc',
    actionLabel: 'Check KYC Status',
  },
  {
    stageNumber: 7,
    id: 'RATE_CARD_ASSIGNED',
    title: 'Rate Card Assigned',
    description: 'Custom B2C & B2B shipping rate cards assigned to account',
    isRequiredForGoLive: true,
    actionUrl: '/app/my-rate-card',
    actionLabel: 'View Rate Card',
  },
  {
    stageNumber: 8,
    id: 'WALLET_ACTIVATED',
    title: 'Wallet Activated',
    description: 'Initial wallet recharge completed to enable dispatch funds',
    isRequiredForGoLive: true,
    actionUrl: '/app/wallet',
    actionLabel: 'Add Funds',
  },
  {
    stageNumber: 9,
    id: 'ACCOUNT_GO_LIVE',
    title: 'Account Go-Live',
    description: 'Account fully activated for live shipment creation',
    isRequiredForGoLive: true,
    actionUrl: '/app/orders/create',
    actionLabel: 'Create Shipment',
  },
];

export interface StageStatus {
  stageId: string;
  stageNumber: number;
  title: string;
  isComplete: boolean;
  isSkipped?: boolean;
  completedAt?: string;
  remarks?: string;
}

export interface CustomerOnboardingRecord extends Record<string, unknown> {
  customerId: string;
  companyName: string;
  contactPerson: string;
  email: string;
  mobile: string;
  gstNumber: string;
  currentStageNumber: number;
  currentStageTitle: string;
  completionPercentage: number;
  assignedManager: string;
  expectedGoLiveDate: string;
  status: 'PENDING_SETUP' | 'PENDING_KYC' | 'READY_FOR_GOLIVE' | 'LIVE' | 'STALLED';
  stages: StageStatus[];
  isEmailVerified: boolean;
  isMobileVerified: boolean;
  isProfileCompleted: boolean;
  isKycSubmitted: boolean;
  isKycApproved: boolean;
  isRateCardAssigned: boolean;
  isWalletActivated: boolean;
  isGoLive: boolean;
  createdAt: string;
  lastUpdated: string;
}

export const INITIAL_ONBOARDING_RECORDS: CustomerOnboardingRecord[] = [];

const STORAGE_KEY = 'courrier3_onboarding_records';

export const OnboardingService = {
  getRecords: (): CustomerOnboardingRecord[] => {
    let records: CustomerOnboardingRecord[] = [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) records = parsed;
      }
    } catch {}

    // Synchronize dynamic registered merchants into the onboarding records
    try {
      const merchants = AdminManagementService.getRegisteredMerchantsFromStorage();
      for (const m of merchants) {
        const existingIdx = records.findIndex((r) => r.customerId === m.id || r.companyName === m.businessName);
        const wal = WalletService.getWallet(m.id);
        const hasBalance = (wal.availableBalanceMinor || 0) > 0;
        const now = m.createdAt ? m.createdAt.split('T')[0] : new Date().toISOString().split('T')[0];

        if (existingIdx === -1) {
          const newRec: CustomerOnboardingRecord = {
            customerId: m.id,
            companyName: m.businessName,
            contactPerson: m.ownerName || 'Merchant Admin',
            email: m.ownerEmail,
            mobile: m.ownerPhone || '',
            gstNumber: '',
            currentStageNumber: hasBalance ? 9 : 5,
            currentStageTitle: hasBalance ? 'Account Go-Live' : 'KYC Submitted',
            completionPercentage: hasBalance ? 100 : 60,
            assignedManager: 'Maxline Onboarding Desk',
            expectedGoLiveDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
            status: hasBalance ? 'LIVE' : 'PENDING_KYC',
            isEmailVerified: true,
            isMobileVerified: true,
            isProfileCompleted: true,
            isKycSubmitted: true,
            isKycApproved: hasBalance,
            isRateCardAssigned: true,
            isWalletActivated: hasBalance,
            isGoLive: hasBalance,
            createdAt: now,
            lastUpdated: now,
            stages: [
              { stageId: 'ACCOUNT_CREATED', stageNumber: 1, title: 'Account Created', isComplete: true, completedAt: now },
              { stageId: 'EMAIL_VERIFIED', stageNumber: 2, title: 'Email Verified', isComplete: true, completedAt: now },
              { stageId: 'MOBILE_VERIFIED', stageNumber: 3, title: 'Mobile Verified', isComplete: true, completedAt: now },
              { stageId: 'PROFILE_COMPLETED', stageNumber: 4, title: 'Company Profile Completed', isComplete: true, completedAt: now },
              { stageId: 'KYC_SUBMITTED', stageNumber: 5, title: 'KYC Submitted', isComplete: true, completedAt: now },
              { stageId: 'KYC_APPROVED', stageNumber: 6, title: 'KYC Approved', isComplete: hasBalance, remarks: hasBalance ? 'Verified with wallet active' : 'Under review' },
              { stageId: 'RATE_CARD_ASSIGNED', stageNumber: 7, title: 'Rate Card Assigned', isComplete: true, completedAt: now },
              { stageId: 'WALLET_ACTIVATED', stageNumber: 8, title: 'Wallet Activated', isComplete: hasBalance },
              { stageId: 'ACCOUNT_GO_LIVE', stageNumber: 9, title: 'Account Go-Live', isComplete: hasBalance },
            ],
          };
          records.unshift(newRec);
        } else if (hasBalance && !records[existingIdx].isGoLive) {
          records[existingIdx].isWalletActivated = true;
          records[existingIdx].isKycApproved = true;
          records[existingIdx].isGoLive = true;
          records[existingIdx].status = 'LIVE';
          records[existingIdx].currentStageNumber = 9;
          records[existingIdx].currentStageTitle = 'Account Go-Live';
          records[existingIdx].completionPercentage = 100;
        }
      }
    } catch {}

    return records;
  },

  syncWithMerchants: (merchants: any[]): CustomerOnboardingRecord[] => {
    let records = OnboardingService.getRecords();
    for (const m of merchants) {
      const idx = records.findIndex(
        (r) =>
          r.customerId === m.id ||
          (r.companyName && m.businessName && r.companyName.trim().toLowerCase() === m.businessName.trim().toLowerCase())
      );
      const wal = WalletService.getWallet(m.id);
      const hasBalance = (wal.availableBalanceMinor || 0) > 0 || (m.walletBalanceINR || 0) > 0;
      const now = m.createdAt ? m.createdAt.split('T')[0] : new Date().toISOString().split('T')[0];

      if (idx === -1) {
        const newRec: CustomerOnboardingRecord = {
          customerId: m.id,
          companyName: m.businessName,
          contactPerson: m.ownerName || 'Merchant Admin',
          email: m.ownerEmail || '',
          mobile: m.ownerPhone || '',
          gstNumber: '',
          currentStageNumber: hasBalance ? 9 : 5,
          currentStageTitle: hasBalance ? 'Account Go-Live' : 'KYC Submitted',
          completionPercentage: hasBalance ? 100 : 60,
          assignedManager: 'Maxline Onboarding Desk',
          expectedGoLiveDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
          status: hasBalance ? 'LIVE' : 'PENDING_KYC',
          isEmailVerified: true,
          isMobileVerified: true,
          isProfileCompleted: true,
          isKycSubmitted: true,
          isKycApproved: hasBalance,
          isRateCardAssigned: true,
          isWalletActivated: hasBalance,
          isGoLive: hasBalance,
          createdAt: now,
          lastUpdated: now,
          stages: [
            { stageId: 'ACCOUNT_CREATED', stageNumber: 1, title: 'Account Created', isComplete: true, completedAt: now },
            { stageId: 'EMAIL_VERIFIED', stageNumber: 2, title: 'Email Verified', isComplete: true, completedAt: now },
            { stageId: 'MOBILE_VERIFIED', stageNumber: 3, title: 'Mobile Verified', isComplete: true, completedAt: now },
            { stageId: 'PROFILE_COMPLETED', stageNumber: 4, title: 'Company Profile Completed', isComplete: true, completedAt: now },
            { stageId: 'KYC_SUBMITTED', stageNumber: 5, title: 'KYC Submitted', isComplete: true, completedAt: now },
            { stageId: 'KYC_APPROVED', stageNumber: 6, title: 'KYC Approved', isComplete: hasBalance, remarks: hasBalance ? 'Verified with active balance' : 'Under review' },
            { stageId: 'RATE_CARD_ASSIGNED', stageNumber: 7, title: 'Rate Card Assigned', isComplete: true, completedAt: now },
            { stageId: 'WALLET_ACTIVATED', stageNumber: 8, title: 'Wallet Activated', isComplete: hasBalance },
            { stageId: 'ACCOUNT_GO_LIVE', stageNumber: 9, title: 'Account Go-Live', isComplete: hasBalance },
          ],
        };
        records.unshift(newRec);
      } else {
        records[idx].companyName = m.businessName;
        records[idx].contactPerson = m.ownerName || records[idx].contactPerson;
        records[idx].email = m.ownerEmail || records[idx].email;
        if (hasBalance) {
          records[idx].isWalletActivated = true;
          records[idx].isKycApproved = true;
          records[idx].isGoLive = true;
          records[idx].status = 'LIVE';
          records[idx].currentStageNumber = 9;
          records[idx].currentStageTitle = 'Account Go-Live';
          records[idx].completionPercentage = 100;
        }
      }
    }
    OnboardingService.saveRecords(records);
    return records;
  },

  saveRecords: (records: CustomerOnboardingRecord[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  },

  getCustomerOnboarding: (customerId: string): CustomerOnboardingRecord => {
    const records = OnboardingService.getRecords();
    let rec = records.find((r) => r.customerId === customerId);
    if (!rec && records.length > 0) {
      rec = records[0];
    }
    if (!rec) {
      const uRaw = typeof window !== 'undefined' ? localStorage.getItem('courrier3_current_user') : null;
      let name = 'Merchant';
      if (uRaw) {
        try {
          name = JSON.parse(uRaw).businessName || name;
        } catch {}
      }
      rec = {
        customerId: customerId || 'merchant',
        companyName: name,
        contactPerson: 'Merchant Admin',
        email: '',
        mobile: '',
        gstNumber: '',
        currentStageNumber: 5,
        currentStageTitle: 'KYC Submitted',
        completionPercentage: 60,
        assignedManager: 'Maxline Onboarding Desk',
        expectedGoLiveDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        status: 'PENDING_KYC',
        isEmailVerified: true,
        isMobileVerified: true,
        isProfileCompleted: true,
        isKycSubmitted: true,
        isKycApproved: false,
        isRateCardAssigned: true,
        isWalletActivated: false,
        isGoLive: false,
        createdAt: new Date().toISOString().split('T')[0],
        lastUpdated: new Date().toISOString().split('T')[0],
        stages: [
          { stageId: 'ACCOUNT_CREATED', stageNumber: 1, title: 'Account Created', isComplete: true },
          { stageId: 'EMAIL_VERIFIED', stageNumber: 2, title: 'Email Verified', isComplete: true },
          { stageId: 'MOBILE_VERIFIED', stageNumber: 3, title: 'Mobile Verified', isComplete: true },
          { stageId: 'PROFILE_COMPLETED', stageNumber: 4, title: 'Company Profile Completed', isComplete: true },
          { stageId: 'KYC_SUBMITTED', stageNumber: 5, title: 'KYC Submitted', isComplete: true },
          { stageId: 'KYC_APPROVED', stageNumber: 6, title: 'KYC Approved', isComplete: false },
          { stageId: 'RATE_CARD_ASSIGNED', stageNumber: 7, title: 'Rate Card Assigned', isComplete: true },
          { stageId: 'WALLET_ACTIVATED', stageNumber: 8, title: 'Wallet Activated', isComplete: false },
          { stageId: 'ACCOUNT_GO_LIVE', stageNumber: 9, title: 'Account Go-Live', isComplete: false },
        ],
      };
    }

    // Dynamic Wallet Activation Check: If wallet balance exists, auto-mark Stage 8 & 9 as complete
    try {
      const wallet = WalletService.getWallet(customerId);
      if (wallet.availableBalanceMinor > 0 && (!rec.isWalletActivated || !rec.isGoLive)) {
        rec = OnboardingService.forceGoLive(rec.customerId);
      }
    } catch (_e) {
      // Safe fallback
    }

    return rec;
  },

  validateGoLiveRules: (customerId: string): { canGoLive: boolean; missingRequirements: string[] } => {
    const rec = OnboardingService.getCustomerOnboarding(customerId);
    const missing: string[] = [];

    const wallet = WalletService.getWallet();
    const isWalletActive = rec.isWalletActivated || wallet.availableBalanceMinor > 0;

    if (!rec.isEmailVerified) missing.push('Email Verification');
    if (!rec.isMobileVerified) missing.push('Mobile Verification');
    if (!rec.isProfileCompleted) missing.push('Company Profile Details');
    if (!rec.isKycApproved) missing.push('Super Admin KYC Approval');
    if (!rec.isRateCardAssigned) missing.push('Assigned Shipping Rate Card');
    if (!isWalletActive) missing.push('Initial Wallet Recharge');

    return {
      canGoLive: missing.length === 0 || rec.isGoLive,
      missingRequirements: missing,
    };
  },

  markStageComplete: (customerId: string, stageNumber: number, remarks?: string): CustomerOnboardingRecord => {
    const records = OnboardingService.getRecords();
    const updated = records.map((r) => {
      if (r.customerId !== customerId) return r;

      const now = new Date().toISOString().split('T')[0];
      const newStages = r.stages.map((st) => {
        if (st.stageNumber === stageNumber) {
          return { ...st, isComplete: true, completedAt: now, remarks: remarks || 'Completed' };
        }
        return st;
      });

      const completedCount = newStages.filter((st) => st.isComplete).length;
      const pct = Math.round((completedCount / 9) * 100);
      const isGoLive = completedCount === 9;

      let status = r.status;
      if (isGoLive) status = 'LIVE';
      else if (pct >= 85) status = 'READY_FOR_GOLIVE';

      const isEmailVerified = stageNumber >= 2 ? true : r.isEmailVerified;
      const isMobileVerified = stageNumber >= 3 ? true : r.isMobileVerified;
      const isProfileCompleted = stageNumber >= 4 ? true : r.isProfileCompleted;
      const isKycSubmitted = stageNumber >= 5 ? true : r.isKycSubmitted;
      const isKycApproved = stageNumber >= 6 ? true : r.isKycApproved;
      const isRateCardAssigned = stageNumber >= 7 ? true : r.isRateCardAssigned;
      const isWalletActivated = stageNumber >= 8 ? true : r.isWalletActivated;

      return {
        ...r,
        stages: newStages,
        currentStageNumber: Math.min(completedCount + 1, 9),
        currentStageTitle: ONBOARDING_STAGES_CONFIG.find((s) => s.stageNumber === Math.min(completedCount + 1, 9))?.title || 'Account Go-Live',
        completionPercentage: pct,
        status,
        isGoLive,
        isEmailVerified,
        isMobileVerified,
        isProfileCompleted,
        isKycSubmitted,
        isKycApproved,
        isRateCardAssigned,
        isWalletActivated,
        lastUpdated: `${now} ${new Date().toTimeString().split(' ')[0]}`,
      };
    });

    OnboardingService.saveRecords(updated);
    return updated.find((r) => r.customerId === customerId)!;
  },

  skipStage: (customerId: string, stageNumber: number, remarks?: string): CustomerOnboardingRecord => {
    const records = OnboardingService.getRecords();
    const updated = records.map((r) => {
      if (r.customerId !== customerId) return r;

      const now = new Date().toISOString().split('T')[0];
      const newStages = r.stages.map((st) => {
        if (st.stageNumber === stageNumber) {
          return { ...st, isComplete: true, isSkipped: true, completedAt: now, remarks: remarks || 'Skipped by Admin' };
        }
        return st;
      });

      const completedCount = newStages.filter((st) => st.isComplete).length;
      const pct = Math.round((completedCount / 9) * 100);

      return {
        ...r,
        stages: newStages,
        completionPercentage: pct,
        lastUpdated: `${now} ${new Date().toTimeString().split(' ')[0]}`,
      };
    });

    OnboardingService.saveRecords(updated);
    return updated.find((r) => r.customerId === customerId)!;
  },

  forceGoLive: (customerId: string): CustomerOnboardingRecord => {
    const records = OnboardingService.getRecords();
    const now = new Date().toISOString().split('T')[0];
    const updated = records.map((r) => {
      if (r.customerId !== customerId) return r;

      const allCompleteStages = r.stages.map((st) => ({
        ...st,
        isComplete: true,
        completedAt: st.completedAt || now,
      }));

      return {
        ...r,
        stages: allCompleteStages,
        currentStageNumber: 9,
        currentStageTitle: 'Account Go-Live',
        completionPercentage: 100,
        status: 'LIVE' as const,
        isGoLive: true,
        isWalletActivated: true,
        isKycApproved: true,
        isRateCardAssigned: true,
        lastUpdated: `${now} ${new Date().toTimeString().split(' ')[0]}`,
      };
    });

    OnboardingService.saveRecords(updated);
    return updated.find((r) => r.customerId === customerId)!;
  },

  assignAccountManager: (customerId: string, managerName: string): CustomerOnboardingRecord => {
    const records = OnboardingService.getRecords();
    const updated = records.map((r) => {
      if (r.customerId !== customerId) return r;
      return { ...r, assignedManager: managerName };
    });

    OnboardingService.saveRecords(updated);
    return updated.find((r) => r.customerId === customerId)!;
  },
};
