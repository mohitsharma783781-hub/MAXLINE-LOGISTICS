import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Wallet,
  CheckCircle2,
  Building2,
  Home,
  Plus,
  ArrowLeft,
  ArrowRight,
  Printer,
  Download,
  Package,
  CreditCard,
  Truck,
  Check,
  Star,
  Zap,
  Tag,
  ThumbsUp,
  FileText,
  Save,
  RotateCcw,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
  User,
  Trash2,
  Copy,
  Layers,
  Box,
  Sliders,
  Info,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import {
  Button,
  Card,
  Badge,
  Input,
  Alert,
  Modal,
} from '../../components/ui';
import { WalletService } from '../../mocks/wallet.mock';
import { CustomerBookingService } from '../../services/customerBookingService';
import { CustomerRateAssignmentService, type EligibleCourierResult } from '../../services/customerRateAssignmentService';
import {
  AdminB2BRateService,
  type B2BRateCalculationResult,
  type B2BCourierQuote,
  type B2BCompareCouriersResult,
} from '../../services/adminB2BRateService';
import { CustomerWarehouseService, type CustomerWarehouse } from '../../services/customerWarehouseService';
import { OnboardingService } from '../../services/onboardingService';
import { useRbac } from '../../context/RbacContext';
import { useTenant } from '../../context/TenantContext';
import { formatCurrency } from '../../utils/formatters';

interface MultiPackageFormItem {
  id: string;
  packageNumber: number;
  packageType: string;
  actualWeightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  quantity: number;
  packageContents: string;
}

const WIZARD_STEPS = [
  { step: 1, label: '1. Pickup Warehouse', icon: Building2 },
  { step: 2, label: '2. Receiver Details', icon: Home },
  { step: 3, label: '3. Package Details', icon: Package },
  { step: 4, label: '4. Rate Comparison', icon: Truck },
  { step: 5, label: '5. Review & Confirm', icon: CreditCard },
  { step: 6, label: '6. Label & Success', icon: CheckCircle2 },
];

// Comprehensive Indian Logistics Hub Pincode Database
const PINCODE_MAP: Record<string, { city: string; state: string }> = {
  // Delhi NCR
  '110001': { city: 'New Delhi', state: 'Delhi' },
  '110002': { city: 'Central Delhi', state: 'Delhi' },
  '110020': { city: 'Okhla, New Delhi', state: 'Delhi' },
  '110037': { city: 'Aerocity, New Delhi', state: 'Delhi' },
  '110092': { city: 'East Delhi', state: 'Delhi' },
  '122001': { city: 'Gurugram', state: 'Haryana' },
  '122015': { city: 'Gurugram', state: 'Haryana' },
  '121001': { city: 'Faridabad', state: 'Haryana' },
  '201301': { city: 'Noida', state: 'Uttar Pradesh' },
  '201306': { city: 'Greater Noida', state: 'Uttar Pradesh' },
  '201001': { city: 'Ghaziabad', state: 'Uttar Pradesh' },

  // Maharashtra
  '400001': { city: 'Mumbai', state: 'Maharashtra' },
  '400005': { city: 'Colaba, Mumbai', state: 'Maharashtra' },
  '400051': { city: 'Bandra, Mumbai', state: 'Maharashtra' },
  '400069': { city: 'Andheri East, Mumbai', state: 'Maharashtra' },
  '400703': { city: 'Navi Mumbai', state: 'Maharashtra' },
  '400601': { city: 'Thane', state: 'Maharashtra' },
  '421302': { city: 'Bhiwandi', state: 'Maharashtra' },
  '411001': { city: 'Pune', state: 'Maharashtra' },
  '411057': { city: 'Hinjawadi, Pune', state: 'Maharashtra' },
  '422001': { city: 'Nashik', state: 'Maharashtra' },
  '440001': { city: 'Nagpur', state: 'Maharashtra' },
  '431001': { city: 'Aurangabad', state: 'Maharashtra' },

  // Karnataka
  '560001': { city: 'Bengaluru', state: 'Karnataka' },
  '560038': { city: 'Indiranagar, Bengaluru', state: 'Karnataka' },
  '560066': { city: 'Whitefield, Bengaluru', state: 'Karnataka' },
  '560100': { city: 'Electronic City, Bengaluru', state: 'Karnataka' },
  '560058': { city: 'Peenya, Bengaluru', state: 'Karnataka' },
  '570001': { city: 'Mysuru', state: 'Karnataka' },
  '575001': { city: 'Mangaluru', state: 'Karnataka' },
  '580001': { city: 'Hubballi', state: 'Karnataka' },

  // Tamil Nadu
  '600001': { city: 'Chennai', state: 'Tamil Nadu' },
  '600017': { city: 'T. Nagar, Chennai', state: 'Tamil Nadu' },
  '600032': { city: 'Guindy, Chennai', state: 'Tamil Nadu' },
  '641001': { city: 'Coimbatore', state: 'Tamil Nadu' },
  '625001': { city: 'Madurai', state: 'Tamil Nadu' },
  '620001': { city: 'Tiruchirappalli', state: 'Tamil Nadu' },
  '636001': { city: 'Salem', state: 'Tamil Nadu' },

  // Telangana & Andhra Pradesh
  '500001': { city: 'Hyderabad', state: 'Telangana' },
  '500081': { city: 'HITEC City, Hyderabad', state: 'Telangana' },
  '500034': { city: 'Banjara Hills, Hyderabad', state: 'Telangana' },
  '530001': { city: 'Visakhapatnam', state: 'Andhra Pradesh' },
  '520001': { city: 'Vijayawada', state: 'Andhra Pradesh' },
  '522002': { city: 'Guntur', state: 'Andhra Pradesh' },

  // Gujarat
  '380001': { city: 'Ahmedabad', state: 'Gujarat' },
  '380015': { city: 'Ahmedabad', state: 'Gujarat' },
  '395001': { city: 'Surat', state: 'Gujarat' },
  '390001': { city: 'Vadodara', state: 'Gujarat' },
  '360001': { city: 'Rajkot', state: 'Gujarat' },

  // West Bengal & East
  '700001': { city: 'Kolkata', state: 'West Bengal' },
  '700016': { city: 'Park Street, Kolkata', state: 'West Bengal' },
  '700091': { city: 'Salt Lake, Kolkata', state: 'West Bengal' },
  '711101': { city: 'Howrah', state: 'West Bengal' },
  '800001': { city: 'Patna', state: 'Bihar' },
  '834001': { city: 'Ranchi', state: 'Jharkhand' },
  '826001': { city: 'Dhanbad', state: 'Jharkhand' },
  '751001': { city: 'Bhubaneswar', state: 'Odisha' },
  '781001': { city: 'Guwahati', state: 'Assam' },

  // North & Central (Punjab, Rajasthan, UP, HP, MP, Kerala)
  '302001': { city: 'Jaipur', state: 'Rajasthan' },
  '342001': { city: 'Jodhpur', state: 'Rajasthan' },
  '324001': { city: 'Kota', state: 'Rajasthan' },
  '160001': { city: 'Chandigarh', state: 'Chandigarh' },
  '141001': { city: 'Ludhiana', state: 'Punjab' },
  '143001': { city: 'Amritsar', state: 'Punjab' },
  '226001': { city: 'Lucknow', state: 'Uttar Pradesh' },
  '208001': { city: 'Kanpur', state: 'Uttar Pradesh' },
  '282001': { city: 'Agra', state: 'Uttar Pradesh' },
  '221001': { city: 'Varanasi', state: 'Uttar Pradesh' },
  '250001': { city: 'Meerut', state: 'Uttar Pradesh' },
  '452001': { city: 'Indore', state: 'Madhya Pradesh' },
  '462001': { city: 'Bhopal', state: 'Madhya Pradesh' },
  '492001': { city: 'Raipur', state: 'Chhattisgarh' },
  '173205': { city: 'Solan', state: 'Himachal Pradesh' },
  '171001': { city: 'Shimla', state: 'Himachal Pradesh' },
  '190001': { city: 'Srinagar', state: 'Jammu & Kashmir' },
  '682001': { city: 'Kochi', state: 'Kerala' },
  '695001': { city: 'Thiruvananthapuram', state: 'Kerala' },
};

// India Post Postal Circle Prefix Resolver (Resolves state for all valid 6-digit Pincodes)
const resolvePostalCircleState = (pincode: string): string => {
  const prefix = pincode.slice(0, 2);
  switch (prefix) {
    case '11': return 'Delhi';
    case '12':
    case '13': return 'Haryana';
    case '14':
    case '15': return 'Punjab';
    case '16': return 'Chandigarh';
    case '17': return 'Himachal Pradesh';
    case '18':
    case '19': return 'Jammu & Kashmir';
    case '20':
    case '21':
    case '22':
    case '23':
    case '24':
    case '25':
    case '26':
    case '27':
    case '28': return 'Uttar Pradesh / Uttarakhand';
    case '30':
    case '31':
    case '32':
    case '33':
    case '34': return 'Rajasthan';
    case '36':
    case '37':
    case '38':
    case '39': return 'Gujarat';
    case '40':
    case '41':
    case '42':
    case '43':
    case '44': return 'Maharashtra / Goa';
    case '45':
    case '46':
    case '47':
    case '48': return 'Madhya Pradesh';
    case '49': return 'Chhattisgarh';
    case '50': return 'Telangana';
    case '51':
    case '52':
    case '53': return 'Andhra Pradesh';
    case '56':
    case '57':
    case '58':
    case '59': return 'Karnataka';
    case '60':
    case '61':
    case '62':
    case '63':
    case '64': return 'Tamil Nadu';
    case '67':
    case '68':
    case '69': return 'Kerala';
    case '70':
    case '71':
    case '72':
    case '73':
    case '74': return 'West Bengal';
    case '75':
    case '76':
    case '77': return 'Odisha';
    case '78': return 'Assam';
    case '79': return 'North Eastern Region';
    case '80':
    case '81':
    case '82':
    case '83':
    case '84':
    case '85': return 'Bihar / Jharkhand';
    default: return '';
  }
};

const DRAFT_STORAGE_KEY = 'COURRIER3_CREATE_SHIPMENT_DRAFT';

export const CreateShipmentWizardPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const navState = (location.state as any) || {};

  const { activeTenantId } = useTenant();
  const tenantId = activeTenantId;
  const { logActivity } = useRbac();

  // Step State (1 to 6)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formError, setFormError] = useState<string | null>(null);

  // Draft Saved Indicator
  const [draftSavedTime, setDraftSavedTime] = useState<string | null>(null);

  // 1. Pickup Warehouses Engine
  const [warehouses, setWarehouses] = useState<CustomerWarehouse[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const [isLoadingWarehouses, setIsLoadingWarehouses] = useState<boolean>(true);
  const [warehouseLoadError, setWarehouseLoadError] = useState<string | null>(null);

  // Wallet Balance
  const [walletBalanceINR, setWalletBalanceINR] = useState<number>(() => {
    if (!tenantId) return 0;
    const wal = WalletService.getWallet(tenantId);
    return wal.availableBalanceMinor / 100;
  });

  // Query warehouse records strictly from authenticated MAXLINE merchant Supabase DB
  const loadWarehouses = useCallback(async () => {
    if (!tenantId) {
      setIsLoadingWarehouses(false);
      setWarehouses([]);
      setSelectedWarehouseId('');
      return;
    }

    setIsLoadingWarehouses(true);
    setWarehouseLoadError(null);

    try {
      const cloudWarehouses = await CustomerWarehouseService.syncFromSupabase(tenantId);
      const active = (cloudWarehouses || []).filter((w) => w.status === 'ACTIVE');
      setWarehouses(active);
      setSelectedWarehouseId((prev) => {
        if (prev && active.some((w) => w.id === prev)) return prev;
        return active.find((w) => w.isDefault)?.id || active[0]?.id || '';
      });
    } catch (err: any) {
      console.warn('[CreateShipmentWizard] Warehouse query notice:', err);
      setWarehouseLoadError(err?.message || 'Could not load pickup warehouses from MAXLINE database.');
      setWarehouses([]);
      setSelectedWarehouseId('');
    } finally {
      setIsLoadingWarehouses(false);
    }
  }, [tenantId]);

  // Sync latest warehouses & wallet balance on mount / tenantId change
  useEffect(() => {
    loadWarehouses();

    if (tenantId) {
      WalletService.syncFromSupabase(tenantId).then((wal) => {
        setWalletBalanceINR(wal.availableBalanceMinor / 100);
      }).catch(() => {});
    }
  }, [tenantId, loadWarehouses]);

  // In-flow Add Warehouse Modal State
  const [isAddWhModalOpen, setIsAddWhModalOpen] = useState(false);
  const [newWhName, setNewWhName] = useState('');
  const [newWhContact, setNewWhContact] = useState('');
  const [newWhPhone, setNewWhPhone] = useState('');
  const [newWhEmail, setNewWhEmail] = useState('');
  const [newWhAddress, setNewWhAddress] = useState('');
  const [newWhPincode, setNewWhPincode] = useState('110001');
  const [newWhCity, setNewWhCity] = useState('New Delhi');
  const [newWhState, setNewWhState] = useState('Delhi');

  // Step 2: Receiver Details (Prefilled if available from state, else clean for seller)
  const initialToPincode = navState.toPincode || '';
  const initialCity = initialToPincode && PINCODE_MAP[initialToPincode]?.city ? PINCODE_MAP[initialToPincode].city : '';
  const initialState = initialToPincode
    ? (PINCODE_MAP[initialToPincode]?.state || resolvePostalCircleState(initialToPincode) || '')
    : '';

  const [receiverType, setReceiverType] = useState<'b2c' | 'b2b'>(() =>
    navState.mode === 'B2B' ? 'b2b' : 'b2c'
  );
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [receiverCompany, setReceiverCompany] = useState('');
  const [receiverGstin, setReceiverGstin] = useState('');
  const [receiverEmail, setReceiverEmail] = useState('');
  const [deliveryAddress1, setDeliveryAddress1] = useState('');
  const [deliveryAddress2, setDeliveryAddress2] = useState('');
  const [landmark, setLandmark] = useState('');
  const [deliveryPincode, setDeliveryPincode] = useState(initialToPincode);
  const [deliveryCity, setDeliveryCity] = useState(initialCity);
  const [deliveryState, setDeliveryState] = useState(initialState);

  // Step 3: Package Details, Shipment Type, Payment Mode, Insurance
  const [shipmentCategory, setShipmentCategory] = useState<'document' | 'parcel' | 'b2b_freight'>(() =>
    navState.mode === 'B2B' ? 'b2b_freight' : 'parcel'
  );
  const [ewayBillNumber, setEwayBillNumber] = useState<string>('');

  // Single-box sync fields (preserved for backwards-compatibility & quick edit)
  const [deadWeight, setDeadWeight] = useState<string>(() =>
    navState.actualWeight ? String(navState.actualWeight) : '1.0'
  );
  const [pkgLength, setPkgLength] = useState<string>(() =>
    navState.lengthCm ? String(navState.lengthCm) : '20'
  );
  const [pkgWidth, setPkgWidth] = useState<string>(() =>
    navState.widthCm ? String(navState.widthCm) : '15'
  );
  const [pkgHeight, setPkgHeight] = useState<string>(() =>
    navState.heightCm ? String(navState.heightCm) : '10'
  );
  const [numPackages, setNumPackages] = useState<number>(1);
  const [invoiceValue, setInvoiceValue] = useState<string>(() =>
    navState.invoiceValue ? String(navState.invoiceValue) : '1000'
  );
  const [contentsDescription, setContentsDescription] = useState<string>('Apparel & Fashion Accessories');
  
  const [orderId] = useState(() => `ORD-${Date.now().toString().slice(-5)}`);
  const [paymentMode, setPaymentMode] = useState<'prepaid' | 'cod'>(() =>
    navState.paymentType?.toLowerCase() === 'cod' ? 'cod' : 'prepaid'
  );
  const [codAmount, setCodAmount] = useState(() =>
    navState.codAmount ? String(navState.codAmount) : ''
  );
  
  const [insuranceEnabled, setInsuranceEnabled] = useState(false);
  const [insuredValue, setInsuredValue] = useState('1000');

  // Multi-box Package List: Single source of truth for packages
  const [packages, setPackages] = useState<MultiPackageFormItem[]>([
    {
      id: 'pkg-1',
      packageNumber: 1,
      packageType: navState.mode === 'B2B' ? 'Carton' : 'Box',
      actualWeightKg: navState.actualWeight ? Number(navState.actualWeight) : 1.0,
      lengthCm: navState.lengthCm ? Number(navState.lengthCm) : 20,
      widthCm: navState.widthCm ? Number(navState.widthCm) : 15,
      heightCm: navState.heightCm ? Number(navState.heightCm) : 10,
      quantity: 1,
      packageContents: 'Apparel & Fashion Accessories',
    },
  ]);

  // Package Row Handlers - preserves all entered data across modes
  const handleUpdatePackage = (index: number, field: keyof MultiPackageFormItem, value: any) => {
    setPackages((prev) => {
      const copy = [...prev];
      if (!copy[index]) return prev;
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });

    // Synchronize legacy single-field state if modifying the primary package
    if (index === 0) {
      if (field === 'actualWeightKg') setDeadWeight(String(value));
      if (field === 'lengthCm') setPkgLength(String(value));
      if (field === 'widthCm') setPkgWidth(String(value));
      if (field === 'heightCm') setPkgHeight(String(value));
      if (field === 'quantity') setNumPackages(Math.max(1, Number(value) || 1));
    }
  };

  const handleAddPackage = () => {
    setPackages((prev) => [
      ...prev,
      {
        id: `pkg-${Date.now()}-${prev.length + 1}`,
        packageNumber: prev.length + 1,
        packageType: shipmentCategory === 'b2b_freight' ? 'Carton' : 'Box',
        actualWeightKg: 2.0,
        lengthCm: 30,
        widthCm: 25,
        heightCm: 20,
        quantity: 1,
        packageContents: contentsDescription || 'Commercial Cargo Goods',
      },
    ]);
  };

  const handleDuplicatePackage = (index: number) => {
    setPackages((prev) => {
      const target = prev[index];
      if (!target) return prev;
      const newItem: MultiPackageFormItem = {
        ...target,
        id: `pkg-${Date.now()}-${prev.length + 1}`,
        packageNumber: prev.length + 1,
      };
      return [...prev, newItem];
    });
  };

  const handleRemovePackage = (index: number) => {
    setPackages((prev) => {
      if (prev.length <= 1) return prev;
      const filtered = prev.filter((_, i) => i !== index);
      return filtered.map((item, i) => ({
        ...item,
        packageNumber: i + 1,
      }));
    });
  };

  const handleSelectShipmentType = (type: 'b2b_freight' | 'parcel' | 'document') => {
    setShipmentCategory(type);
    if (type === 'document') {
      setPackages([
        {
          id: 'pkg-doc-1',
          packageNumber: 1,
          packageType: 'Flyer',
          actualWeightKg: 0.5,
          lengthCm: 25,
          widthCm: 20,
          heightCm: 2,
          quantity: 1,
          packageContents: contentsDescription || 'Documents & Legal Papers',
        },
      ]);
    } else if (type === 'parcel') {
      if (packages.length === 0 || packages[0]?.packageType === 'Flyer') {
        setPackages([
          {
            id: 'pkg-1',
            packageNumber: 1,
            packageType: 'Box',
            actualWeightKg: 1.0,
            lengthCm: 20,
            widthCm: 15,
            heightCm: 10,
            quantity: 1,
            packageContents: contentsDescription || 'Apparel & Fashion Accessories',
          },
        ]);
      }
    } else if (type === 'b2b_freight') {
      if (packages[0]?.packageType === 'Flyer') {
        handleUpdatePackage(0, 'packageType', 'Carton');
        handleUpdatePackage(0, 'actualWeightKg', 2.0);
        handleUpdatePackage(0, 'lengthCm', 30);
        handleUpdatePackage(0, 'widthCm', 25);
        handleUpdatePackage(0, 'heightCm', 20);
      }
    }
  };

  // Small Summary: Total Boxes and Total Dead Weight (kg) for Seller UI
  const packageTotals = useMemo(() => {
    let totalBoxes = 0;
    let totalDeadWeightKg = 0;

    packages.forEach((pkg) => {
      const q = Math.max(1, Number(pkg.quantity) || 1);
      const w = Math.max(0, Number(pkg.actualWeightKg) || 0);
      totalBoxes += q;
      totalDeadWeightKg += w * q;
    });

    return {
      totalBoxes,
      totalDeadWeightKg: Math.round(totalDeadWeightKg * 100) / 100,
    };
  }, [packages]);

  // Step 4: Rate Comparison & Breakdown Modal
  const [selectedCourier, setSelectedCourier] = useState<EligibleCourierResult | null>(null);
  const [breakdownModalCourier, setBreakdownModalCourier] = useState<EligibleCourierResult | null>(null);
  const [b2bPricingResult, setB2bPricingResult] = useState<B2BRateCalculationResult | null>(null);
  const [b2bCompareResult, setB2bCompareResult] = useState<B2BCompareCouriersResult | null>(null);
  const [selectedB2BQuote, setSelectedB2BQuote] = useState<B2BCourierQuote | null>(null);
  const [breakdownModalQuote, setBreakdownModalQuote] = useState<B2BCourierQuote | null>(null);
  const [quoteValidationError, setQuoteValidationError] = useState<string | null>(null);
  const [isB2bCalculating, setIsB2bCalculating] = useState<boolean>(false);

  // Step 6: Label Format & Success Execution Result
  const [labelFormat, setLabelFormat] = useState<'thermal_4x6' | 'a4_sheet' | 'single' | 'bulk'>('thermal_4x6');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<{
    shipmentId: string;
    orderId: string;
    awbNumber: string;
    courierName: string;
    serviceName: string;
    amountPaid: number;
    packageCount: number;
  } | null>(null);

  // Selected Warehouse Object
  const currentWarehouse = useMemo(() => {
    return warehouses.find((w) => w.id === selectedWarehouseId) || null;
  }, [warehouses, selectedWarehouseId]);

  // Pincode Auto-Fill for Receiver with Exact Mapping & Circle State Fallback
  const handlePincodeChange = (pin: string) => {
    const cleanPin = pin.replace(/\D/g, '').slice(0, 6);
    setDeliveryPincode(cleanPin);
    if (cleanPin.length === 6) {
      if (PINCODE_MAP[cleanPin]) {
        setDeliveryCity(PINCODE_MAP[cleanPin].city);
        setDeliveryState(PINCODE_MAP[cleanPin].state);
      } else {
        const fallbackState = resolvePostalCircleState(cleanPin);
        if (fallbackState && !deliveryState) {
          setDeliveryState(fallbackState);
        }
      }
    }
  };

  // Authoritative background volumetric & chargeable calculation using standard rate-card divisor
  const packageMath = useMemo(() => {
    let totalActual = 0;
    let totalVolumetric = 0;
    let totalQty = 0;
    const SYSTEM_ADMIN_DEFAULT_DIVISOR = 5000;

    const calculatedRows = packages.map((pkg, idx) => {
      const q = Math.max(1, Number(pkg.quantity) || 1);
      const actPerUnit = Math.max(0, Number(pkg.actualWeightKg) || 0);
      const l = Math.max(0, Number(pkg.lengthCm) || 0);
      const w = Math.max(0, Number(pkg.widthCm) || 0);
      const h = Math.max(0, Number(pkg.heightCm) || 0);

      const rowActual = actPerUnit * q;
      const volPerUnit = (l * w * h) / SYSTEM_ADMIN_DEFAULT_DIVISOR;
      const rowVolumetric = volPerUnit * q;
      const rowChargeable = Math.max(rowActual, rowVolumetric);

      totalQty += q;
      totalActual += rowActual;
      totalVolumetric += rowVolumetric;

      return {
        id: pkg.id || `pkg-${idx + 1}`,
        packageNumber: pkg.packageNumber || idx + 1,
        packageType: pkg.packageType || 'Box',
        quantity: q,
        actualWeightKg: actPerUnit,
        rowActualWeightKg: Math.round(rowActual * 10) / 10,
        volumetricWeightKg: Math.round(volPerUnit * 10) / 10,
        rowVolumetricWeightKg: Math.round(rowVolumetric * 10) / 10,
        rowChargeableWeightKg: Math.round(rowChargeable * 10) / 10,
      };
    });

    const roundedActual = Math.round(totalActual * 10) / 10;
    const roundedVolumetric = Math.round(totalVolumetric * 10) / 10;
    const totalChargeable = Math.max(roundedActual, roundedVolumetric);
    const chargeableBasis: 'Dead Weight' | 'Volumetric Weight' =
      roundedActual >= roundedVolumetric ? 'Dead Weight' : 'Volumetric Weight';

    return {
      rows: calculatedRows,
      totalPackages: packages.length,
      totalUnitsCount: totalQty,
      totalActualWeightKg: roundedActual,
      totalVolumetricWeightKg: roundedVolumetric,
      totalChargeableWeightKg: Math.max(0.5, Math.round(totalChargeable * 10) / 10),
      chargeableBasis,
      divisorUsed: SYSTEM_ADMIN_DEFAULT_DIVISOR,
    };
  }, [packages]);

  // Eligible Couriers list via Centralized Rate Assignment Service
  const eligibleCouriers = useMemo(() => {
    if (!currentWarehouse || !deliveryPincode || deliveryPincode.length !== 6) return [];
    
    const mode = shipmentCategory === 'b2b_freight' ? 'B2B' : 'B2C';
    const list = CustomerRateAssignmentService.getEligibleCouriersForCustomer(
      tenantId,
      mode as 'B2B' | 'B2C',
      currentWarehouse.pincode as string,
      deliveryPincode,
      packageMath.totalChargeableWeightKg * 1000,
      paymentMode === 'cod' ? 'COD' : 'PREPAID',
      paymentMode === 'cod' ? Number(codAmount || 0) * 100 : 0
    );

    // Decorate couriers with rating, zone, and badges (Cheapest, Fastest, Recommended)
    if (list.length === 0) return [];

    const sortedByPrice = [...list].sort((a, b) => Number(a.customerPriceINR) - Number(b.customerPriceINR));
    const cheapestId = sortedByPrice[0]?.courierId;
    const fastestId = list.find((c) => (c.estimatedDeliveryDays as string)?.includes('1') || (c.estimatedDeliveryDays as string)?.includes('2'))?.courierId || list[0]?.courierId;

    return list.map((c) => ({
      ...c,
      rating: 4.8,
      zoneRoute: `${currentWarehouse.pincode.slice(0, 2)} → ${deliveryPincode.slice(0, 2)}`,
      isCheapest: c.courierId === cheapestId,
      isFastest: c.courierId === fastestId,
      isRecommended: c.courierId === cheapestId || c.courierId === fastestId,
    }));
  }, [tenantId, currentWarehouse, deliveryPincode, packageMath.totalChargeableWeightKg, paymentMode, codAmount, shipmentCategory]);

  // Calculate Price Breakdown Function
  const calculateDetailedBreakdown = (courier: EligibleCourierResult | null) => {
    if (!courier) return null;
    const baseFreight: number = Number(courier.customerPriceINR || 0);
    const fuelSurcharge = Math.round(baseFreight * 0.1 * 100) / 100;
    const docketCharge = 15.0;
    const fmCharge = 15.0;
    const codFee = paymentMode === 'cod' ? Math.max(40, Math.round(Number(codAmount || 0) * 0.015 * 100) / 100) : 0;
    const rovFee = insuranceEnabled ? Math.max(50, Math.round(Number(insuredValue || 0) * 0.005 * 100) / 100) : 0;
    const odaCharge = 0.0;
    const subtotal = baseFreight + fuelSurcharge + docketCharge + fmCharge + codFee + rovFee + odaCharge;
    const gst = Math.round(subtotal * 0.18 * 100) / 100;
    const totalPayable = Math.round((subtotal + gst) * 100) / 100;

    return {
      baseFreight,
      fuelSurcharge,
      docketCharge,
      fmCharge,
      codFee,
      rovFee,
      odaCharge,
      subtotal,
      gst,
      totalPayable,
    };
  };

  // Authoritative B2B Multi-Courier Comparison via Platform Pricing Engine
  useEffect(() => {
    if (currentStep === 4 && shipmentCategory === 'b2b_freight' && currentWarehouse?.pincode && deliveryPincode?.length === 6) {
      let isMounted = true;
      setIsB2bCalculating(true);
      setQuoteValidationError(null);

      AdminB2BRateService.compareB2BCouriers({
        originPincode: currentWarehouse.pincode as string,
        destinationPincode: deliveryPincode,
        deadWeightKg: packageTotals.totalDeadWeightKg || 20,
        boxes: packages.map((p) => ({
          lengthCm: Number(p.lengthCm) || 10,
          widthCm: Number(p.widthCm) || 10,
          heightCm: Number(p.heightCm) || 10,
          quantity: Number(p.quantity) || 1,
        })),
        invoiceValueMinor: Math.round(Number(invoiceValue || 0) * 100),
      })
        .then((res) => {
          if (!isMounted) return;
          setB2bCompareResult(res);

          if (res.success && res.quotes && res.quotes.length > 0) {
            const existingMatch = selectedB2BQuote
              ? res.quotes.find((q) => q.courierId === selectedB2BQuote.courierId && q.serviceId === selectedB2BQuote.serviceId)
              : null;
            const chosenQuote = existingMatch || res.quotes.find((q) => q.isRecommended) || res.quotes[0];

            setSelectedB2BQuote(chosenQuote);

            const b2bCourier: EligibleCourierResult = {
              courierId: chosenQuote.courierId,
              courierName: chosenQuote.courierName,
              serviceId: chosenQuote.serviceId,
              serviceName: chosenQuote.serviceName,
              mode: 'B2B',
              isDefault: true,
              rateCardId: chosenQuote.rateCardId,
              rateCardName: chosenQuote.rateCardName,
              rateCardVersion: 'v1.0',
              serviceable: true,
              reasonCode: 'SERVICEABLE',
              customerPriceINR: chosenQuote.finalPayableAmountINR,
              estimatedDeliveryDays: chosenQuote.estimatedDeliveryDays,
              rating: 4.8,
              reliabilityScore: '99.4% On-Time',
              zoneRoute: chosenQuote.zoneRoute,
              isCheapest: chosenQuote.isCheapest,
              isFastest: chosenQuote.isFastest,
              isRecommended: chosenQuote.isRecommended,
            };
            setSelectedCourier(b2bCourier);
          } else {
            setSelectedB2BQuote(null);
            setSelectedCourier(null);
          }
        })
        .catch((err) => {
          if (!isMounted) return;
          setB2bCompareResult({
            success: false,
            code: 'RATE_NOT_CONFIGURED',
            message: err?.message || 'Failed to contact pricing engine.',
            quotes: [],
          });
          setSelectedB2BQuote(null);
          setSelectedCourier(null);
        })
        .finally(() => {
          if (isMounted) setIsB2bCalculating(false);
        });

      return () => {
        isMounted = false;
      };
    }
  }, [currentStep, shipmentCategory, currentWarehouse?.pincode, deliveryPincode, packageTotals.totalDeadWeightKg, packages, invoiceValue]);

  const handleSelectB2BQuote = useCallback((quote: B2BCourierQuote) => {
    setSelectedB2BQuote(quote);
    setQuoteValidationError(null);
    const b2bCourier: EligibleCourierResult = {
      courierId: quote.courierId,
      courierName: quote.courierName,
      serviceId: quote.serviceId,
      serviceName: quote.serviceName,
      mode: 'B2B',
      isDefault: true,
      rateCardId: quote.rateCardId,
      rateCardName: quote.rateCardName,
      rateCardVersion: 'v1.0',
      serviceable: true,
      reasonCode: 'SERVICEABLE',
      customerPriceINR: quote.finalPayableAmountINR,
      estimatedDeliveryDays: quote.estimatedDeliveryDays,
      rating: 4.8,
      reliabilityScore: '99.4% On-Time',
      zoneRoute: quote.zoneRoute,
      isCheapest: quote.isCheapest,
      isFastest: quote.isFastest,
      isRecommended: quote.isRecommended,
    };
    setSelectedCourier(b2bCourier);
  }, []);

  const quoteBreakdown = useMemo(() => {
    if (shipmentCategory === 'b2b_freight') {
      if (!selectedB2BQuote) return null;
      const q = selectedB2BQuote;
      const otherCharges = (q.customerApplicableCharges || []).reduce((sum, c) => sum + (c.amountINR || 0), 0);
      return {
        quoteId: q.quoteId,
        expiresAt: q.expiresAt,
        baseFreight: q.customerFreightINR,
        fuelSurcharge: q.customerFuelSurchargeINR,
        docketCharge: q.customerDocketChargeINR,
        fmCharge: 0,
        codFee: 0,
        rovFee: 0,
        odaCharge: 0,
        otherCharges,
        subtotal: Math.round((q.customerFreightINR + q.customerFuelSurchargeINR + q.customerDocketChargeINR + otherCharges) * 100) / 100,
        gst: q.gstAmountINR,
        totalPayable: q.finalPayableAmountINR,
      };
    }
    return calculateDetailedBreakdown(selectedCourier);
  }, [shipmentCategory, selectedB2BQuote, selectedCourier, paymentMode, codAmount, insuranceEnabled, insuredValue]);

  // Auto-Save Draft to LocalStorage
  const handleSaveDraft = () => {
    const draftData = {
      selectedWarehouseId,
      receiverType,
      receiverName,
      receiverPhone,
      altPhone,
      receiverCompany,
      receiverGstin,
      receiverEmail,
      deliveryAddress1,
      deliveryAddress2,
      landmark,
      deliveryPincode,
      deliveryCity,
      deliveryState,
      shipmentCategory,
      deadWeight,
      pkgLength,
      pkgWidth,
      pkgHeight,
      numPackages,
      invoiceValue,
      contentsDescription,
      paymentMode,
      codAmount,
      insuranceEnabled,
      insuredValue,
      savedAt: new Date().toLocaleTimeString(),
    };
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData));
    setDraftSavedTime(new Date().toLocaleTimeString());
    setTimeout(() => setDraftSavedTime(null), 3000);
  };

  // Load Saved Draft on mount if available
  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.receiverType) setReceiverType(parsed.receiverType);
        if (parsed.receiverName) setReceiverName(parsed.receiverName);
        if (parsed.receiverPhone) setReceiverPhone(parsed.receiverPhone);
        if (parsed.altPhone) setAltPhone(parsed.altPhone);
        if (parsed.receiverCompany) setReceiverCompany(parsed.receiverCompany);
        if (parsed.receiverGstin) setReceiverGstin(parsed.receiverGstin);
        if (parsed.receiverEmail) setReceiverEmail(parsed.receiverEmail);
        if (parsed.deliveryAddress1) setDeliveryAddress1(parsed.deliveryAddress1);
        if (parsed.deliveryAddress2) setDeliveryAddress2(parsed.deliveryAddress2);
        if (parsed.landmark) setLandmark(parsed.landmark);
        if (parsed.deliveryPincode) setDeliveryPincode(parsed.deliveryPincode);
        if (parsed.deliveryCity) setDeliveryCity(parsed.deliveryCity);
        if (parsed.deliveryState) setDeliveryState(parsed.deliveryState);
        if (parsed.deadWeight) setDeadWeight(parsed.deadWeight);
      } catch (e) {
        // Ignore parse error
      }
    }
  }, []);

  const [isSavingWarehouse, setIsSavingWarehouse] = useState(false);
  const [addWhModalError, setAddWhModalError] = useState<string | null>(null);

  // Handle In-Flow New Warehouse Save
  const handleSaveInFlowWarehouse = async () => {
    setAddWhModalError(null);
    if (!newWhName.trim() || !newWhContact.trim() || !newWhPhone.trim() || !newWhAddress.trim() || !newWhPincode.trim()) {
      setAddWhModalError('Please fill in all required warehouse fields (*).');
      return;
    }
    if (!/^\d{6}$/.test(newWhPincode.trim())) {
      setAddWhModalError('Please enter a valid 6-digit Indian Pincode.');
      return;
    }

    try {
      setIsSavingWarehouse(true);
      const res = await CustomerWarehouseService.addWarehouseAsync({
        tenantId,
        warehouseName: newWhName.trim(),
        contactPerson: newWhContact.trim(),
        phone: newWhPhone.trim(),
        email: newWhEmail.trim(),
        addressLine1: newWhAddress.trim(),
        pincode: newWhPincode.trim(),
        city: newWhCity.trim(),
        state: newWhState.trim(),
        isDefault: true,
      });

      if (!res.success || !res.warehouse) {
        setAddWhModalError(res.message || 'Failed to save warehouse in database.');
        return;
      }

      // Reload real warehouses from Supabase to guarantee state consistency
      const updatedList = await CustomerWarehouseService.syncFromSupabase(tenantId);
      const activeList = (updatedList || []).filter((w) => w.status === 'ACTIVE');
      setWarehouses(activeList);
      setSelectedWarehouseId(res.warehouse.id);
      setIsAddWhModalOpen(false);

      // Reset Form
      setNewWhName('');
      setNewWhContact('');
      setNewWhPhone('');
      setNewWhEmail('');
      setNewWhAddress('');
      setNewWhPincode('110001');
      setNewWhCity('New Delhi');
      setNewWhState('Delhi');
    } catch (err: any) {
      setAddWhModalError(err?.message || 'Database error while saving warehouse.');
    } finally {
      setIsSavingWarehouse(false);
    }
  };

  // Step Validation Handlers
  const validateStep1 = (): boolean => {
    setFormError(null);
    if (!selectedWarehouseId || !currentWarehouse) {
      setFormError('Please select a valid pickup warehouse before continuing to Step 2.');
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    setFormError(null);

    // B2B Specific Validations
    if (receiverType === 'b2b') {
      if (!receiverCompany.trim()) {
        setFormError('Please enter Company / Business Name for B2B shipment.');
        return false;
      }
      if (receiverCompany.trim().length < 2) {
        setFormError('Company Name must be at least 2 characters.');
        return false;
      }
      if (receiverGstin.trim()) {
        const cleanGst = receiverGstin.trim().toUpperCase();
        const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        if (!gstRegex.test(cleanGst)) {
          setFormError('Please enter a valid 15-character Indian GSTIN (e.g. 29ABCDE1234F1Z5) or leave it blank.');
          return false;
        }
      }
    }

    // Name Validation
    if (!receiverName.trim()) {
      setFormError(receiverType === 'b2b' ? 'Please enter Contact Person Name.' : 'Please enter Customer / Receiver Name.');
      return false;
    }
    if (receiverName.trim().length < 2) {
      setFormError('Receiver / Contact Person Name must be at least 2 characters.');
      return false;
    }

    // Phone Validation (Indian 10-digit mobile)
    const cleanPhone = receiverPhone.trim().replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      setFormError('Please enter a valid 10-digit Indian primary mobile number.');
      return false;
    }
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setFormError('Primary mobile number must start with 6, 7, 8, or 9.');
      return false;
    }

    // Alternate Phone Validation (Optional)
    if (altPhone.trim()) {
      const cleanAlt = altPhone.trim().replace(/\D/g, '');
      if (cleanAlt.length !== 10 || !/^[6-9]\d{9}$/.test(cleanAlt)) {
        setFormError('Alternate phone must be a valid 10-digit Indian mobile number or left blank.');
        return false;
      }
    }

    // Email Validation (Optional)
    if (receiverEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(receiverEmail.trim())) {
        setFormError('Please enter a valid email address (e.g. rahul@example.com) or leave it blank.');
        return false;
      }
    }

    // Address Line 1 Validation
    if (!deliveryAddress1.trim()) {
      setFormError('Please enter Delivery Address Line 1.');
      return false;
    }
    if (deliveryAddress1.trim().length < 5) {
      setFormError('Delivery Address Line 1 must be at least 5 characters (Flat/House No, Building, Street).');
      return false;
    }

    // Delivery Pincode Validation
    const cleanPincode = deliveryPincode.trim().replace(/\D/g, '');
    if (!cleanPincode || cleanPincode.length !== 6) {
      setFormError('Please enter a valid 6-digit Indian delivery pincode.');
      return false;
    }

    // City & State Validations
    if (!deliveryCity.trim()) {
      setFormError('Please enter Delivery City.');
      return false;
    }

    if (!deliveryState.trim()) {
      setFormError('Please enter Delivery State.');
      return false;
    }

    return true;
  };

  const validateStep3 = (): boolean => {
    setFormError(null);

    if (!contentsDescription.trim()) {
      setFormError('Please enter Contents Description (e.g. Apparel, Electronics, Machinery Parts).');
      return false;
    }

    const val = Number(invoiceValue);
    if (isNaN(val) || val <= 0) {
      setFormError('Please enter a valid Declared Invoice Value greater than ₹0.');
      return false;
    }

    if (!packages || packages.length === 0) {
      setFormError('Please configure at least one package box.');
      return false;
    }

    for (let i = 0; i < packages.length; i++) {
      const p = packages[i];
      const pkgLabel = packages.length > 1 ? `Box #${p.packageNumber || i + 1}` : 'Package';

      const q = Number(p.quantity);
      if (isNaN(q) || q < 1 || !Number.isInteger(q)) {
        setFormError(`${pkgLabel}: Quantity must be a whole number of at least 1.`);
        return false;
      }

      const dw = Number(p.actualWeightKg);
      if (isNaN(dw) || dw <= 0) {
        setFormError(`${pkgLabel}: Dead Weight must be greater than 0 KG.`);
        return false;
      }

      const l = Number(p.lengthCm);
      if (isNaN(l) || l <= 0) {
        setFormError(`${pkgLabel}: Length must be greater than 0 CM.`);
        return false;
      }

      const w = Number(p.widthCm);
      if (isNaN(w) || w <= 0) {
        setFormError(`${pkgLabel}: Width must be greater than 0 CM.`);
        return false;
      }

      const h = Number(p.heightCm);
      if (isNaN(h) || h <= 0) {
        setFormError(`${pkgLabel}: Height must be greater than 0 CM.`);
        return false;
      }
    }

    if (paymentMode === 'cod') {
      const codVal = Number(codAmount);
      if (isNaN(codVal) || codVal <= 0) {
        setFormError('Please enter a valid COD Collectible Amount greater than ₹0.');
        return false;
      }
      if (codVal > val) {
        setFormError(`COD Collectible Amount (₹${codVal}) cannot exceed Declared Invoice Value (₹${val}).`);
        return false;
      }
    }

    return true;
  };

  const validateStep4 = (): boolean => {
    setFormError(null);
    setQuoteValidationError(null);
    if (shipmentCategory === 'b2b_freight') {
      if (b2bCompareResult?.code === 'RATE_NOT_CONFIGURED' || !b2bCompareResult?.success || !b2bCompareResult.quotes?.length) {
        setFormError('B2B Commercial Rate is not configured for this corridor (RATE_NOT_CONFIGURED). Real commercial rate cards must be configured by an administrator in the Admin Portal before booking.');
        return false;
      }
      if (!selectedB2BQuote) {
        setFormError('Please select an active B2B courier quote to proceed.');
        return false;
      }
      if (new Date(selectedB2BQuote.expiresAt).getTime() < Date.now()) {
        setQuoteValidationError('The selected B2B quote has expired (30-minute validity window). Please re-query courier rates.');
        setFormError('The selected quote has expired. Please re-query courier rates.');
        return false;
      }
    }
    if (!selectedCourier || Number(selectedCourier.customerPriceINR || 0) <= 0) {
      setFormError('Please select an active courier option with verified commercial rates to proceed.');
      return false;
    }
    return true;
  };

  const validateStep5 = (): boolean => {
    setFormError(null);
    if (!selectedCourier || !quoteBreakdown) return false;

    if (walletBalanceINR < quoteBreakdown.totalPayable) {
      setFormError(`Insufficient Wallet Balance. Required ₹${quoteBreakdown.totalPayable.toFixed(2)}, Available ₹${walletBalanceINR.toFixed(2)}. Please recharge your wallet.`);
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    if (currentStep === 3 && !validateStep3()) return;
    if (currentStep === 4 && !validateStep4()) return;
    if (currentStep === 5 && !validateStep5()) return;

    if (currentStep < 6) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Final Booking Execution
  const handleConfirmAndBook = async () => {
    if (!selectedCourier || !quoteBreakdown || !currentWarehouse) return;

    setIsSubmitting(true);
    setQuoteValidationError(null);

    try {
      // Revalidate B2B quote token on backend before booking or wallet debit
      if (shipmentCategory === 'b2b_freight' && selectedB2BQuote) {
        const valRes = await AdminB2BRateService.validateQuote({
          quoteId: selectedB2BQuote.quoteId,
          originPincode: (currentWarehouse.pincode as string || '').replace(/\D/g, ''),
          destinationPincode: deliveryPincode.trim().replace(/\D/g, ''),
          chargeableWeightKg: selectedB2BQuote.chargeableWeightKg,
        });

        if (!valRes.valid) {
          setIsSubmitting(false);
          const errMsg = valRes.message || 'Selected quote is no longer valid or has expired. Please re-query rates.';
          setQuoteValidationError(errMsg);
          alert(`Quote Validation Failed: ${errMsg}`);
          return;
        }
      }

      const modeStr = shipmentCategory === 'b2b_freight' ? 'b2b' : 'b2c';
      const result = await CustomerBookingService.bookShipmentWithWalletDebit({
        tenantId,
        orderId: orderId.trim(),
        quoteId: selectedB2BQuote?.quoteId,
        customerName: receiverName.trim(),
        customerPhone: receiverPhone.trim(),
        customerEmail: receiverEmail.trim(),
        shipmentType: modeStr as 'b2b' | 'b2c',
        pickupWarehouseId: currentWarehouse.id,
        pickupContactName: currentWarehouse.contactPerson as string,
        pickupPhone: currentWarehouse.phone as string,
        pickupAddressLine1: currentWarehouse.addressLine1 as string,
        pickupCity: currentWarehouse.city as string,
        pickupPincode: (currentWarehouse.pincode as string || '').replace(/\D/g, ''),
        deliveryContactName: receiverName.trim(),
        deliveryCompany: receiverCompany.trim(),
        deliveryPhone: receiverPhone.trim(),
        deliveryAddressLine1: deliveryAddress1.trim(),
        deliveryAddressLine2: deliveryAddress2.trim(),
        deliveryCity: deliveryCity.trim(),
        deliveryState: deliveryState.trim(),
        deliveryPincode: deliveryPincode.trim().replace(/\D/g, ''),
        invoiceNumber: `INV-${Date.now().toString().slice(-4)}`,
        invoiceDate: new Date().toISOString().split('T')[0],
        invoiceValueINR: Number(invoiceValue),
        paymentMode,
        codAmount: paymentMode === 'cod' ? Number(codAmount) : 0,
        insuranceEnabled,
        insuredValueINR: insuranceEnabled ? Number(insuredValue) : 0,
        packageType: shipmentCategory === 'document' ? 'Flyer' : 'Box',
        packages: packages.map((p) => {
          const safeDiv = 5000;
          const volPerUnit = Math.round(((p.lengthCm * p.widthCm * p.heightCm) / safeDiv) * 10) / 10;
          return {
            id: p.id,
            packageNumber: p.packageNumber,
            packageType: p.packageType,
            actualWeightKg: p.actualWeightKg,
            lengthCm: p.lengthCm,
            widthCm: p.widthCm,
            heightCm: p.heightCm,
            volumetricWeightKg: volPerUnit,
            chargeableWeightKg: Math.max(p.actualWeightKg, volPerUnit),
            quantity: p.quantity,
            packageContents: p.packageContents || contentsDescription,
          };
        }),
        actualWeightKg: packageMath.totalActualWeightKg,
        chargeableWeightKg: packageMath.totalChargeableWeightKg,
        courierId: selectedCourier.courierId,
        courierName: selectedCourier.courierName,
        serviceName: selectedCourier.serviceName as string,
        baseFreightINR: quoteBreakdown.baseFreight,
        fuelSurchargeINR: quoteBreakdown.fuelSurcharge,
        codFeeINR: quoteBreakdown.codFee,
        insuranceFeeINR: quoteBreakdown.rovFee,
        gstINR: quoteBreakdown.gst,
        shippingChargeINR: quoteBreakdown.totalPayable,
      });

      setIsSubmitting(false);

      if (result.success && result.shipmentId && result.awbNumber) {
        setBookingResult({
          shipmentId: result.shipmentId,
          orderId: orderId.trim(),
          awbNumber: result.awbNumber,
          courierName: selectedCourier.courierName,
          serviceName: selectedCourier.serviceName as string,
          amountPaid: quoteBreakdown.totalPayable,
          packageCount: packages.length,
        });
        logActivity('Shipment Creation', result.awbNumber, `Created shipment ${result.awbNumber} for order ${orderId.trim()} via ${selectedCourier.courierName}`);
        setCurrentStep(6);
      } else {
        alert(result.message || 'Shipment booking failed.');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      alert(err?.message || 'Error occurred during shipment creation.');
    }
  };

  const breadcrumbs = [
    { label: 'Merchant Portal', path: '/app' },
    { label: 'Shipment Creation Wizard', path: '/app/orders/create' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '1280px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* Page Header */}
      <PageHeader
        title="Shipment Creation Wizard"
        description="Guided 6-step shipment booking flow for B2C Express & B2B Freight."
        breadcrumbs={breadcrumbs}
        style={{ marginBottom: '0px' }}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {draftSavedTime && (
              <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: '600' }}>✓ Draft saved at {draftSavedTime}</span>
            )}
            <Button variant="outline" size="sm" leftIcon={<Save size={14} />} onClick={handleSaveDraft}>
              Save Draft
            </Button>
          </div>
        }
      />

      {formError && (
        <Alert variant="danger" title="Validation Warning">
          {formError}
        </Alert>
      )}

      {/* HORIZONTAL STEP WIZARD BAR */}
      <Card style={{ padding: '16px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', overflowX: 'auto', minWidth: 'max-content', width: '100%', WebkitOverflowScrolling: 'touch' }}>
          {WIZARD_STEPS.map((s) => {
            const isActive = currentStep === s.step;
            const isCompleted = currentStep > s.step;

            return (
              <div
                key={s.step}
                onClick={() => {
                  if (isCompleted) setCurrentStep(s.step);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  backgroundColor: isActive ? '#0284c7' : isCompleted ? '#f0f9ff' : 'transparent',
                  color: isActive ? '#ffffff' : isCompleted ? '#0284c7' : '#64748b',
                  fontWeight: isActive || isCompleted ? '700' : '500',
                  fontSize: '13px',
                  cursor: isCompleted ? 'pointer' : 'default',
                  whiteSpace: 'nowrap',
                  border: isCompleted ? '1px solid #bae6fd' : '1px solid transparent',
                }}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: isActive ? '#ffffff' : isCompleted ? '#0284c7' : '#cbd5e1',
                    color: isActive ? '#0284c7' : '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: '800',
                  }}
                >
                  {isCompleted ? <Check size={14} /> : s.step}
                </div>
                <span style={{ fontSize: '13px' }}>{s.label}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* WIZARD CONTENT AREA WITH DESKTOP STICKY SUMMARY SIDEBAR */}
      <div style={{ display: 'grid', gridTemplateColumns: currentStep < 6 ? '1fr 340px' : '1fr', gap: '20px' }}>
        
        {/* LEFT COLUMN: STEP FORM CONTENT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* STEP 1: PICKUP WAREHOUSE */}
          {currentStep === 1 && (
            <Card style={{ padding: '24px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building2 size={20} style={{ color: '#1d4ed8' }} />
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Step 1: Select Pickup Warehouse</h3>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Button variant="outline" size="sm" onClick={() => loadWarehouses()} disabled={isLoadingWarehouses} title="Refresh origin warehouses from MAXLINE database">
                    <RefreshCw size={13} style={{ transform: isLoadingWarehouses ? 'rotate(180deg)' : 'none', transition: 'transform 0.4s ease' }} />
                  </Button>
                  <Button variant="outline" size="sm" leftIcon={<Plus size={14} />} onClick={() => setIsAddWhModalOpen(true)}>
                    Add New Warehouse
                  </Button>
                </div>
              </div>

              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
                Select the origin dispatch warehouse where courier pickup agents will collect the package.
              </p>

              {/* Case 1: Loading State */}
              {isLoadingWarehouses ? (
                <div style={{ padding: '36px 16px', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#eff6ff', color: '#1d4ed8', marginBottom: '10px' }}>
                    <RefreshCw size={18} />
                  </div>
                  <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block' }}>Loading Origin Warehouses...</strong>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>Querying MAXLINE database for registered pickup facilities.</p>
                </div>
              ) : warehouseLoadError ? (
                /* Case 2: Error State */
                <div style={{ padding: '28px 16px', textAlign: 'center', backgroundColor: '#fef2f2', borderRadius: '10px', border: '1px solid #fecaca' }}>
                  <AlertTriangle size={30} style={{ color: '#dc2626', margin: '0 auto 8px' }} />
                  <strong style={{ fontSize: '14px', color: '#991b1b', display: 'block' }}>Database Connection Error</strong>
                  <p style={{ fontSize: '12px', color: '#b91c1c', margin: '4px auto 14px', maxWidth: '440px', lineHeight: 1.4 }}>
                    {warehouseLoadError}
                  </p>
                  <Button variant="outline" size="sm" onClick={loadWarehouses} style={{ borderColor: '#fca5a5', color: '#991b1b', backgroundColor: '#ffffff' }}>
                    Retry Query
                  </Button>
                </div>
              ) : warehouses.length === 0 ? (
                /* Case 3: Empty State */
                <div style={{ padding: '36px 16px', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
                  <Building2 size={36} style={{ color: '#94a3b8', margin: '0 auto 8px' }} />
                  <strong style={{ fontSize: '15px', color: '#0f172a', display: 'block' }}>No Pickup Warehouses Found</strong>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: '4px auto 16px', maxWidth: '420px', lineHeight: 1.4 }}>
                    Your authenticated MAXLINE merchant account currently has zero registered pickup warehouses. Please add an origin location to continue.
                  </p>
                  <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => setIsAddWhModalOpen(true)} style={{ backgroundColor: '#1d4ed8', borderColor: '#1d4ed8', fontWeight: '700' }}>
                    Add Origin Warehouse
                  </Button>
                </div>
              ) : (
                /* Case 4: Populated Warehouses Grid */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                  {warehouses.map((wh) => {
                    const isSelected = selectedWarehouseId === wh.id;
                    return (
                      <div
                        key={wh.id}
                        onClick={() => setSelectedWarehouseId(wh.id)}
                        style={{
                          padding: '16px',
                          borderRadius: '10px',
                          border: isSelected ? '2px solid #1d4ed8' : '1px solid #e2e8f0',
                          backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          boxShadow: isSelected ? '0 4px 12px rgba(29, 78, 216, 0.12)' : 'none',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ fontSize: '15px', color: isSelected ? '#1d4ed8' : '#0f172a' }}>{wh.warehouseName}</strong>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {wh.isDefault && <Badge variant="brand">Default Hub</Badge>}
                            {isSelected && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', fontSize: '10px', fontWeight: '800', color: '#1d4ed8', backgroundColor: '#dbeafe', padding: '1px 6px', borderRadius: '10px' }}>
                                <Check size={11} /> Selected
                              </span>
                            )}
                          </div>
                        </div>

                        <div style={{ fontSize: '12px', color: '#475569' }}>
                          {wh.addressLine1}, {wh.city}, {wh.state} - <strong>{wh.pincode}</strong>
                        </div>

                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                          Contact: <strong>{wh.contactPerson}</strong> ({wh.phone})
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          )}

          {/* STEP 2: RECEIVER DETAILS */}
          {currentStep === 2 && (
            <Card style={{ padding: '24px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px', marginBottom: '18px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Home size={20} style={{ color: '#2563eb' }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.01em' }}>
                      Step 2: Receiver / Consignee Details
                    </h3>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
                      Specify delivery destination and consignee contact information
                    </p>
                  </div>
                </div>

                <Badge variant={receiverType === 'b2b' ? 'warning' : 'brand'} size="sm">
                  {receiverType === 'b2b' ? 'Commercial B2B Consignee' : 'Individual B2C Consignee'}
                </Badge>
              </div>

              {/* B2C vs B2B Consignee Type Toggle Tabs */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '8px' }}>
                  Receiver Destination Workflow *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setReceiverType('b2c');
                      setFormError(null);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: receiverType === 'b2c' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                      backgroundColor: receiverType === 'b2c' ? '#eff6ff' : '#ffffff',
                      color: receiverType === 'b2c' ? '#1d4ed8' : '#475569',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      backgroundColor: receiverType === 'b2c' ? '#dbeafe' : '#f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <User size={16} style={{ color: receiverType === 'b2c' ? '#1d4ed8' : '#64748b' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: receiverType === 'b2c' ? '#1e3a8a' : '#0f172a' }}>
                        B2C Consignee
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        Individual buyer or residential delivery
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setReceiverType('b2b');
                      setFormError(null);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: receiverType === 'b2b' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                      backgroundColor: receiverType === 'b2b' ? '#eff6ff' : '#ffffff',
                      color: receiverType === 'b2b' ? '#1d4ed8' : '#475569',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      backgroundColor: receiverType === 'b2b' ? '#dbeafe' : '#f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Building2 size={16} style={{ color: receiverType === 'b2b' ? '#1d4ed8' : '#64748b' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: receiverType === 'b2b' ? '#1e3a8a' : '#0f172a' }}>
                        B2B Consignee
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        Registered enterprise, distributor, or store
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* B2B Commercial Fields (Rendered only when B2B is active) */}
              {receiverType === 'b2b' && (
                <div style={{
                  padding: '14px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '14px',
                }}>
                  <Input
                    label="Company / Enterprise Name *"
                    placeholder="e.g. Apex Retail Private Limited"
                    value={receiverCompany}
                    onChange={(e) => setReceiverCompany(e.target.value)}
                  />
                  <div>
                    <Input
                      label="Recipient GSTIN (Optional)"
                      placeholder="e.g. 29ABCDE1234F1Z5"
                      value={receiverGstin}
                      onChange={(e) => setReceiverGstin(e.target.value.toUpperCase().trim())}
                      maxLength={15}
                    />
                    <span style={{ fontSize: '10px', color: '#64748b', marginTop: '2px', display: 'block' }}>
                      15-character GSTIN for B2B tax invoice and input credit
                    </span>
                  </div>
                </div>
              )}

              {/* Contact Person & Communication Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                <Input
                  label={receiverType === 'b2b' ? 'Contact Person Name *' : 'Receiver / Customer Name *'}
                  placeholder="e.g. Rahul Sharma"
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                />
                <Input
                  label="Primary Mobile Number *"
                  placeholder="10-digit mobile number"
                  value={receiverPhone}
                  onChange={(e) => setReceiverPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  maxLength={10}
                />
                <Input
                  label="Alternate Mobile (Optional)"
                  placeholder="Optional 2nd phone number"
                  value={altPhone}
                  onChange={(e) => setAltPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  maxLength={10}
                />
                <Input
                  label="Email Address (Optional)"
                  type="email"
                  placeholder="e.g. rahul@example.com"
                  value={receiverEmail}
                  onChange={(e) => setReceiverEmail(e.target.value)}
                />
              </div>

              {/* Delivery Address & Location Section */}
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <Input
                  label="Delivery Address Line 1 *"
                  placeholder="Flat/Door No, Building Name, Street / Commercial Complex"
                  value={deliveryAddress1}
                  onChange={(e) => setDeliveryAddress1(e.target.value)}
                />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                  <Input
                    label="Address Line 2 (Optional)"
                    placeholder="Area name, Phase, Sector"
                    value={deliveryAddress2}
                    onChange={(e) => setDeliveryAddress2(e.target.value)}
                  />
                  <Input
                    label="Landmark / Locality (Optional)"
                    placeholder="e.g. Near Metro Station / Tech Park"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                  />
                </div>

                {/* Pincode, City, State Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                  <div>
                    <Input
                      label="Delivery Pincode *"
                      placeholder="6-digit Pincode (e.g. 560038)"
                      value={deliveryPincode}
                      onChange={(e) => handlePincodeChange(e.target.value)}
                      maxLength={6}
                    />
                    {deliveryPincode.length === 6 && (
                      <span style={{ fontSize: '11px', color: PINCODE_MAP[deliveryPincode] ? '#16a34a' : '#0284c7', marginTop: '3px', display: 'block', fontWeight: '600' }}>
                        {PINCODE_MAP[deliveryPincode]
                          ? `✓ Pincode mapped: ${PINCODE_MAP[deliveryPincode].city}`
                          : resolvePostalCircleState(deliveryPincode)
                            ? `📍 Region: ${resolvePostalCircleState(deliveryPincode)}`
                            : '6-digit Indian Pincode'}
                      </span>
                    )}
                  </div>

                  <Input
                    label="City *"
                    placeholder="e.g. Bengaluru"
                    value={deliveryCity}
                    onChange={(e) => setDeliveryCity(e.target.value)}
                  />

                  <Input
                    label="State *"
                    placeholder="e.g. Karnataka"
                    value={deliveryState}
                    onChange={(e) => setDeliveryState(e.target.value)}
                  />
                </div>
              </div>
            </Card>
          )}

          {/* STEP 3: PACKAGE DETAILS */}
          {currentStep === 3 && (
            <Card style={{ padding: '24px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
                    <Package size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                      Step 3: Package Details & Payment Mode
                    </h3>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
                      Enter physical package dimensions, dead weight, and invoice payment terms
                    </p>
                  </div>
                </div>
                <Badge variant="brand">
                  {shipmentCategory === 'b2b_freight' ? '🏢 B2B Cargo' : shipmentCategory === 'document' ? '📄 Document' : '📦 B2C Parcel'}
                </Badge>
              </div>

              {/* 1. Single Shipment Type Selector (B2B Cargo, B2C Parcel, Document) */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', display: 'block', marginBottom: '8px' }}>
                  Shipment Type *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  {[
                    {
                      id: 'b2b_freight' as const,
                      label: 'B2B Cargo',
                      subtitle: 'Multi-box commercial shipments & cartons',
                      icon: Building2,
                    },
                    {
                      id: 'parcel' as const,
                      label: 'B2C Parcel',
                      subtitle: 'Standard retail & single delivery parcel',
                      icon: Package,
                    },
                    {
                      id: 'document' as const,
                      label: 'Document',
                      subtitle: 'Envelopes, legal deeds & letters (0.5 kg)',
                      icon: FileText,
                    },
                  ].map((cat) => {
                    const isSelected = shipmentCategory === cat.id;
                    const CatIcon = cat.icon;
                    return (
                      <div
                        key={cat.id}
                        onClick={() => handleSelectShipmentType(cat.id)}
                        style={{
                          padding: '14px 16px',
                          borderRadius: '10px',
                          border: isSelected ? '2px solid #0284c7' : '1px solid #cbd5e1',
                          backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px',
                        }}
                      >
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            backgroundColor: isSelected ? '#dbeafe' : '#f1f5f9',
                            color: isSelected ? '#0284c7' : '#64748b',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <CatIcon size={18} />
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '700', color: isSelected ? '#0369a1' : '#0f172a' }}>
                            {cat.label}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', lineHeight: 1.3 }}>
                            {cat.subtitle}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Simplified Box Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>
                    Box Details *
                  </label>
                  {packages.length > 1 && (
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                      {packages.length} Box Sizes Configured
                    </span>
                  )}
                </div>

                {packages.map((pkg, idx) => (
                  <div
                    key={pkg.id || idx}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '14px 16px',
                      backgroundColor: '#f8fafc',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    {packages.length > 1 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>
                          Box Size #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemovePackage(idx)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'none',
                            border: 'none',
                            color: '#dc2626',
                            fontSize: '11px',
                            fontWeight: '600',
                            cursor: 'pointer',
                          }}
                        >
                          <Trash2 size={13} /> Remove
                        </button>
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                      <Input
                        label="Quantity *"
                        type="number"
                        min="1"
                        step="1"
                        value={String(pkg.quantity || 1)}
                        onChange={(e) => handleUpdatePackage(idx, 'quantity', Math.max(1, parseInt(e.target.value, 10) || 1))}
                      />

                      <Input
                        label="Dead Wt / Box (kg) *"
                        type="number"
                        min="0.05"
                        step="0.1"
                        placeholder="e.g. 1.5"
                        value={String(pkg.actualWeightKg || '')}
                        onChange={(e) => handleUpdatePackage(idx, 'actualWeightKg', parseFloat(e.target.value) || 0)}
                      />

                      <Input
                        label="Length (cm) *"
                        type="number"
                        min="1"
                        step="1"
                        placeholder="cm"
                        value={String(pkg.lengthCm || '')}
                        onChange={(e) => handleUpdatePackage(idx, 'lengthCm', parseFloat(e.target.value) || 0)}
                      />

                      <Input
                        label="Width (cm) *"
                        type="number"
                        min="1"
                        step="1"
                        placeholder="cm"
                        value={String(pkg.widthCm || '')}
                        onChange={(e) => handleUpdatePackage(idx, 'widthCm', parseFloat(e.target.value) || 0)}
                      />

                      <Input
                        label="Height (cm) *"
                        type="number"
                        min="1"
                        step="1"
                        placeholder="cm"
                        value={String(pkg.heightCm || '')}
                        onChange={(e) => handleUpdatePackage(idx, 'heightCm', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                ))}

                {/* One Add Another Box Size button */}
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddPackage}
                    style={{ fontSize: '12px', fontWeight: '700', borderColor: '#0284c7', color: '#0284c7' }}
                  >
                    <Plus size={14} style={{ marginRight: '6px' }} /> Add Another Box Size
                  </Button>
                </div>
              </div>

              {/* 3. Small Summary: Total Boxes & Total Dead Weight (kg) */}
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '12px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      TOTAL BOXES
                    </span>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginTop: '1px' }}>
                      {packageTotals.totalBoxes} {packageTotals.totalBoxes === 1 ? 'Box' : 'Boxes'}
                    </div>
                  </div>

                  <div style={{ borderLeft: '1px solid #cbd5e1', paddingLeft: '24px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      TOTAL DEAD WEIGHT
                    </span>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginTop: '1px' }}>
                      {packageTotals.totalDeadWeightKg} KG
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  Physical scale weight of consignment
                </div>
              </div>

              {/* 4. Shipment Information */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                  Consignment & Payment Terms
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                  <Input
                    label="Contents Description *"
                    placeholder="e.g. Apparel, Electronics, Spare Parts, Books"
                    value={contentsDescription}
                    onChange={(e) => setContentsDescription(e.target.value)}
                  />
                  <Input
                    label="Declared Invoice Value (₹) *"
                    type="number"
                    min="1"
                    placeholder="e.g. 2500"
                    value={invoiceValue}
                    onChange={(e) => setInvoiceValue(e.target.value)}
                  />
                </div>

                {/* Payment Mode Selection */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '8px' }}>
                    Payment Mode *
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div
                      onClick={() => setPaymentMode('prepaid')}
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        border: paymentMode === 'prepaid' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                        backgroundColor: paymentMode === 'prepaid' ? '#f0f9ff' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <strong style={{ color: paymentMode === 'prepaid' ? '#0369a1' : '#0f172a', fontSize: '13px' }}>
                        Prepaid
                      </strong>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        Shipping freight debited from wallet balance
                      </div>
                    </div>

                    <div
                      onClick={() => setPaymentMode('cod')}
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        border: paymentMode === 'cod' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                        backgroundColor: paymentMode === 'cod' ? '#f0f9ff' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <strong style={{ color: paymentMode === 'cod' ? '#0369a1' : '#0f172a', fontSize: '13px' }}>
                        Cash On Delivery (COD)
                      </strong>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        Collectible from consignee upon delivery
                      </div>
                    </div>
                  </div>

                  {paymentMode === 'cod' && (
                    <div style={{ marginTop: '12px', maxWidth: '320px' }}>
                      <Input
                        label="COD Collectible Amount (₹) *"
                        type="number"
                        min="1"
                        placeholder="Amount to collect from customer"
                        value={codAmount}
                        onChange={(e) => setCodAmount(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                {/* Progressive Disclosure: E-Way Bill Number when value >= ₹50,000 or B2B Cargo */}
                {(Number(invoiceValue) >= 50000 || shipmentCategory === 'b2b_freight') && (
                  <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 14px' }}>
                    <div style={{ maxWidth: '360px' }}>
                      <Input
                        label="E-Way Bill Number (Optional)"
                        placeholder="12-digit E-Way Bill Number"
                        value={ewayBillNumber}
                        onChange={(e) => setEwayBillNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                        maxLength={12}
                      />
                      <span style={{ fontSize: '11px', color: '#64748b', marginTop: '3px', display: 'block' }}>
                        Recommended in India for consignments with invoice value exceeding ₹50,000
                      </span>
                    </div>
                  </div>
                )}

                {/* Transit Insurance Toggle */}
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', color: '#0f172a' }}>
                    <input
                      type="checkbox"
                      checked={insuranceEnabled}
                      onChange={(e) => setInsuranceEnabled(e.target.checked)}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <span>Add Transit Insurance Coverage (ROV Cover)</span>
                  </label>

                  {insuranceEnabled && (
                    <div style={{ marginTop: '10px', maxWidth: '320px' }}>
                      <Input
                        label="Insured Declared Value (₹)"
                        type="number"
                        min="1"
                        value={insuredValue}
                        onChange={(e) => setInsuredValue(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* STEP 4: RATE COMPARISON */}
          {currentStep === 4 && (
            <Card style={{ padding: '24px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                <Truck size={20} style={{ color: '#0284c7' }} />
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Step 4: Select Courier Partner</h3>
              </div>

              {shipmentCategory === 'b2b_freight' ? (
                isB2bCalculating ? (
                  <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <RefreshCw size={26} className="animate-spin" style={{ margin: '0 auto 10px auto', color: '#0284c7' }} />
                    <p style={{ margin: 0, fontWeight: 600, color: '#334155' }}>Querying authoritative B2B commercial rates from server pricing engine...</p>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Comparing active carrier rate cards, zone matrices, volumetric divisors, and customer markups.</span>
                  </div>
                ) : (b2bCompareResult?.code === 'RATE_NOT_CONFIGURED' || !b2bCompareResult?.success || !b2bCompareResult.quotes?.length) ? (
                  <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#b45309', fontWeight: 'bold', fontSize: '16px' }}>
                      <AlertTriangle size={22} />
                      <span>B2B Commercial Rate Unavailable (RATE_NOT_CONFIGURED)</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: '#92400e', lineHeight: 1.5 }}>
                      No active commercial B2B rate cards are configured in the system for route <strong>{currentWarehouse?.pincode} → {deliveryPincode}</strong>.
                      MAXLINE policy strictly prevents generating unverified, placeholder, or mock shipping prices.
                      Please contact platform administration to activate verified commercial rate cards for this corridor.
                    </p>
                    {b2bCompareResult?.unserviceableCouriers && b2bCompareResult.unserviceableCouriers.length > 0 && (
                      <div style={{ marginTop: '4px', padding: '10px 12px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #fef3c7' }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#92400e', display: 'block', marginBottom: '4px' }}>Carrier Corridor Diagnostics:</span>
                        {b2bCompareResult.unserviceableCouriers.map((u, i) => (
                          <div key={i} style={{ fontSize: '12px', color: '#78350f', marginTop: '2px' }}>
                            • <strong>{u.courierName}</strong>: {u.reason}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {/* AI Smart B2B Recommendation Summary Strip */}
                    {(() => {
                      const quotes = b2bCompareResult?.quotes || [];
                      const cheapestQuote = quotes.find((q) => q.isCheapest);
                      // Requirement 5: Fastest only displayed if supported by verified courier transit-time data
                      const fastestQuote = quotes.find((q) => q.isFastest && q.hasVerifiedTransitData);
                      const recommendedQuote = quotes.find((q) => q.isRecommended) || quotes[0];

                      return (
                        <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <Zap size={20} style={{ color: '#2563eb' }} />
                            </div>
                            <div>
                              <strong style={{ fontSize: '14px', color: '#1e3a8a', display: 'block' }}>🤖 AI Smart B2B Courier Recommendation Engine</strong>
                              <span style={{ fontSize: '12px', color: '#1e40af' }}>
                                Recommended Pick: <strong>{recommendedQuote?.courierName}</strong> ({recommendedQuote?.serviceName} • {recommendedQuote?.isCheapest ? 'Lowest configured selling price' : 'Recommended courier partner'})
                              </span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {cheapestQuote && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSelectB2BQuote(cheapestQuote)}
                                style={{ fontSize: '11px', borderColor: '#93c5fd', color: '#1d4ed8', fontWeight: '700', backgroundColor: '#ffffff' }}
                              >
                                🏆 Auto-Select Best Value (₹{Number(cheapestQuote.finalPayableAmountINR).toFixed(2)})
                              </Button>
                            )}
                            {fastestQuote && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleSelectB2BQuote(fastestQuote)}
                                style={{ fontSize: '11px', backgroundColor: '#2563eb', borderColor: '#2563eb', fontWeight: '700' }}
                              >
                                ⚡ Auto-Select Fastest ({fastestQuote.estimatedDeliveryDays})
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Server Quote Security & Corridor Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', padding: '10px 14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#475569' }}>
                      <div>
                        Corridor: <strong>{currentWarehouse?.city} ({currentWarehouse?.pincode}) → {deliveryCity} ({deliveryPincode})</strong> • Chargeable Weight: <strong>{selectedB2BQuote?.chargeableWeightKg || b2bCompareResult.chargeableWeightKg} KG</strong>
                      </div>
                      {selectedB2BQuote && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: '600' }}>● Server-Verified Commercial Rates</span>
                          <Badge variant="brand">Quote ID: {selectedB2BQuote.quoteId}</Badge>
                        </div>
                      )}
                    </div>

                    {quoteValidationError && (
                      <Alert variant="danger" title="Quote Validation Warning">
                        {quoteValidationError}
                      </Alert>
                    )}

                    {/* B2B Courier Comparison Cards Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '16px' }}>
                      {(b2bCompareResult?.quotes || []).map((quote) => {
                        const isSelected = selectedB2BQuote?.quoteId === quote.quoteId;

                        return (
                          <div
                            key={quote.quoteId}
                            style={{
                              padding: '16px',
                              borderRadius: '12px',
                              border: isSelected ? '2px solid #0284c7' : '1px solid #cbd5e1',
                              backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              gap: '12px',
                              boxShadow: isSelected ? '0 4px 14px rgba(2, 132, 199, 0.12)' : 'none',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <div>
                              {/* Header & Badges */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <strong style={{ fontSize: '16px', color: '#0f172a' }}>{quote.courierName}</strong>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Star size={12} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
                                  <span style={{ fontSize: '11px', fontWeight: '700' }}>4.8</span>
                                </div>
                              </div>

                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                                {quote.isCheapest && <Badge variant="success"><Tag size={10} style={{ marginRight: '2px' }} /> Cheapest</Badge>}
                                {quote.isFastest && quote.hasVerifiedTransitData && (
                                  <Badge variant="brand"><Zap size={10} style={{ marginRight: '2px' }} /> Fastest</Badge>
                                )}
                                {quote.isRecommended && <Badge variant="info"><ThumbsUp size={10} style={{ marginRight: '2px' }} /> Recommended</Badge>}
                              </div>

                              <div style={{ fontSize: '12px', color: '#475569' }}>
                                Service: <strong>{quote.serviceName}</strong> | Route: <strong>{quote.zoneRoute}</strong>
                              </div>
                              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                                {quote.hasVerifiedTransitData && quote.estimatedDeliveryDays ? (
                                  <>Transit Time: <strong>{quote.estimatedDeliveryDays}</strong></>
                                ) : (
                                  <>Commercial Service: <strong>{quote.serviceName}</strong></>
                                )}
                              </div>

                              {/* Key Metrics Pill Grid */}
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', margin: '12px 0 6px 0', padding: '8px', backgroundColor: isSelected ? '#ffffff' : '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '11px' }}>
                                <div>
                                  <span style={{ color: '#64748b', display: 'block' }}>Chargeable</span>
                                  <strong>{quote.chargeableWeightKg} KG</strong>
                                </div>
                                <div>
                                  <span style={{ color: '#64748b', display: 'block' }}>Freight</span>
                                  <strong>₹{quote.customerFreightINR.toFixed(2)}</strong>
                                </div>
                                <div>
                                  <span style={{ color: '#64748b', display: 'block' }}>GST ({quote.gstPercent}%)</span>
                                  <strong>₹{quote.gstAmountINR.toFixed(2)}</strong>
                                </div>
                              </div>
                            </div>

                            {/* Price & Action Buttons */}
                            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Final Customer Price</span>
                                <strong style={{ fontSize: '20px', color: '#0284c7' }}>₹ {quote.finalPayableAmountINR.toFixed(2)}</strong>
                              </div>

                              <div style={{ display: 'flex', gap: '6px' }}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setBreakdownModalQuote(quote)}
                                  style={{ fontSize: '11px', padding: '4px 8px' }}
                                >
                                  View Breakdown
                                </Button>

                                <Button
                                  variant={isSelected ? 'primary' : 'outline'}
                                  size="sm"
                                  onClick={() => handleSelectB2BQuote(quote)}
                                  style={{ fontSize: '11px', padding: '4px 10px', backgroundColor: isSelected ? '#0284c7' : 'transparent' }}
                                >
                                  {isSelected ? '✓ Selected' : 'Select'}
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )
              ) : eligibleCouriers.length === 0 ? (
                <Alert variant="warning" title="No Configured Couriers">
                  No couriers available for pickup pin {currentWarehouse?.pincode} to delivery pin {deliveryPincode}.
                </Alert>
              ) : (
                <>
                  {/* AI SMART RECOMMENDATION SUMMARY STRIP */}
                  {(() => {
                    const cheapestCourier = eligibleCouriers.find((c) => c.isCheapest);
                    const fastestCourier = eligibleCouriers.find((c) => c.isFastest);
                    const recommendedCourier = eligibleCouriers.find((c) => c.isRecommended) || eligibleCouriers[0];

                    return (
                      <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Zap size={20} style={{ color: '#2563eb' }} />
                          </div>
                          <div>
                            <strong style={{ fontSize: '14px', color: '#1e3a8a', display: 'block' }}>🤖 AI Smart Courier Recommendation Engine</strong>
                            <span style={{ fontSize: '12px', color: '#1e40af' }}>
                              Recommended Pick: <strong>{recommendedCourier?.courierName as string}</strong> ({recommendedCourier?.reliabilityScore as string || '98.4% On-Time'} • Best cost-to-speed balance).
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {cheapestCourier && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedCourier(cheapestCourier)}
                              style={{ fontSize: '11px', borderColor: '#93c5fd', color: '#1d4ed8', fontWeight: '700', backgroundColor: '#ffffff' }}
                            >
                              🏆 Auto-Select Best Value (₹{Number(cheapestCourier.customerPriceINR).toFixed(2)})
                            </Button>
                          )}
                          {fastestCourier && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => setSelectedCourier(fastestCourier)}
                              style={{ fontSize: '11px', backgroundColor: '#2563eb', borderColor: '#2563eb', fontWeight: '700' }}
                            >
                              ⚡ Auto-Select Fastest ({fastestCourier.estimatedDeliveryDays as string})
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                  {eligibleCouriers.map((courier) => {
                    const isSelected = selectedCourier?.courierId === courier.courierId;
                    const price = Number(courier.customerPriceINR || 0);

                    return (
                      <div
                        key={courier.courierId}
                        style={{
                          padding: '16px',
                          borderRadius: '12px',
                          border: isSelected ? '2px solid #0284c7' : '1px solid #cbd5e1',
                          backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '12px',
                          boxShadow: isSelected ? '0 4px 12px rgba(2,132,199,0.12)' : 'none',
                        }}
                      >
                        <div>
                          {/* Courier Header & Badges */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <strong style={{ fontSize: '16px', color: '#0f172a' }}>{courier.courierName as string}</strong>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Star size={12} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
                              <span style={{ fontSize: '11px', fontWeight: '700' }}>{courier.rating}</span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                            {courier.isCheapest && <Badge variant="success"><Tag size={10} style={{ marginRight: '2px' }} /> Cheapest</Badge>}
                            {courier.isFastest && <Badge variant="brand"><Zap size={10} style={{ marginRight: '2px' }} /> Fastest</Badge>}
                            {courier.isRecommended && <Badge variant="info"><ThumbsUp size={10} style={{ marginRight: '2px' }} /> Recommended</Badge>}
                          </div>

                          <div style={{ fontSize: '12px', color: '#475569' }}>
                            Service: <strong>{courier.serviceName as string}</strong> | Route: <strong>{courier.zoneRoute}</strong>
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                            Expected Delivery: <strong>{courier.estimatedDeliveryDays as string}</strong>
                          </div>
                        </div>

                        {/* Price & Action Buttons */}
                        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Base Rate</span>
                            <strong style={{ fontSize: '18px', color: '#0284c7' }}>₹ {price.toFixed(2)}</strong>
                          </div>

                          <div style={{ display: 'flex', gap: '6px' }}>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setBreakdownModalCourier(courier)}
                              style={{ fontSize: '11px', padding: '4px 8px' }}
                            >
                              View Breakdown
                            </Button>

                            <Button
                              variant={isSelected ? 'primary' : 'outline'}
                              size="sm"
                              onClick={() => setSelectedCourier(courier)}
                              style={{ fontSize: '11px', padding: '4px 10px', backgroundColor: isSelected ? '#0284c7' : 'transparent' }}
                            >
                              {isSelected ? '✓ Selected' : 'Select'}
                            </Button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </>
              )}
            </Card>
          )}

          {/* STEP 5: REVIEW & CONFIRM */}
          {currentStep === 5 && (
            <Card style={{ padding: '24px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                <CheckCircle2 size={20} style={{ color: '#0284c7' }} />
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Step 5: Review & Confirm Booking</h3>
              </div>

              {/* Summary Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                {/* Pickup Summary */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong style={{ color: '#0284c7', textTransform: 'uppercase', fontSize: '11px' }}>PICKUP DETAILS</strong>
                    <button onClick={() => setCurrentStep(1)} style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '11px', cursor: 'pointer', fontWeight: '700' }}>Edit</button>
                  </div>
                  <div style={{ fontWeight: '700', color: '#0f172a' }}>{currentWarehouse?.warehouseName}</div>
                  <div style={{ color: '#475569' }}>{currentWarehouse?.addressLine1}, {currentWarehouse?.city} - {currentWarehouse?.pincode}</div>
                  <div style={{ color: '#64748b' }}>Contact: {currentWarehouse?.contactPerson} ({currentWarehouse?.phone})</div>
                </div>

                {/* Receiver Summary */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong style={{ color: '#0284c7', textTransform: 'uppercase', fontSize: '11px' }}>RECEIVER DETAILS</strong>
                      <Badge variant={receiverType === 'b2b' ? 'warning' : 'brand'} size="sm">
                        {receiverType === 'b2b' ? 'B2B Business' : 'B2C Individual'}
                      </Badge>
                    </div>
                    <button onClick={() => setCurrentStep(2)} style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '11px', cursor: 'pointer', fontWeight: '700' }}>Edit</button>
                  </div>
                  {receiverType === 'b2b' && receiverCompany && (
                    <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '13px', marginBottom: '2px' }}>
                      {receiverCompany} {receiverGstin ? `(GSTIN: ${receiverGstin})` : ''}
                    </div>
                  )}
                  <div style={{ fontWeight: '700', color: '#0f172a' }}>{receiverName} ({receiverPhone}){altPhone ? ` / ${altPhone}` : ''}</div>
                  <div style={{ color: '#475569', marginTop: '2px' }}>
                    {deliveryAddress1}{deliveryAddress2 ? `, ${deliveryAddress2}` : ''}{landmark ? `, Near ${landmark}` : ''}, {deliveryCity}, {deliveryState} - <strong>{deliveryPincode}</strong>
                  </div>
                  {receiverEmail && <div style={{ color: '#64748b', marginTop: '2px' }}>{receiverEmail}</div>}
                </div>
              </div>

              {/* Package & Courier Review */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ color: '#0284c7', textTransform: 'uppercase', fontSize: '11px' }}>PACKAGE & COURIER SPECS</strong>
                    <Badge variant="brand">
                      {packages.length > 1 ? `Multi-Box (${packages.length} Types, ${packageMath.totalUnitsCount} Units)` : 'Single Parcel'}
                    </Badge>
                  </div>
                  <button onClick={() => setCurrentStep(3)} style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '11px', cursor: 'pointer', fontWeight: '700' }}>Edit</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px', color: '#334155', marginBottom: packages.length > 1 ? '12px' : '0' }}>
                  <div>Selected Courier: <strong>{selectedCourier?.courierName} ({selectedCourier?.serviceName})</strong></div>
                  {shipmentCategory === 'b2b_freight' && selectedB2BQuote && (
                    <div>Server Quote ID: <strong style={{ fontFamily: 'monospace', color: '#0284c7' }}>{selectedB2BQuote.quoteId}</strong></div>
                  )}
                  {shipmentCategory === 'b2b_freight' && selectedB2BQuote && (
                    <div>Corridor Route: <strong>{selectedB2BQuote.zoneRoute}</strong></div>
                  )}
                  <div>Total Units: <strong>{packageMath.totalUnitsCount} {packageMath.totalUnitsCount === 1 ? 'Box' : 'Boxes'}</strong></div>
                  <div>Total Dead Weight: <strong>{packageMath.totalActualWeightKg} KG</strong></div>
                  <div>Est. Chargeable Wt: <strong>{selectedB2BQuote?.chargeableWeightKg || packageMath.totalChargeableWeightKg} KG</strong></div>
                  <div>Payment Mode: <strong>{paymentMode.toUpperCase()} {paymentMode === 'cod' ? `(₹ ${codAmount})` : ''}</strong></div>
                  <div>Transit Insurance: <strong>{insuranceEnabled ? `Enabled (₹ ${insuredValue})` : 'Disabled'}</strong></div>
                  <div>Invoice Value: <strong>₹ {invoiceValue}</strong></div>
                  <div>Contents: <strong>{contentsDescription}</strong></div>
                </div>

                {/* Multi-Box Table in Step 5 Review */}
                {packages.length > 1 && (
                  <div style={{ marginTop: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Multi-Box Breakdown:</span>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f8fafc', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
                            <th style={{ padding: '6px 8px' }}>#</th>
                            <th style={{ padding: '6px 8px' }}>Type</th>
                            <th style={{ padding: '6px 8px' }}>Qty</th>
                            <th style={{ padding: '6px 8px' }}>Dead Wt/Unit</th>
                            <th style={{ padding: '6px 8px' }}>Dimensions (L×W×H)</th>
                            <th style={{ padding: '6px 8px' }}>Row Chargeable</th>
                          </tr>
                        </thead>
                        <tbody>
                          {packages.map((p, i) => {
                            const rowMath = packageMath.rows[i] || { rowChargeableWeightKg: 0 };
                            return (
                              <tr key={p.id || i} style={{ borderBottom: '1px solid #f1f5f9', color: '#1e293b' }}>
                                <td style={{ padding: '6px 8px', fontWeight: '700' }}>#{p.packageNumber || i + 1}</td>
                                <td style={{ padding: '6px 8px' }}>{p.packageType || 'Box'}</td>
                                <td style={{ padding: '6px 8px', fontWeight: '700' }}>{p.quantity}</td>
                                <td style={{ padding: '6px 8px' }}>{p.actualWeightKg} KG</td>
                                <td style={{ padding: '6px 8px' }}>{p.lengthCm}×{p.widthCm}×{p.heightCm} cm</td>
                                <td style={{ padding: '6px 8px', fontWeight: '700', color: '#0284c7' }}>{rowMath.rowChargeableWeightKg} KG</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

            </Card>
          )}

          {/* STEP 6: LABEL & SUCCESS */}
          {currentStep === 6 && (
            <Card style={{ padding: '32px', backgroundColor: '#ffffff', border: '2px solid #16a34a', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                <CheckCircle2 size={36} style={{ color: '#16a34a' }} />
              </div>

              <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                Shipment Booked Successfully!
              </h2>
              <p style={{ fontSize: '13px', color: '#475569', marginTop: '4px' }}>
                AWB generated and shipment registered on courier network.
              </p>

              {bookingResult && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', margin: '24px 0', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>ORDER ID</span>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>{bookingResult.orderId}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>AWB NUMBER</span>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: '#0284c7', fontFamily: 'monospace' }}>{bookingResult.awbNumber}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>COURIER PARTNER</span>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{bookingResult.courierName}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>FREIGHT CHARGE</span>
                    <div style={{ fontSize: '15px', fontWeight: '800', color: '#16a34a' }}>₹ {bookingResult.amountPaid.toFixed(2)}</div>
                  </div>
                </div>
              )}

              {/* Thermal Label Selection Controls */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginBottom: '24px', backgroundColor: '#ffffff', textAlign: 'left' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '8px' }}>
                  Select Label Print Format *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                  <button
                    onClick={() => setLabelFormat('thermal_4x6')}
                    style={{
                      padding: '10px',
                      borderRadius: '6px',
                      border: labelFormat === 'thermal_4x6' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                      backgroundColor: labelFormat === 'thermal_4x6' ? '#f0f9ff' : '#ffffff',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                    }}
                  >
                    🏷️ 4x6 Thermal Label
                  </button>

                  <button
                    onClick={() => setLabelFormat('a4_sheet')}
                    style={{
                      padding: '10px',
                      borderRadius: '6px',
                      border: labelFormat === 'a4_sheet' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                      backgroundColor: labelFormat === 'a4_sheet' ? '#f0f9ff' : '#ffffff',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                    }}
                  >
                    📄 A4 Sheet Format
                  </button>

                  <button
                    onClick={() => setLabelFormat('single')}
                    style={{
                      padding: '10px',
                      borderRadius: '6px',
                      border: labelFormat === 'single' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                      backgroundColor: labelFormat === 'single' ? '#f0f9ff' : '#ffffff',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                    }}
                  >
                    🔖 Single Sticker
                  </button>

                  <button
                    onClick={() => setLabelFormat('bulk')}
                    style={{
                      padding: '10px',
                      borderRadius: '6px',
                      border: labelFormat === 'bulk' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                      backgroundColor: labelFormat === 'bulk' ? '#f0f9ff' : '#ffffff',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                    }}
                  >
                    📑 Bulk Label Sheet
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <Button
                  variant="primary"
                  leftIcon={<Printer size={16} />}
                  onClick={() => navigate(`/app/shipments/${bookingResult?.shipmentId || 'shp-demo'}/label`)}
                  style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}
                >
                  Print Label ({labelFormat.replace('_', ' ').toUpperCase()})
                </Button>

                <Button
                  variant="outline"
                  leftIcon={<Download size={16} />}
                  onClick={() => {
                    const awb = bookingResult?.awbNumber || 'AWB-LIVE-1001';
                    const element = document.createElement('a');
                    const file = new Blob([`SHIPPING LABEL DOCUMENT\nAWB: ${awb}\nOrder ID: ${bookingResult?.orderId || 'ORD-1001'}\nCourier: ${bookingResult?.courierName || 'Delhivery Surface'}\nDate: ${new Date().toLocaleDateString()}`], { type: 'text/plain' });
                    element.href = URL.createObjectURL(file);
                    element.download = `Shipping-Label-${awb}.pdf`;
                    document.body.appendChild(element);
                    element.click();
                    document.body.removeChild(element);
                  }}
                >
                  Download Label PDF
                </Button>

                <Button
                  variant="outline"
                  leftIcon={<FileText size={16} />}
                  onClick={() => alert(`Downloading GST Shipping Invoice...`)}
                >
                  Download Invoice
                </Button>

                <Button
                  variant="secondary"
                  leftIcon={<RotateCcw size={16} />}
                  onClick={() => window.location.reload()}
                >
                  Create New Shipment
                </Button>
              </div>
            </Card>
          )}

          {/* STEP WIZARD NAVIGATION FOOTER BUTTONS */}
          {currentStep < 6 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
              <Button
                variant="outline"
                onClick={handlePrevStep}
                disabled={currentStep === 1 || isSubmitting}
                leftIcon={<ArrowLeft size={16} />}
              >
                Back
              </Button>

              {currentStep < 5 ? (
                <Button
                  variant="primary"
                  onClick={handleNextStep}
                  disabled={currentStep === 1 && (!selectedWarehouseId || !currentWarehouse || isLoadingWarehouses)}
                  rightIcon={<ArrowRight size={16} />}
                  style={{
                    backgroundColor: currentStep === 1 && (!selectedWarehouseId || !currentWarehouse || isLoadingWarehouses) ? '#94a3b8' : '#1d4ed8',
                    borderColor: currentStep === 1 && (!selectedWarehouseId || !currentWarehouse || isLoadingWarehouses) ? '#94a3b8' : '#1d4ed8',
                    cursor: currentStep === 1 && (!selectedWarehouseId || !currentWarehouse || isLoadingWarehouses) ? 'not-allowed' : 'pointer',
                    fontWeight: '700',
                  }}
                  title={currentStep === 1 && (!selectedWarehouseId || !currentWarehouse) ? 'Please select a valid pickup warehouse to continue' : undefined}
                >
                  Continue to Step {currentStep + 1}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={handleConfirmAndBook}
                  disabled={isSubmitting || (quoteBreakdown ? walletBalanceINR < quoteBreakdown.totalPayable : false)}
                  isLoading={isSubmitting}
                  leftIcon={<Wallet size={16} />}
                  style={{ backgroundColor: '#1d4ed8', borderColor: '#1d4ed8', fontWeight: '800' }}
                >
                  Confirm & Book Shipment ({quoteBreakdown ? formatCurrency(quoteBreakdown.totalPayable) : ''})
                </Button>
              )}
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: DESKTOP STICKY BOOKING SUMMARY SIDEBAR */}
        {currentStep < 6 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Card style={{ padding: '16px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', position: 'sticky', top: '80px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: '0 0 12px 0', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                Booking Summary
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748b' }}>Origin Hub:</span>
                  <strong style={{ color: '#0f172a' }}>
                    {currentWarehouse
                      ? `${currentWarehouse.city || currentWarehouse.warehouseName} (${currentWarehouse.pincode})`
                      : '—'}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748b' }}>Destination:</span>
                  <strong style={{ color: '#0f172a' }}>
                    {deliveryPincode
                      ? `${deliveryCity || 'Destination'} (${deliveryPincode})`
                      : '—'}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748b' }}>Total Boxes:</span>
                  <strong style={{ color: '#0f172a' }}>
                    {packageTotals.totalBoxes} {packageTotals.totalBoxes === 1 ? 'Box' : 'Boxes'}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748b' }}>Total Dead Weight:</span>
                  <strong style={{ color: '#0f172a' }}>
                    {packageTotals.totalDeadWeightKg} KG
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748b' }}>Payment Mode:</span>
                  <strong style={{ color: '#0f172a' }}>
                    {paymentMode ? paymentMode.toUpperCase() : '—'}
                  </strong>
                </div>

                {selectedCourier && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #e2e8f0', paddingTop: '6px' }}>
                    <span style={{ color: '#64748b' }}>Courier Selected:</span>
                    <strong style={{ color: '#0284c7' }}>{selectedCourier.courierName}</strong>
                  </div>
                )}

                {quoteBreakdown && (
                  <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px', marginTop: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b' }}>
                      <span>Base Freight:</span>
                      <span>₹ {quoteBreakdown.baseFreight.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                      <span>GST (18%):</span>
                      <span>₹ {quoteBreakdown.gst.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: '800', color: '#0284c7', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #f1f5f9' }}>
                      <span>Total Payable:</span>
                      <span>₹ {quoteBreakdown.totalPayable.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {/* Wallet Balance Widget */}
                <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', marginTop: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                    <span style={{ color: '#64748b' }}>Wallet Balance:</span>
                    <strong style={{ color: walletBalanceINR < (quoteBreakdown?.totalPayable || 0) ? '#dc2626' : '#16a34a' }}>
                      ₹ {walletBalanceINR.toFixed(2)}
                    </strong>
                  </div>
                </div>

              </div>
            </Card>
          </div>
        )}

      </div>

      {/* RATE BREAKDOWN MODAL */}
      {breakdownModalCourier && (
        <Modal
          isOpen={!!breakdownModalCourier}
          onClose={() => setBreakdownModalCourier(null)}
          title={`Rate Breakdown — ${breakdownModalCourier.courierName}`}
        >
          {(() => {
            const b = calculateDetailedBreakdown(breakdownModalCourier);
            if (!b) return null;
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>Base Freight Charge:</span>
                  <strong>₹ {b.baseFreight.toFixed(2)}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>Fuel Surcharge (10%):</span>
                  <span>₹ {b.fuelSurcharge.toFixed(2)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>Docket & Documentation:</span>
                  <span>₹ {b.docketCharge.toFixed(2)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>First Mile (FM) Collection:</span>
                  <span>₹ {b.fmCharge.toFixed(2)}</span>
                </div>

                {b.codFee > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                    <span style={{ color: '#64748b' }}>COD Collection Fee:</span>
                    <span>₹ {b.codFee.toFixed(2)}</span>
                  </div>
                )}

                {b.rovFee > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                    <span style={{ color: '#64748b' }}>Transit Insurance (ROV Cover):</span>
                    <span>₹ {b.rovFee.toFixed(2)}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>Subtotal Charges:</span>
                  <strong>₹ {b.subtotal.toFixed(2)}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>GST (18%):</span>
                  <span>₹ {b.gst.toFixed(2)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#f0f9ff', padding: '10px', borderRadius: '6px', fontSize: '15px', fontWeight: '800', color: '#0284c7', marginTop: '4px' }}>
                  <span>Final Payable Amount:</span>
                  <span>₹ {b.totalPayable.toFixed(2)}</span>
                </div>

                <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="primary"
                    onClick={() => {
                      setSelectedCourier(breakdownModalCourier);
                      setBreakdownModalCourier(null);
                    }}
                    style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}
                  >
                    Select This Courier (₹ {b.totalPayable.toFixed(2)})
                  </Button>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}

      {/* B2B RATE BREAKDOWN MODAL */}
      {breakdownModalQuote && (
        <Modal
          isOpen={!!breakdownModalQuote}
          onClose={() => setBreakdownModalQuote(null)}
          title={`Rate Breakdown — ${breakdownModalQuote.courierName} (${breakdownModalQuote.serviceName})`}
        >
          {(() => {
            const q = breakdownModalQuote;
            const otherCharges = (q.customerApplicableCharges || []).reduce((sum, c) => sum + (c.amountINR || 0), 0);
            const subtotal = Math.round((q.customerFreightINR + q.customerFuelSurchargeINR + q.customerDocketChargeINR + otherCharges) * 100) / 100;

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                <div style={{ padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '11px', color: '#475569' }}>
                  <div><strong>Server Quote ID:</strong> <span style={{ fontFamily: 'monospace', color: '#0284c7' }}>{q.quoteId}</span></div>
                  <div><strong>Service:</strong> {q.serviceName} • <strong>Route:</strong> {q.zoneRoute}</div>
                  <div><strong>Chargeable Weight:</strong> {q.chargeableWeightKg} KG</div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>Base Freight ({q.chargeableWeightKg} KG @ ₹{q.customerRatePerKgINR.toFixed(2)}/KG):</span>
                  <strong>₹ {q.customerFreightINR.toFixed(2)}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>Fuel Surcharge ({q.customerFuelSurchargePercent}%):</span>
                  <span>₹ {q.customerFuelSurchargeINR.toFixed(2)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>Docket & Documentation:</span>
                  <span>₹ {q.customerDocketChargeINR.toFixed(2)}</span>
                </div>

                {q.customerApplicableCharges && q.customerApplicableCharges.length > 0 && (
                  q.customerApplicableCharges.map((c, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                      <span style={{ color: '#64748b' }}>{c.name}:</span>
                      <span>₹ {c.amountINR.toFixed(2)}</span>
                    </div>
                  ))
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>Subtotal Charges:</span>
                  <strong>₹ {subtotal.toFixed(2)}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>GST ({q.gstPercent}%):</span>
                  <span>₹ {q.gstAmountINR.toFixed(2)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#f0f9ff', padding: '10px', borderRadius: '6px', fontSize: '15px', fontWeight: '800', color: '#0284c7', marginTop: '4px' }}>
                  <span>Final Payable Selling Amount:</span>
                  <span>₹ {q.finalPayableAmountINR.toFixed(2)}</span>
                </div>

                <div style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic', marginTop: '2px' }}>
                  * This quote is cryptographically verified by the server pricing engine and valid for 30 minutes from generation.
                </div>

                <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <Button variant="outline" onClick={() => setBreakdownModalQuote(null)}>
                    Close
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => {
                      handleSelectB2BQuote(q);
                      setBreakdownModalQuote(null);
                    }}
                    style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}
                  >
                    Select This Courier (₹ {q.finalPayableAmountINR.toFixed(2)})
                  </Button>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}

      {/* IN-FLOW ADD WAREHOUSE MODAL DIALOG */}
      {isAddWhModalOpen && (
        <Modal
          isOpen={isAddWhModalOpen}
          onClose={() => { if (!isSavingWarehouse) setIsAddWhModalOpen(false); }}
          title="Add New Pickup Warehouse Location"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {addWhModalError && (
              <div style={{ padding: '8px 12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '12px', color: '#991b1b' }}>
                {addWhModalError}
              </div>
            )}
            <Input label="Warehouse Name *" placeholder="e.g. Okhla Logistics Hub" value={newWhName} onChange={(e) => setNewWhName(e.target.value)} />
            <Input label="Contact Person Name *" placeholder="e.g. Suresh Kumar" value={newWhContact} onChange={(e) => setNewWhContact(e.target.value)} />
            <Input label="Phone Number *" placeholder="+91 98765 43210" value={newWhPhone} onChange={(e) => setNewWhPhone(e.target.value)} />
            <Input label="Email Address (Optional)" placeholder="warehouse@domain.com" value={newWhEmail} onChange={(e) => setNewWhEmail(e.target.value)} />
            <Input label="Address Line 1 *" placeholder="Plot 42, Industrial Area" value={newWhAddress} onChange={(e) => setNewWhAddress(e.target.value)} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <Input label="City *" value={newWhCity} onChange={(e) => setNewWhCity(e.target.value)} />
              <Input label="State *" value={newWhState} onChange={(e) => setNewWhState(e.target.value)} />
              <Input
                label="Pincode *"
                value={newWhPincode}
                onChange={(e) => {
                  const val = e.target.value;
                  setNewWhPincode(val);
                  if (val.length === 6 && PINCODE_MAP[val]) {
                    setNewWhCity(PINCODE_MAP[val].city);
                    setNewWhState(PINCODE_MAP[val].state);
                  }
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
              <button
                type="button"
                onClick={() => {
                  setIsAddWhModalOpen(false);
                  navigate('/app/warehouses');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#1d4ed8',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: 0,
                }}
              >
                Open Full Warehouse Manager <ExternalLink size={12} />
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <Button variant="ghost" disabled={isSavingWarehouse} onClick={() => setIsAddWhModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSaveInFlowWarehouse}
                  isLoading={isSavingWarehouse}
                  disabled={isSavingWarehouse}
                  style={{ backgroundColor: '#1d4ed8', borderColor: '#1d4ed8', fontWeight: '700' }}
                >
                  Save & Select Warehouse
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};
