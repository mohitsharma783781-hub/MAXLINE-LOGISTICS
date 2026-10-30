import { CustomerBookingService, type CustomerBookingInput } from './customerBookingService';
import { CustomerRateAssignmentService } from './customerRateAssignmentService';
import { WalletService } from '../mocks/wallet.mock';

export interface BulkUploadRecord extends Record<string, unknown> {
  id: string;
  bulkUploadId: string;
  tenantId: string;
  fileName: string;
  uploadDate: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  successfulShipments: number;
  failedShipments: number;
  status: 'COMPLETED' | 'COMPLETED_WITH_ERRORS' | 'FAILED' | 'PROCESSING';
  createdBy: string;
}

export interface BulkOrderImportRow extends Record<string, unknown> {
  rowId: number;
  orderId: string;
  customerName: string;
  mobile: string;
  address: string;
  pincode: string;
  city: string;
  state: string;
  productName: string;
  quantity: number;
  invoiceValue: number;
  paymentMode: 'COD' | 'PREPAID';
  weight: number;
  length: number;
  width: number;
  height: number;
  warehouse: string;
  shipmentType: 'B2B' | 'B2C';
  isValid: boolean;
  validationError?: string;
  assignedCourier?: string;
  generatedAwb?: string;
}

export interface BulkImportSummary {
  bulkUploadId: string;
  totalRows: number;
  uniqueOrdersCount: number;
  validRowsCount: number;
  invalidRowsCount: number;
  totalCodValueINR: number;
  totalActualWeightKg: number;
  estimatedFreightINR: number;
  estimatedGstINR: number;
  estimatedTotalPayableINR: number;
}

// B2C CSV Template
export const B2C_BULK_CSV_TEMPLATE = `orderId,customerName,mobile,address,pincode,city,state,productName,quantity,invoiceValue,paymentMode,weight,length,width,height,warehouse
ORD-2026-9001,Amit Verma,9810234102,"Flat 402, Green Enclave, Sector 62",201301,Noida,Uttar Pradesh,Wireless Earbuds,1,1499,COD,0.5,15,10,8,MUM-WH-01
ORD-2026-9002,Pooja Hegde,9920188201,"House 12, MG Road, Indiranagar",560038,Bengaluru,Karnataka,Running Shoes,1,2999,PREPAID,1.2,25,20,12,DEL-WH-01
ORD-2026-9003,Rohan Sharma,9871109283,"Plot 88, Cyber City, Phase 2",122002,Gurugram,Haryana,Smart Watch,2,4500,COD,0.8,18,14,10,DEL-WH-01`;

// B2B CSV Template
export const B2B_BULK_CSV_TEMPLATE = `orderId,customerName,mobile,address,pincode,city,state,productName,quantity,invoiceValue,paymentMode,weight,length,width,height,warehouse
B2B-2026-8001,Acme Electronics Pvt Ltd,9819920192,"Unit 401, MIDC Industrial Estate, Andheri East",400093,Mumbai,Maharashtra,Circuit Board Assemblies,10,45000,PREPAID,12.5,45,35,28,MUM-WH-01
B2B-2026-8002,Vanguard Retail Corp,9820011992,"Building B, Logistics Hub, Bhiwandi",421302,Thane,Maharashtra,Apparel Cartons Batch A,25,85000,COD,35.0,60,40,40,MUM-WH-01`;

const BULK_UPLOAD_HISTORY: BulkUploadRecord[] = [
  {
    id: 'blk-rec-101',
    bulkUploadId: 'BULK-20260828-001',
    tenantId: 'tenant-demo-01',
    fileName: 'B2C_Festive_Orders_Batch_Aug28.csv',
    uploadDate: '2026-08-28 11:30 AM',
    totalRows: 25,
    validRows: 24,
    invalidRows: 1,
    successfulShipments: 24,
    failedShipments: 0,
    status: 'COMPLETED_WITH_ERRORS',
    createdBy: 'Merchant Operations Agent',
  },
  {
    id: 'blk-rec-102',
    bulkUploadId: 'BULK-20260825-002',
    tenantId: 'tenant-demo-01',
    fileName: 'B2B_Wholesale_Dispatch_Aug25.xlsx',
    uploadDate: '2026-08-25 16:45 PM',
    totalRows: 10,
    validRows: 10,
    invalidRows: 0,
    successfulShipments: 10,
    failedShipments: 0,
    status: 'COMPLETED',
    createdBy: 'Merchant Operations Agent',
  },
];

export const BulkOrderService = {
  getUploadHistory: (tenantId = 'tenant-demo-01'): BulkUploadRecord[] => {
    return BULK_UPLOAD_HISTORY.filter((b) => b.tenantId === tenantId);
  },

  getBulkMetrics: (tenantId = 'tenant-demo-01') => {
    const history = BULK_UPLOAD_HISTORY.filter((b) => b.tenantId === tenantId);
    const totalUploaded = history.reduce((acc, h) => acc + h.totalRows, 0);
    const totalCreated = history.reduce((acc, h) => acc + h.successfulShipments, 0);
    const totalFailed = history.reduce((acc, h) => acc + h.invalidRows + h.failedShipments, 0);

    return {
      ordersUploaded: totalUploaded + 120,
      ordersCreated: totalCreated + 115,
      ordersFailed: totalFailed + 5,
      labelsGenerated: totalCreated + 110,
      manifestsGenerated: history.length + 8,
    };
  },

  // Parse CSV text with strict Pre-Upload Validation Engine
  parseAndValidateCsv: (csvText: string, tenantId = 'tenant-demo-01'): { rows: BulkOrderImportRow[]; summary: BulkImportSummary } => {
    const bulkUploadId = `BULK-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
    const lines = csvText.trim().split('\n').filter((l) => l.trim().length > 0);
    if (lines.length <= 1) {
      return {
        rows: [],
        summary: {
          bulkUploadId,
          totalRows: 0,
          uniqueOrdersCount: 0,
          validRowsCount: 0,
          invalidRowsCount: 0,
          totalCodValueINR: 0,
          totalActualWeightKg: 0,
          estimatedFreightINR: 0,
          estimatedGstINR: 0,
          estimatedTotalPayableINR: 0,
        },
      };
    }

    const dataLines = lines.slice(1);
    const rows: BulkOrderImportRow[] = [];
    const seenOrderIds = new Set<string>();

    dataLines.forEach((line, index) => {
      const cols = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
      const cleanCols = cols.map((c) => c.replace(/^"|"$/g, '').trim());

      const orderId = cleanCols[0] || `ORD-2026-${index + 9000}`;
      const customerName = cleanCols[1] || '';
      const mobile = cleanCols[2] || '';
      const address = cleanCols[3] || '';
      const pincode = cleanCols[4] || '';
      const city = cleanCols[5] || 'Mumbai';
      const state = cleanCols[6] || 'Maharashtra';
      const productName = cleanCols[7] || 'General Merchandise';
      const quantity = parseInt(cleanCols[8]) || 1;
      const invoiceValue = parseFloat(cleanCols[9]) || 1000;
      const rawPayMode = (cleanCols[10] || 'COD').toUpperCase();
      const paymentMode: 'COD' | 'PREPAID' = rawPayMode === 'PREPAID' ? 'PREPAID' : 'COD';
      const weight = parseFloat(cleanCols[11]) || 0.5;
      const length = parseFloat(cleanCols[12]) || 20;
      const width = parseFloat(cleanCols[13]) || 15;
      const height = parseFloat(cleanCols[14]) || 10;
      const warehouse = cleanCols[15] || 'MUM-WH-01';
      const shipmentType: 'B2B' | 'B2C' = orderId.toUpperCase().includes('B2B') || weight > 10 ? 'B2B' : 'B2C';

      let isValid = true;
      let validationError = '';

      // Strict Pre-Upload Validation Rules
      if (!customerName) {
        isValid = false;
        validationError = 'Customer / Consignee name missing';
      } else if (!mobile || !/^\d{10}$/.test(mobile.replace(/\D/g, ''))) {
        isValid = false;
        validationError = 'Invalid 10-digit mobile number';
      } else if (!address || address.length < 5) {
        isValid = false;
        validationError = 'Address line 1 missing or too short';
      } else if (!/^\d{6}$/.test(pincode)) {
        isValid = false;
        validationError = 'Invalid 6-digit Indian Pincode';
      } else if (weight <= 0) {
        isValid = false;
        validationError = 'Weight must be > 0 KG';
      } else if (paymentMode === 'COD' && invoiceValue <= 0) {
        isValid = false;
        validationError = 'Invalid COD invoice value';
      } else if (seenOrderIds.has(orderId)) {
        isValid = false;
        validationError = `Duplicate Order ID (${orderId}) in file`;
      }

      seenOrderIds.add(orderId);

      rows.push({
        rowId: index + 1,
        orderId,
        customerName,
        mobile,
        address,
        pincode,
        city,
        state,
        productName,
        quantity,
        invoiceValue,
        paymentMode,
        weight,
        length,
        width,
        height,
        warehouse,
        shipmentType,
        isValid,
        validationError,
        assignedCourier: isValid ? 'Delhivery Surface' : undefined,
      });
    });

    const validRows = rows.filter((r) => r.isValid);
    const totalActualWeightKg = validRows.reduce((s, r) => s + r.weight, 0);

    // Compute Rate Card Quote
    let estimatedFreightINR = 0;
    validRows.forEach((r) => {
      const eligible = CustomerRateAssignmentService.getEligibleCouriersForCustomer(
        tenantId,
        r.shipmentType,
        '400001',
        r.pincode,
        r.weight * 1000,
        r.paymentMode,
        r.invoiceValue * 100
      );
      if (eligible.length > 0) {
        estimatedFreightINR += Number(eligible[0].customerPriceINR || 120);
      } else {
        estimatedFreightINR += 150;
      }
    });

    const estimatedGstINR = Math.round(estimatedFreightINR * 0.18 * 100) / 100;
    const estimatedTotalPayableINR = Math.round((estimatedFreightINR + estimatedGstINR) * 100) / 100;

    const summary: BulkImportSummary = {
      bulkUploadId,
      totalRows: rows.length,
      uniqueOrdersCount: seenOrderIds.size,
      validRowsCount: validRows.length,
      invalidRowsCount: rows.length - validRows.length,
      totalCodValueINR: validRows.filter((r) => r.paymentMode === 'COD').reduce((s, r) => s + r.invoiceValue, 0),
      totalActualWeightKg,
      estimatedFreightINR,
      estimatedGstINR,
      estimatedTotalPayableINR,
    };

    return { rows, summary };
  },

  // Generate Error Report CSV string for invalid rows
  generateErrorReportCsv: (rows: BulkOrderImportRow[]): string => {
    const invalidRows = rows.filter((r) => !r.isValid);
    const headers = [
      'Row Number',
      'Order ID',
      'Customer Name',
      'Mobile',
      'Pincode',
      'Address',
      'Validation Error Reason',
    ];

    const data = invalidRows.map((r) => [
      r.rowId,
      r.orderId,
      `"${r.customerName}"`,
      r.mobile,
      r.pincode,
      `"${r.address}"`,
      `"${r.validationError}"`,
    ]);

    return [headers.join(','), ...data.map((e) => e.join(','))].join('\n');
  },

  // Execute Bulk Booking with Wallet Debit
  executeBulkBooking: async (
    rows: BulkOrderImportRow[],
    summary: BulkImportSummary,
    tenantId = 'tenant-demo-01'
  ): Promise<{ success: boolean; message: string; successfulShipments: number; failedShipments: number }> => {
    const validRows = rows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      return { success: false, message: 'No valid rows available to book.', successfulShipments: 0, failedShipments: 0 };
    }

    const wallet = WalletService.getWallet(tenantId);
    const availableINR = wallet.availableBalanceMinor / 100;
    if (availableINR < summary.estimatedTotalPayableINR) {
      return {
        success: false,
        message: `Insufficient Wallet Balance. Required ₹${summary.estimatedTotalPayableINR.toLocaleString('en-IN')}, Available ₹${availableINR.toLocaleString('en-IN')}. Please recharge wallet first.`,
        successfulShipments: 0,
        failedShipments: validRows.length,
      };
    }

    let successfulShipments = 0;
    let failedShipments = 0;

    for (const r of validRows) {
      const bookingInput: CustomerBookingInput = {
        tenantId,
        orderId: r.orderId,
        customerName: r.customerName,
        customerPhone: r.mobile,
        customerEmail: 'customer@order.com',
        shipmentType: (r.shipmentType === 'B2B' ? 'b2b' : 'b2c') as 'b2b' | 'b2c',
        pickupContactName: 'Bhiwandi Central Warehouse',
        pickupPhone: '9820011223',
        pickupAddressLine1: 'Plot 42 MIDC Industrial Area',
        pickupCity: 'Bhiwandi',
        pickupPincode: '421302',
        deliveryContactName: r.customerName,
        deliveryCompany: r.customerName,
        deliveryPhone: r.mobile,
        deliveryAddressLine1: r.address,
        deliveryAddressLine2: `${r.city}, ${r.state}`,
        deliveryCity: r.city,
        deliveryState: r.state,
        deliveryPincode: r.pincode,
        invoiceNumber: `INV-${r.orderId}`,
        invoiceDate: new Date().toISOString().split('T')[0],
        invoiceValueINR: r.invoiceValue,
        paymentMode: (r.paymentMode === 'COD' ? 'cod' : 'prepaid') as 'cod' | 'prepaid',
        codAmount: r.paymentMode === 'COD' ? r.invoiceValue : 0,
        insuranceEnabled: false,
        insuredValueINR: 0,
        packageType: 'Box',
        packages: [
          {
            id: `pkg-${r.orderId}-1`,
            packageNumber: 1,
            packageType: 'Box',
            actualWeightKg: r.weight,
            lengthCm: r.length,
            widthCm: r.width,
            heightCm: r.height,
            volumetricWeightKg: Math.round((r.length * r.width * r.height) / 5000 * 10) / 10,
            chargeableWeightKg: Math.max(r.weight, Math.round((r.length * r.width * r.height) / 5000 * 10) / 10),
            quantity: r.quantity,
            packageContents: r.productName,
          },
        ],
        actualWeightKg: r.weight,
        chargeableWeightKg: Math.max(r.weight, Math.round((r.length * r.width * r.height) / 5000 * 10) / 10),
        courierId: 'delhivery',
        courierName: 'Delhivery Surface',
        serviceName: 'Express Surface Dispatches',
        baseFreightINR: Math.round((summary.estimatedFreightINR / validRows.length) * 100) / 100,
        fuelSurchargeINR: 15,
        codFeeINR: r.paymentMode === 'COD' ? 40 : 0,
        insuranceFeeINR: 0,
        gstINR: Math.round((summary.estimatedGstINR / validRows.length) * 100) / 100,
        shippingChargeINR: Math.round((summary.estimatedTotalPayableINR / validRows.length) * 100) / 100,
      };

      try {
        const res = await CustomerBookingService.bookShipmentWithWalletDebit(bookingInput);
        if (res.success) {
          successfulShipments++;
        } else {
          failedShipments++;
        }
      } catch {
        failedShipments++;
      }
    }

    BULK_UPLOAD_HISTORY.unshift({
      id: `blk-rec-${Date.now()}`,
      bulkUploadId: summary.bulkUploadId,
      tenantId,
      fileName: `Bulk_Batch_${summary.bulkUploadId}.csv`,
      uploadDate: new Date().toLocaleString(),
      totalRows: summary.totalRows,
      validRows: summary.validRowsCount,
      invalidRows: summary.invalidRowsCount,
      successfulShipments,
      failedShipments,
      status: failedShipments === 0 ? 'COMPLETED' : 'COMPLETED_WITH_ERRORS',
      createdBy: 'Merchant Operations Agent',
    });

    return {
      success: true,
      message: `Bulk shipment booking completed! Created ${successfulShipments} shipments (${failedShipments} failed).`,
      successfulShipments,
      failedShipments,
    };
  },
};
