import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Save,
  XCircle,
  Plus,
  Trash2,
  User,
  MapPin,
  Package,
  CreditCard,
  Edit2,
  ShoppingCart,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import {
  Button,
  Card,
  Badge,
  Input,
  Radio,
  Checkbox,
  Alert,
  ConfirmationDialog,
  Select,
} from '../../components/ui';
import { DEFAULT_CREATE_ORDER_FORM } from '../../mocks/createOrder.mock';
import type { CreateOrderForm, LineItem } from '../../types/createOrder';
import { DEMO_ORDER_ITEMS } from '../../mocks/orders.mock';
import { formatCurrency } from '../../utils/formatters';

export const CreateOrderWizardPage: React.FC = () => {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState<CreateOrderForm>(DEFAULT_CREATE_ORDER_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState<boolean>(false);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState<boolean>(false);
  const [createdOrderRef, setCreatedOrderRef] = useState<string>('');
  const [customerSearchQuery, setCustomerSearchQuery] = useState<string>('');

  const steps = [
    { num: 1, label: 'Customer', icon: User },
    { num: 2, label: 'Address', icon: MapPin },
    { num: 3, label: 'Items', icon: ShoppingCart },
    { num: 4, label: 'Package', icon: Package },
    { num: 5, label: 'Payment & B2B', icon: CreditCard },
    { num: 6, label: 'Review', icon: CheckCircle2 },
  ];

  // Existing Customers for Autocomplete
  const existingCustomers = useMemo(() => {
    return DEMO_ORDER_ITEMS.map((o) => ({
      name: o.customerName,
      phone: o.customerPhone,
      email: o.customerEmail,
      company: o.companyName,
      address: o.shippingAddress,
    }));
  }, []);

  const filteredCustomers = useMemo(() => {
    if (!customerSearchQuery.trim()) return [];
    const q = customerSearchQuery.toLowerCase();
    return existingCustomers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
    );
  }, [customerSearchQuery, existingCustomers]);

  // Item & Volumetric Weight Calculations
  const calculatedSummary = useMemo(() => {
    const subtotal = formData.items.reduce((acc, item) => {
      const lineSub = item.quantity * item.unitPrice;
      const lineDiscount = item.discount || 0;
      const lineTax = item.tax || 0;
      return acc + Math.max(0, lineSub - lineDiscount + lineTax);
    }, 0);

    const discount = formData.summary.discount || 0;
    const shippingCharge = formData.summary.shippingCharge || 0;
    const tax = formData.summary.tax || 0;
    const grandTotal = Math.max(0, subtotal - discount + shippingCharge + tax);

    // Volumetric Weight Calculation: (L * W * H) / 5000 (in KG)
    const pkg = formData.packageDetails;
    const lengthCm = pkg.lengthCm || 0;
    const widthCm = pkg.widthCm || 0;
    const heightCm = pkg.heightCm || 0;
    const volWeightKg = Number(((lengthCm * widthCm * heightCm) / 5000).toFixed(2));

    const actualKg = pkg.weightUnit === 'g' ? pkg.actualWeightKg / 1000 : pkg.actualWeightKg;
    const chargeableKg = Math.max(actualKg, volWeightKg);

    return {
      subtotal,
      discount,
      shippingCharge,
      tax,
      grandTotal,
      volWeightKg,
      actualKg,
      chargeableKg,
    };
  }, [formData.items, formData.summary, formData.packageDetails]);

  // Validations per step
  const validateStep = (step: number): boolean => {
    const errs: Record<string, string> = {};

    if (step === 1) {
      if (!formData.customer.customerName.trim()) errs.custName = 'Customer Name is required';
      if (!formData.customer.phone.trim()) {
        errs.custPhone = 'Phone Number is required';
      } else if (!/^[0-9+\s-]{8,15}$/.test(formData.customer.phone.trim())) {
        errs.custPhone = 'Enter a valid mobile number (e.g. +91 98765 43210)';
      }

      if (formData.customer.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customer.email.trim())) {
        errs.custEmail = 'Enter a valid email address format';
      }
    } else if (step === 2) {
      const del = formData.deliveryAddress;
      if (!del.recipientName.trim()) errs.delName = 'Recipient Name is required';
      if (!del.phone.trim()) errs.delPhone = 'Phone Number is required';
      if (!del.addressLine1.trim()) errs.delAddress1 = 'Address Line 1 is required';
      if (!del.city.trim()) errs.delCity = 'City is required';
      if (!del.state.trim()) errs.delState = 'State is required';
      if (!del.pincode.trim()) {
        errs.delPincode = 'Postal Code / PIN is required';
      } else if (!/^[0-9A-Za-z\s-]{3,10}$/.test(del.pincode.trim())) {
        errs.delPincode = 'Enter a valid 6-digit postal PIN code';
      }

      if (!del.sameAsDeliveryForBilling) {
        const bill = formData.billingAddress;
        if (!bill.recipientName.trim()) errs.billName = 'Billing Recipient Name is required';
        if (!bill.addressLine1.trim()) errs.billAddress1 = 'Billing Address Line 1 is required';
        if (!bill.city.trim()) errs.billCity = 'Billing City is required';
        if (!bill.pincode.trim()) errs.billPincode = 'Billing Pincode is required';
      }
    } else if (step === 3) {
      if (formData.items.length === 0) {
        errs.items = 'At least one order line item is required';
      } else {
        formData.items.forEach((item, idx) => {
          if (!item.name.trim()) errs[`item_name_${idx}`] = `Item #${idx + 1} Name is required`;
          if (item.quantity <= 0) errs[`item_qty_${idx}`] = `Item #${idx + 1} Quantity must be > 0`;
          if (item.unitPrice < 0) errs[`item_price_${idx}`] = `Item #${idx + 1} Unit Price cannot be negative`;
        });
      }
    } else if (step === 4) {
      const pkg = formData.packageDetails;
      if (pkg.packageCount <= 0) errs.pkgCount = 'Package count must be at least 1';
      if (pkg.actualWeightKg <= 0) errs.pkgWeight = 'Actual weight must be greater than 0';
      if (pkg.lengthCm <= 0 || pkg.widthCm <= 0 || pkg.heightCm <= 0) {
        errs.pkgDimensions = 'Length, Width, and Height dimensions must be greater than 0';
      }
    } else if (step === 5) {
      if (formData.payment.paymentMode === 'cod') {
        const codAmt = formData.payment.codAmount ?? 0;
        if (codAmt < 0) errs.codAmount = 'COD amount cannot be negative';
      }

      if (formData.shipmentType === 'b2b' && formData.b2bDetails.gstin?.trim()) {
        const gstin = formData.b2bDetails.gstin.trim();
        if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin)) {
          errs.gstin = 'Enter a valid 15-digit Indian GSTIN format (e.g. 29ABCDE1234F1Z5)';
        }
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 6) {
        setCurrentStep((prev) => prev + 1);
      } else {
        handleFinalSubmit();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setErrors({});
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleFinalSubmit = () => {
    if (isSubmitting) return; // Idempotency protection against double clicks
    setIsSubmitting(true);

    setTimeout(() => {
      const newRef = `ORD-2026-${Math.floor(100000 + Math.random() * 900000)}`;
      setCreatedOrderRef(newRef);
      setIsSubmitting(false);
      setIsSuccessDialogOpen(true);
    }, 600);
  };

  // Line Item Handlers
  const handleAddItem = () => {
    const newItem: LineItem = {
      id: `item-${Date.now()}`,
      name: '',
      sku: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      tax: 0,
    };
    setFormData((p) => ({ ...p, items: [...p.items, newItem] }));
  };

  const handleRemoveItem = (id: string) => {
    if (formData.items.length <= 1) return;
    setFormData((p) => ({ ...p, items: p.items.filter((itm) => itm.id !== id) }));
  };

  const handleUpdateItem = (id: string, key: keyof LineItem, val: any) => {
    setFormData((p) => ({
      ...p,
      items: p.items.map((itm) => (itm.id === id ? { ...itm, [key]: val } : itm)),
    }));
  };

  // Autocomplete Select Existing Customer
  const handleSelectCustomer = (cust: typeof existingCustomers[0]) => {
    setFormData((p) => ({
      ...p,
      customer: {
        ...p.customer,
        customerName: cust.name,
        phone: cust.phone,
        email: cust.email,
        companyName: cust.company || '',
      },
      deliveryAddress: {
        ...p.deliveryAddress,
        recipientName: cust.name,
        phone: cust.phone,
        addressLine1: cust.address.addressLine1,
        city: cust.address.city,
        state: cust.address.state,
        pincode: cust.address.pincode,
      },
    }));
    setCustomerSearchQuery('');
  };

  const breadcrumbs = [
    { label: 'Customer Portal', path: '/app' },
    { label: 'Orders', path: '/app/orders' },
    { label: 'Create Order', path: '/app/orders/create' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
      {/* 1. Page Header */}
      <PageHeader
        title="Create Order"
        description="Create a new shipment order."
        breadcrumbs={breadcrumbs}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Save size={16} />}
              onClick={() => alert('Draft order structure preserved for future save.')}
            >
              Save Draft
            </Button>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<XCircle size={16} />}
              onClick={() => setIsCancelDialogOpen(true)}
            >
              Cancel
            </Button>
          </div>
        }
      />

      {/* 2. Stepper Header */}
      <Card style={{ padding: 'var(--space-4)', overflowX: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: 'max-content', width: '100%', gap: 'var(--space-2)' }}>
          {steps.map((st, idx) => {
            const isCompleted = currentStep > st.num;
            const isCurrent = currentStep === st.num;
            const Icon = st.icon;

            return (
              <React.Fragment key={st.num}>
                <button
                  onClick={() => {
                    if (isCompleted || isCurrent) setCurrentStep(st.num);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    padding: 'var(--space-2) var(--space-3)',
                    borderRadius: 'var(--radius-default)',
                    border: 'none',
                    backgroundColor: isCurrent
                      ? 'var(--color-violet-light)'
                      : isCompleted
                      ? 'var(--color-surface-secondary)'
                      : 'transparent',
                    color: isCurrent
                      ? 'var(--color-violet-main)'
                      : isCompleted
                      ? 'var(--color-success)'
                      : 'var(--color-text-muted)',
                    fontWeight: isCurrent ? 'var(--font-weight-bold)' : 'var(--font-weight-medium)',
                    fontSize: 'var(--font-size-small)',
                    cursor: isCompleted || isCurrent ? 'pointer' : 'default',
                  }}
                >
                  <Icon size={14} />
                  <span>{st.num}. {st.label}</span>
                </button>
                {idx < steps.length - 1 && (
                  <div style={{ flex: 1, height: '2px', backgroundColor: isCompleted ? 'var(--color-success)' : 'var(--color-border)', minWidth: '16px' }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </Card>

      {/* Validation Errors Alert */}
      {Object.keys(errors).length > 0 && (
        <Alert variant="danger" title="Please review the following fields">
          {Object.values(errors).join(' • ')}
        </Alert>
      )}

      {/* STEP CONTENT CONTAINER */}
      <Card style={{ padding: 'var(--space-6)' }}>
        {/* STEP 1: CUSTOMER */}
        {currentStep === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <div>
              <h3 style={{ fontSize: 'var(--font-size-h3)', fontWeight: 'var(--font-weight-bold)' }}>
                Step 1: Customer Details
              </h3>
              <p style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                Select an existing customer or enter new buyer contact details.
              </p>
            </div>

            {/* Existing Customer Search / Autocomplete */}
            <div style={{ position: 'relative' }}>
              <Input
                label="Search Existing Customer (Name, Phone, Email)"
                placeholder="Type to search existing customer database..."
                value={customerSearchQuery}
                onChange={(e) => setCustomerSearchQuery(e.target.value)}
              />
              {filteredCustomers.length > 0 && (
                <Card
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 20,
                    maxHeight: '200px',
                    overflowY: 'auto',
                    marginTop: '4px',
                    boxShadow: 'var(--shadow-md)',
                  }}
                >
                  {filteredCustomers.map((c, i) => (
                    <div
                      key={i}
                      onClick={() => handleSelectCustomer(c)}
                      style={{
                        padding: 'var(--space-3)',
                        borderBottom: '1px solid var(--color-border)',
                        cursor: 'pointer',
                        fontSize: '13px',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <strong>{c.name}</strong> ({c.phone}) — {c.email}
                    </div>
                  ))}
                </Card>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-4)' }}>
              <Input
                label="Customer Name *"
                value={formData.customer.customerName}
                onChange={(e) => setFormData((p) => ({ ...p, customer: { ...p.customer, customerName: e.target.value } }))}
                error={errors.custName}
              />
              <Input
                label="Mobile Phone Number *"
                placeholder="+91 98765 43210"
                value={formData.customer.phone}
                onChange={(e) => setFormData((p) => ({ ...p, customer: { ...p.customer, phone: e.target.value } }))}
                error={errors.custPhone}
              />
              <Input
                label="Email Address (Optional)"
                type="email"
                placeholder="customer@example.com"
                value={formData.customer.email}
                onChange={(e) => setFormData((p) => ({ ...p, customer: { ...p.customer, email: e.target.value } }))}
                error={errors.custEmail}
              />
              <Input
                label="Customer Reference (Optional)"
                placeholder="e.g. CUST-REF-9021"
                value={formData.customer.customerReference || ''}
                onChange={(e) => setFormData((p) => ({ ...p, customer: { ...p.customer, customerReference: e.target.value } }))}
              />
            </div>
          </div>
        )}

        {/* STEP 2: DELIVERY & BILLING ADDRESS */}
        {currentStep === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <div>
              <h3 style={{ fontSize: 'var(--font-size-h3)', fontWeight: 'var(--font-weight-bold)' }}>
                Step 2: Delivery & Billing Address
              </h3>
              <p style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                Specify destination delivery address and billing details.
              </p>
            </div>

            <h4 style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: 'var(--space-2)' }}>Delivery Address</h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
              <Input
                label="Recipient Name *"
                value={formData.deliveryAddress.recipientName}
                onChange={(e) => setFormData((p) => ({ ...p, deliveryAddress: { ...p.deliveryAddress, recipientName: e.target.value } }))}
                error={errors.delName}
              />
              <Input
                label="Recipient Phone *"
                value={formData.deliveryAddress.phone}
                onChange={(e) => setFormData((p) => ({ ...p, deliveryAddress: { ...p.deliveryAddress, phone: e.target.value } }))}
                error={errors.delPhone}
              />
              <Input
                label="Address Line 1 *"
                value={formData.deliveryAddress.addressLine1}
                onChange={(e) => setFormData((p) => ({ ...p, deliveryAddress: { ...p.deliveryAddress, addressLine1: e.target.value } }))}
                error={errors.delAddress1}
              />
              <Input
                label="Address Line 2 (Optional)"
                value={formData.deliveryAddress.addressLine2 || ''}
                onChange={(e) => setFormData((p) => ({ ...p, deliveryAddress: { ...p.deliveryAddress, addressLine2: e.target.value } }))}
              />
              <Input
                label="City *"
                value={formData.deliveryAddress.city}
                onChange={(e) => setFormData((p) => ({ ...p, deliveryAddress: { ...p.deliveryAddress, city: e.target.value } }))}
                error={errors.delCity}
              />
              <Input
                label="State *"
                value={formData.deliveryAddress.state}
                onChange={(e) => setFormData((p) => ({ ...p, deliveryAddress: { ...p.deliveryAddress, state: e.target.value } }))}
                error={errors.delState}
              />
              <Input
                label="Postal Code / PIN *"
                placeholder="560038"
                value={formData.deliveryAddress.pincode}
                onChange={(e) => setFormData((p) => ({ ...p, deliveryAddress: { ...p.deliveryAddress, pincode: e.target.value } }))}
                error={errors.delPincode}
              />
              <Input
                label="Country *"
                value={formData.deliveryAddress.country}
                onChange={(e) => setFormData((p) => ({ ...p, deliveryAddress: { ...p.deliveryAddress, country: e.target.value } }))}
              />
            </div>

            <Checkbox
              label="Billing address same as delivery address"
              checked={formData.deliveryAddress.sameAsDeliveryForBilling ?? true}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  deliveryAddress: { ...p.deliveryAddress, sameAsDeliveryForBilling: e.target.checked },
                }))
              }
            />

            {!formData.deliveryAddress.sameAsDeliveryForBilling && (
              <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px dashed var(--color-border)' }}>
                <h4 style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: 'var(--space-4)' }}>Separate Billing Address</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
                  <Input
                    label="Billing Recipient Name *"
                    value={formData.billingAddress.recipientName}
                    onChange={(e) => setFormData((p) => ({ ...p, billingAddress: { ...p.billingAddress, recipientName: e.target.value } }))}
                    error={errors.billName}
                  />
                  <Input
                    label="Billing Address Line 1 *"
                    value={formData.billingAddress.addressLine1}
                    onChange={(e) => setFormData((p) => ({ ...p, billingAddress: { ...p.billingAddress, addressLine1: e.target.value } }))}
                    error={errors.billAddress1}
                  />
                  <Input
                    label="Billing City *"
                    value={formData.billingAddress.city}
                    onChange={(e) => setFormData((p) => ({ ...p, billingAddress: { ...p.billingAddress, city: e.target.value } }))}
                    error={errors.billCity}
                  />
                  <Input
                    label="Billing Pincode *"
                    value={formData.billingAddress.pincode}
                    onChange={(e) => setFormData((p) => ({ ...p, billingAddress: { ...p.billingAddress, pincode: e.target.value } }))}
                    error={errors.billPincode}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: ORDER ITEMS */}
        {currentStep === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
              <div>
                <h3 style={{ fontSize: 'var(--font-size-h3)', fontWeight: 'var(--font-weight-bold)' }}>
                  Step 3: Order Line Items
                </h3>
                <p style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                  Add products, quantities, prices, discounts, and applicable taxes.
                </p>
              </div>

              <Button variant="outline" size="sm" leftIcon={<Plus size={16} />} onClick={handleAddItem}>
                + Add Item
              </Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {formData.items.map((item, idx) => (
                <Card key={item.id} style={{ padding: 'var(--space-4)', backgroundColor: 'var(--color-surface-secondary)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--space-3)', alignItems: 'center' }}>
                    <Input
                      label={`Item #${idx + 1} Name *`}
                      value={item.name}
                      onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                    />
                    <Input
                      label="SKU"
                      value={item.sku}
                      onChange={(e) => handleUpdateItem(item.id, 'sku', e.target.value)}
                    />
                    <Input
                      label="Quantity *"
                      type="number"
                      value={item.quantity.toString()}
                      onChange={(e) => handleUpdateItem(item.id, 'quantity', Math.max(1, Number(e.target.value)))}
                    />
                    <Input
                      label="Unit Price (₹) *"
                      type="number"
                      value={item.unitPrice.toString()}
                      onChange={(e) => handleUpdateItem(item.id, 'unitPrice', Math.max(0, Number(e.target.value)))}
                    />
                    <Input
                      label="Discount (₹)"
                      type="number"
                      value={item.discount?.toString() || '0'}
                      onChange={(e) => handleUpdateItem(item.id, 'discount', Math.max(0, Number(e.target.value)))}
                    />
                    <Input
                      label="Tax (₹)"
                      type="number"
                      value={item.tax?.toString() || '0'}
                      onChange={(e) => handleUpdateItem(item.id, 'tax', Math.max(0, Number(e.target.value)))}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '18px' }}>
                      <div>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Item Total</span>
                        <div style={{ fontWeight: 'bold', color: 'var(--color-violet-main)' }}>
                          {formatCurrency(Math.max(0, item.quantity * item.unitPrice - (item.discount || 0) + (item.tax || 0)))}
                        </div>
                      </div>
                      {formData.items.length > 1 && (
                        <Button variant="ghost" size="sm" style={{ color: 'var(--color-danger)' }} onClick={() => handleRemoveItem(item.id)}>
                          <Trash2 size={16} />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Financial Summary */}
            <Card style={{ padding: 'var(--space-5)', backgroundColor: 'var(--color-violet-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
                <div>
                  <span style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-secondary)' }}>
                    Order Grand Total ({formData.items.length} unique items)
                  </span>
                  <h2 style={{ fontSize: 'var(--font-size-h2)', fontWeight: 'bold', color: 'var(--color-violet-main)' }}>
                    {formatCurrency(calculatedSummary.grandTotal)}
                  </h2>
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-6)', fontSize: 'var(--font-size-small)' }}>
                  <div>Subtotal: <strong>{formatCurrency(calculatedSummary.subtotal)}</strong></div>
                  <div>Tax: <strong>{formatCurrency(calculatedSummary.tax)}</strong></div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* STEP 4: PACKAGE DETAILS */}
        {currentStep === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <div>
              <h3 style={{ fontSize: 'var(--font-size-h3)', fontWeight: 'var(--font-weight-bold)' }}>
                Step 4: Package Weight & Dimensions
              </h3>
              <p style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                Enter physical parcel weight and box dimensions for volumetric weight computation.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
              <Input
                label="Package Count *"
                type="number"
                value={formData.packageDetails.packageCount.toString()}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    packageDetails: { ...p.packageDetails, packageCount: Math.max(1, Number(e.target.value)) },
                  }))
                }
                error={errors.pkgCount}
              />

              <Input
                label="Actual Weight *"
                type="number"
                value={formData.packageDetails.actualWeightKg.toString()}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    packageDetails: { ...p.packageDetails, actualWeightKg: Math.max(0.1, Number(e.target.value)) },
                  }))
                }
                error={errors.pkgWeight}
              />

              <Select
                label="Weight Unit *"
                value={formData.packageDetails.weightUnit}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    packageDetails: { ...p.packageDetails, weightUnit: e.target.value as any },
                  }))
                }
                options={[
                  { value: 'kg', label: 'Kilograms (KG)' },
                  { value: 'g', label: 'Grams (G)' },
                ]}
              />

              <Input
                label="Length (CM) *"
                type="number"
                value={formData.packageDetails.lengthCm.toString()}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    packageDetails: { ...p.packageDetails, lengthCm: Math.max(1, Number(e.target.value)) },
                  }))
                }
              />

              <Input
                label="Width (CM) *"
                type="number"
                value={formData.packageDetails.widthCm.toString()}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    packageDetails: { ...p.packageDetails, widthCm: Math.max(1, Number(e.target.value)) },
                  }))
                }
              />

              <Input
                label="Height (CM) *"
                type="number"
                value={formData.packageDetails.heightCm.toString()}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    packageDetails: { ...p.packageDetails, heightCm: Math.max(1, Number(e.target.value)) },
                  }))
                }
              />
            </div>

            {/* Chargeable Weight Overview */}
            <Card style={{ padding: 'var(--space-5)', backgroundColor: 'var(--color-surface-secondary)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Actual Weight</span>
                  <div style={{ fontWeight: 'bold', fontSize: 'var(--font-size-h4)' }}>
                    {calculatedSummary.actualKg} KG
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Volumetric Weight (L*W*H/5000)</span>
                  <div style={{ fontWeight: 'bold', fontSize: 'var(--font-size-h4)' }}>
                    {calculatedSummary.volWeightKg} KG
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Chargeable Weight (Higher Value)</span>
                  <div style={{ fontWeight: 'bold', fontSize: 'var(--font-size-h4)', color: 'var(--color-violet-main)' }}>
                    {calculatedSummary.chargeableKg} KG
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* STEP 5: PAYMENT & B2B/B2C */}
        {currentStep === 5 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <div>
              <h3 style={{ fontSize: 'var(--font-size-h3)', fontWeight: 'var(--font-weight-bold)' }}>
                Step 5: Payment Mode & Commercial Type
              </h3>
              <p style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                Select payment collection method and specify B2B / B2C order type.
              </p>
            </div>

            {/* Payment Mode Selection */}
            <div>
              <label style={{ fontSize: 'var(--font-size-small)', fontWeight: 'bold', display: 'block', marginBottom: 'var(--space-2)' }}>
                Payment Mode *
              </label>
              <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap' }}>
                <Radio
                  name="ordPaymentMode"
                  label="Prepaid Order (Online payment collected)"
                  checked={formData.payment.paymentMode === 'prepaid'}
                  onChange={() => setFormData((p) => ({ ...p, payment: { ...p.payment, paymentMode: 'prepaid' } }))}
                />
                <Radio
                  name="ordPaymentMode"
                  label="Cash-on-Delivery (COD Collect on Doorstep)"
                  checked={formData.payment.paymentMode === 'cod'}
                  onChange={() => setFormData((p) => ({ ...p, payment: { ...p.payment, paymentMode: 'cod', codAmount: calculatedSummary.grandTotal } }))}
                />
              </div>
            </div>

            {formData.payment.paymentMode === 'cod' && (
              <div style={{ maxWidth: '300px' }}>
                <Input
                  label="COD Amount to Collect (₹) *"
                  type="number"
                  value={formData.payment.codAmount?.toString() || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, payment: { ...p.payment, codAmount: Math.max(0, Number(e.target.value)) } }))}
                  error={errors.codAmount}
                />
              </div>
            )}

            {/* Shipment Commercial Type (B2C vs B2B) */}
            <div style={{ paddingTop: 'var(--space-4)', borderTop: '1px dashed var(--color-border)' }}>
              <label style={{ fontSize: 'var(--font-size-small)', fontWeight: 'bold', display: 'block', marginBottom: 'var(--space-2)' }}>
                Shipment Commercial Type *
              </label>
              <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap' }}>
                <Radio
                  name="shipmentType"
                  label="B2C Consumer Order"
                  checked={formData.shipmentType === 'b2c'}
                  onChange={() => setFormData((p) => ({ ...p, shipmentType: 'b2c' }))}
                />
                <Radio
                  name="shipmentType"
                  label="B2B Commercial / Corporate Invoice Order"
                  checked={formData.shipmentType === 'b2b'}
                  onChange={() => setFormData((p) => ({ ...p, shipmentType: 'b2b' }))}
                />
              </div>
            </div>

            {formData.shipmentType === 'b2b' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
                <Input
                  label="Company Name"
                  value={formData.b2bDetails.companyName || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, b2bDetails: { ...p.b2bDetails, companyName: e.target.value } }))}
                />
                <Input
                  label="GSTIN Number (Optional)"
                  placeholder="29ABCDE1234F1Z5"
                  value={formData.b2bDetails.gstin || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, b2bDetails: { ...p.b2bDetails, gstin: e.target.value } }))}
                  error={errors.gstin}
                />
                <Input
                  label="Business Contact Reference"
                  value={formData.b2bDetails.businessReference || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, b2bDetails: { ...p.b2bDetails, businessReference: e.target.value } }))}
                />
              </div>
            )}
          </div>
        )}

        {/* STEP 6: REVIEW & CONFIRM */}
        {currentStep === 6 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <div>
              <h3 style={{ fontSize: 'var(--font-size-h3)', fontWeight: 'var(--font-weight-bold)' }}>
                Step 6: Review & Final Order Submission
              </h3>
              <p style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                Verify customer, address, item, package, and payment details before creating order record.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
              {/* Customer */}
              <Card style={{ padding: 'var(--space-4)', backgroundColor: 'var(--color-surface-secondary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                  <strong style={{ fontSize: '13px' }}>Customer</strong>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentStep(1)} leftIcon={<Edit2 size={12} />}>Edit</Button>
                </div>
                <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div>Name: <strong>{formData.customer.customerName}</strong></div>
                  <div>Phone: {formData.customer.phone}</div>
                  <div>Email: {formData.customer.email || 'N/A'}</div>
                </div>
              </Card>

              {/* Delivery Address */}
              <Card style={{ padding: 'var(--space-4)', backgroundColor: 'var(--color-surface-secondary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                  <strong style={{ fontSize: '13px' }}>Delivery Address</strong>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentStep(2)} leftIcon={<Edit2 size={12} />}>Edit</Button>
                </div>
                <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div>Recipient: {formData.deliveryAddress.recipientName}</div>
                  <div>Address: {formData.deliveryAddress.addressLine1}, {formData.deliveryAddress.city}, {formData.deliveryAddress.state} - {formData.deliveryAddress.pincode} ({formData.deliveryAddress.country})</div>
                </div>
              </Card>

              {/* Items */}
              <Card style={{ padding: 'var(--space-4)', backgroundColor: 'var(--color-surface-secondary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                  <strong style={{ fontSize: '13px' }}>Items ({formData.items.length})</strong>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentStep(3)} leftIcon={<Edit2 size={12} />}>Edit</Button>
                </div>
                <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {formData.items.map((itm) => (
                    <div key={itm.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{itm.name} (x{itm.quantity})</span>
                      <strong>{formatCurrency(itm.quantity * itm.unitPrice)}</strong>
                    </div>
                  ))}
                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '4px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                    <span>Grand Total:</span>
                    <span style={{ color: 'var(--color-violet-main)' }}>{formatCurrency(calculatedSummary.grandTotal)}</span>
                  </div>
                </div>
              </Card>

              {/* Package & Chargeable Weight */}
              <Card style={{ padding: 'var(--space-4)', backgroundColor: 'var(--color-surface-secondary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                  <strong style={{ fontSize: '13px' }}>Package & Weight</strong>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentStep(4)} leftIcon={<Edit2 size={12} />}>Edit</Button>
                </div>
                <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div>Count: <strong>{formData.packageDetails.packageCount} Package</strong></div>
                  <div>Actual Weight: {calculatedSummary.actualKg} KG</div>
                  <div>Volumetric Weight: {calculatedSummary.volWeightKg} KG</div>
                  <div>Chargeable Weight: <strong style={{ color: 'var(--color-violet-main)' }}>{calculatedSummary.chargeableKg} KG</strong></div>
                </div>
              </Card>

              {/* Payment & B2B/B2C */}
              <Card style={{ padding: 'var(--space-4)', backgroundColor: 'var(--color-surface-secondary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                  <strong style={{ fontSize: '13px' }}>Payment & Type</strong>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentStep(5)} leftIcon={<Edit2 size={12} />}>Edit</Button>
                </div>
                <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div>Mode: <Badge variant={formData.payment.paymentMode === 'cod' ? 'warning' : 'success'}>{formData.payment.paymentMode.toUpperCase()}</Badge></div>
                  {formData.payment.paymentMode === 'cod' && <div>COD Collect: <strong>{formatCurrency(formData.payment.codAmount || 0)}</strong></div>}
                  <div>Shipment Type: <Badge variant="neutral">{formData.shipmentType.toUpperCase()}</Badge></div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Wizard Navigation Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-8)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
          <Button
            variant="outline"
            disabled={currentStep === 1 || isSubmitting}
            onClick={handleBack}
            leftIcon={<ArrowLeft size={16} />}
          >
            Back
          </Button>

          <Button
            variant="primary"
            disabled={isSubmitting}
            onClick={handleNext}
            rightIcon={currentStep === 6 ? <CheckCircle2 size={16} /> : <ArrowRight size={16} />}
          >
            {isSubmitting
              ? 'Creating Order...'
              : currentStep === 6
              ? 'Create Order'
              : 'Continue'}
          </Button>
        </div>
      </Card>

      {/* Cancel Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isCancelDialogOpen}
        onClose={() => setIsCancelDialogOpen(false)}
        onConfirm={() => navigate('/app/orders')}
        title="Discard Order Draft?"
        description="Are you sure you want to discard this order draft? Entered customer and item details will be lost."
        confirmLabel="Discard Order"
        cancelLabel="Continue Editing"
        variant="danger"
      />

      {/* Success Dialog with Clean Rate Engine Integration Point */}
      <ConfirmationDialog
        isOpen={isSuccessDialogOpen}
        onClose={() => navigate('/app/orders')}
        onConfirm={() => navigate(`/app/shipments/create?orderId=${createdOrderRef}`)}
        title="Order Created Successfully"
        description={`Order reference ${createdOrderRef} has been recorded in your merchant workspace. A shipment record (SHP-${Math.floor(100000 + Math.random() * 900000)}) has been prepared in CREATED status without booking a courier.`}
        confirmLabel="Get Shipping Rates →"
        cancelLabel="View Orders List"
        variant="primary"
      />
    </div>
  );
};
