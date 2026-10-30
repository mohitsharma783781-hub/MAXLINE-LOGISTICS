import type { ShipmentItem, ShipmentFilterState } from '../types/shipments';

export const DEMO_SHIPMENT_ITEMS: ShipmentItem[] = [];

export const filterDemoShipments = (
  items: ShipmentItem[],
  filters: ShipmentFilterState
): ShipmentItem[] => {
  return items.filter((item) => {
    // 1. Status Filter
    if (filters.status !== 'all' && item.status !== filters.status) {
      return false;
    }

    // 2. Search Query Filter (AWB, Order ID, Customer Name)
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase();
      const matchAwb = item.awb.toLowerCase().includes(q);
      const matchOrder = item.orderId.toLowerCase().includes(q);
      const matchCustomer = item.customerName.toLowerCase().includes(q);
      if (!matchAwb && !matchOrder && !matchCustomer) {
        return false;
      }
    }

    // 3. Courier Filter
    if (filters.courier !== 'all' && item.courierId !== filters.courier) {
      return false;
    }

    // 4. Payment Mode Filter
    if (filters.paymentMode !== 'all' && item.paymentMode !== filters.paymentMode) {
      return false;
    }

    // 5. Shipment Type Filter
    if (filters.shipmentType !== 'all' && item.shipmentType !== filters.shipmentType) {
      return false;
    }

    return true;
  });
};
