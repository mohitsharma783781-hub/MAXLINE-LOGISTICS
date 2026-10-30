import { WalletService } from '../mocks/wallet.mock';

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

export const INITIAL_ONBOARDING_RECORDS: CustomerOnboardingRecord[] = [
  {
    customerId: 'CUST-1001',
    companyName: 'Apex Logistics & Retail',
    contactPerson: 'Rahul Sharma',
    email: 'rahul.s@apexlogistics.com',
    mobile: '+91 98765 11111',
    gstNumber: '27AABCU9603R1ZM',
    currentStageNumber: 9,
    currentStageTitle: 'Account Go-Live',
    completionPercentage: 100,
    assignedManager: 'Vikram Singh (KAM)',
    expectedGoLiveDate: '2026-09-05',
    status: 'LIVE',
    isEmailVerified: true,
    isMobileVerified: true,
    isProfileCompleted: true,
    isKycSubmitted: true,
    isKycApproved: true,
    isRateCardAssigned: true,
    isWalletActivated: true,
    isGoLive: true,
    createdAt: '2026-08-20',
    lastUpdated: '2026-09-04 14:10',
    stages: [
      { stageId: 'ACCOUNT_CREATED', stageNumber: 1, title: 'Account Created', isComplete: true, completedAt: '2026-08-20' },
      { stageId: 'EMAIL_VERIFIED', stageNumber: 2, title: 'Email Verified', isComplete: true, completedAt: '2026-08-20' },
      { stageId: 'MOBILE_VERIFIED', stageNumber: 3, title: 'Mobile Verified', isComplete: true, completedAt: '2026-08-21' },
      { stageId: 'PROFILE_COMPLETED', stageNumber: 4, title: 'Company Profile Completed', isComplete: true, completedAt: '2026-08-22' },
      { stageId: 'KYC_SUBMITTED', stageNumber: 5, title: 'KYC Submitted', isComplete: true, completedAt: '2026-08-23' },
      { stageId: 'KYC_APPROVED', stageNumber: 6, title: 'KYC Approved', isComplete: true, completedAt: '2026-08-25' },
      { stageId: 'RATE_CARD_ASSIGNED', stageNumber: 7, title: 'Rate Card Assigned', isComplete: true, completedAt: '2026-08-28' },
      { stageId: 'WALLET_ACTIVATED', stageNumber: 8, title: 'Wallet Activated', isComplete: true, completedAt: '2026-08-30' },
      { stageId: 'ACCOUNT_GO_LIVE', stageNumber: 9, title: 'Account Go-Live', isComplete: true, completedAt: '2026-09-01' },
    ],
  },
  {
    customerId: 'CUST-1002',
    companyName: 'Velocity E-Commerce Pvt Ltd',
    contactPerson: 'Priya Verma',
    email: 'priya@velocityecom.com',
    mobile: '+91 98765 22222',
    gstNumber: '07AAACV4820K1ZX',
    currentStageNumber: 5,
    currentStageTitle: 'KYC Submitted',
    completionPercentage: 55,
    assignedManager: 'Priya Sharma (KAM)',
    expectedGoLiveDate: '2026-09-08',
    status: 'PENDING_KYC',
    isEmailVerified: true,
    isMobileVerified: true,
    isProfileCompleted: true,
    isKycSubmitted: true,
    isKycApproved: false,
    isRateCardAssigned: true,
    isWalletActivated: false,
    isGoLive: false,
    createdAt: '2026-08-25',
    lastUpdated: '2026-09-03 16:30',
    stages: [
      { stageId: 'ACCOUNT_CREATED', stageNumber: 1, title: 'Account Created', isComplete: true, completedAt: '2026-08-25' },
      { stageId: 'EMAIL_VERIFIED', stageNumber: 2, title: 'Email Verified', isComplete: true, completedAt: '2026-08-25' },
      { stageId: 'MOBILE_VERIFIED', stageNumber: 3, title: 'Mobile Verified', isComplete: true, completedAt: '2026-08-26' },
      { stageId: 'PROFILE_COMPLETED', stageNumber: 4, title: 'Company Profile Completed', isComplete: true, completedAt: '2026-08-27' },
      { stageId: 'KYC_SUBMITTED', stageNumber: 5, title: 'KYC Submitted', isComplete: true, completedAt: '2026-08-29' },
      { stageId: 'KYC_APPROVED', stageNumber: 6, title: 'KYC Approved', isComplete: false, remarks: 'Under verification by Compliance desk' },
      { stageId: 'RATE_CARD_ASSIGNED', stageNumber: 7, title: 'Rate Card Assigned', isComplete: true, completedAt: '2026-08-30' },
      { stageId: 'WALLET_ACTIVATED', stageNumber: 8, title: 'Wallet Activated', isComplete: false },
      { stageId: 'ACCOUNT_GO_LIVE', stageNumber: 9, title: 'Account Go-Live', isComplete: false },
    ],
  },
  {
    customerId: 'CUST-1003',
    companyName: 'Acme Global Traders',
    contactPerson: 'Amit Patel',
    email: 'amit@acmetraders.in',
    mobile: '+91 98765 33333',
    gstNumber: '24AABCA5512B1Z6',
    currentStageNumber: 9,
    currentStageTitle: 'Account Go-Live',
    completionPercentage: 100,
    assignedManager: 'Vikram Singh (KAM)',
    expectedGoLiveDate: '2026-08-15',
    status: 'LIVE',
    isEmailVerified: true,
    isMobileVerified: true,
    isProfileCompleted: true,
    isKycSubmitted: true,
    isKycApproved: true,
    isRateCardAssigned: true,
    isWalletActivated: true,
    isGoLive: true,
    createdAt: '2026-08-01',
    lastUpdated: '2026-08-15 11:20',
    stages: [
      { stageId: 'ACCOUNT_CREATED', stageNumber: 1, title: 'Account Created', isComplete: true, completedAt: '2026-08-01' },
      { stageId: 'EMAIL_VERIFIED', stageNumber: 2, title: 'Email Verified', isComplete: true, completedAt: '2026-08-01' },
      { stageId: 'MOBILE_VERIFIED', stageNumber: 3, title: 'Mobile Verified', isComplete: true, completedAt: '2026-08-02' },
      { stageId: 'PROFILE_COMPLETED', stageNumber: 4, title: 'Company Profile Completed', isComplete: true, completedAt: '2026-08-03' },
      { stageId: 'KYC_SUBMITTED', stageNumber: 5, title: 'KYC Submitted', isComplete: true, completedAt: '2026-08-05' },
      { stageId: 'KYC_APPROVED', stageNumber: 6, title: 'KYC Approved', isComplete: true, completedAt: '2026-08-07' },
      { stageId: 'RATE_CARD_ASSIGNED', stageNumber: 7, title: 'Rate Card Assigned', isComplete: true, completedAt: '2026-08-10' },
      { stageId: 'WALLET_ACTIVATED', stageNumber: 8, title: 'Wallet Activated', isComplete: true, completedAt: '2026-08-12' },
      { stageId: 'ACCOUNT_GO_LIVE', stageNumber: 9, title: 'Account Go-Live', isComplete: true, completedAt: '2026-08-15' },
    ],
  },
  {
    customerId: 'CUST-1004',
    companyName: 'NextGen Direct Commerce',
    contactPerson: 'Siddharth Mehta',
    email: 'sid@nextgencommerce.com',
    mobile: '+91 98765 44444',
    gstNumber: '06AAAAC1234F1Z2',
    currentStageNumber: 3,
    currentStageTitle: 'Mobile Verified',
    completionPercentage: 33,
    assignedManager: 'Unassigned',
    expectedGoLiveDate: '2026-09-12',
    status: 'PENDING_SETUP',
    isEmailVerified: true,
    isMobileVerified: true,
    isProfileCompleted: false,
    isKycSubmitted: false,
    isKycApproved: false,
    isRateCardAssigned: false,
    isWalletActivated: false,
    isGoLive: false,
    createdAt: '2026-09-01',
    lastUpdated: '2026-09-02 09:15',
    stages: [
      { stageId: 'ACCOUNT_CREATED', stageNumber: 1, title: 'Account Created', isComplete: true, completedAt: '2026-09-01' },
      { stageId: 'EMAIL_VERIFIED', stageNumber: 2, title: 'Email Verified', isComplete: true, completedAt: '2026-09-01' },
      { stageId: 'MOBILE_VERIFIED', stageNumber: 3, title: 'Mobile Verified', isComplete: true, completedAt: '2026-09-02' },
      { stageId: 'PROFILE_COMPLETED', stageNumber: 4, title: 'Company Profile Completed', isComplete: false },
      { stageId: 'KYC_SUBMITTED', stageNumber: 5, title: 'KYC Submitted', isComplete: false },
      { stageId: 'KYC_APPROVED', stageNumber: 6, title: 'KYC Approved', isComplete: false },
      { stageId: 'RATE_CARD_ASSIGNED', stageNumber: 7, title: 'Rate Card Assigned', isComplete: false },
      { stageId: 'WALLET_ACTIVATED', stageNumber: 8, title: 'Wallet Activated', isComplete: false },
      { stageId: 'ACCOUNT_GO_LIVE', stageNumber: 9, title: 'Account Go-Live', isComplete: false },
    ],
  },
];

const STORAGE_KEY = 'courrier3_onboarding_records';

export const OnboardingService = {
  getRecords: (): CustomerOnboardingRecord[] => {
    const saved = localStorage.getItem(STORAGE_KEY);
    let records: CustomerOnboardingRecord[] = saved ? JSON.parse(saved) : INITIAL_ONBOARDING_RECORDS;
    
    // Auto-sync cached localStorage records with active wallet balance
    try {
      const wallet = WalletService.getWallet();
      if (wallet.availableBalanceMinor > 0) {
        records = records.map((r) => {
          if (r.customerId === 'CUST-1001' && (!r.isWalletActivated || !r.isGoLive)) {
            const now = new Date().toISOString().split('T')[0];
            return {
              ...r,
              isWalletActivated: true,
              isGoLive: true,
              completionPercentage: 100,
              status: 'LIVE',
              currentStageNumber: 9,
              currentStageTitle: 'Account Go-Live',
              stages: r.stages.map((st) => ({ ...st, isComplete: true, completedAt: st.completedAt || now })),
            };
          }
          return r;
        });
      }
    } catch (_e) {}

    return records;
  },

  saveRecords: (records: CustomerOnboardingRecord[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  },

  getCustomerOnboarding: (customerId: string): CustomerOnboardingRecord => {
    const records = OnboardingService.getRecords();
    let rec = records.find((r) => r.customerId === customerId) || records[0];

    // Dynamic Wallet Activation Check: If wallet balance exists, auto-mark Stage 8 & 9 as complete
    try {
      const wallet = WalletService.getWallet();
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
