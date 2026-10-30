import type {
  ServiceabilityCheckInput,
  ServiceabilityResultItem,
  ServiceabilityReasonCode,
} from '../types/serviceability';
import {
  DEMO_PIN_MASTER,
  DEMO_ZONE_MAPPINGS,
} from '../mocks/serviceability.mock';
import {
  DEMO_COURIER_PROVIDERS,
  DEMO_COURIER_ACCOUNTS,
  DEMO_COURIER_SERVICES,
} from '../mocks/couriers.mock';

export const ServiceabilityEngine = {
  checkServiceability: (input: ServiceabilityCheckInput): ServiceabilityResultItem[] => {
    const results: ServiceabilityResultItem[] = [];

    // 1. Verify Origin & Destination PINs in Master
    const originPin = DEMO_PIN_MASTER.find((p) => p.postalCode === input.originPostalCode.trim());
    const destPin = DEMO_PIN_MASTER.find((p) => p.postalCode === input.destinationPostalCode.trim());

    // Filter Couriers
    const targetCouriers = DEMO_COURIER_PROVIDERS.filter((c) => {
      if (input.courierId && c.id !== input.courierId && c.code.toLowerCase() !== input.courierId.toLowerCase()) {
        return false;
      }
      if (!c.supportedModes.includes(input.mode)) {
        return false;
      }
      return true;
    });

    for (const courier of targetCouriers) {
      // Find active Courier Services matching mode
      const services = DEMO_COURIER_SERVICES.filter(
        (s) => (s.courierId === courier.id || s.courierId === courier.code.toLowerCase()) && s.deliveryType === input.mode
      );

      // Find active Courier Accounts
      const accounts = DEMO_COURIER_ACCOUNTS.filter(
        (a) => (a.courierId === courier.id || a.courierId === courier.code.toLowerCase())
      );

      const defaultAccount = accounts.find((a) => a.isDefault) || accounts[0];

      for (const service of services) {
        if (input.serviceId && service.id !== input.serviceId && service.code.toLowerCase() !== input.serviceId.toLowerCase()) {
          continue;
        }

        let serviceable = true;
        let reasonCode: ServiceabilityReasonCode = 'SERVICEABLE';
        let reasonMessage = 'Serviceable via direct zonal coverage';

        if (!originPin) {
          serviceable = false;
          reasonCode = 'PIN_NOT_FOUND';
          reasonMessage = `Origin PIN Code ${input.originPostalCode} not found in PIN Master database`;
        } else if (!destPin) {
          serviceable = false;
          reasonCode = 'PIN_NOT_FOUND';
          reasonMessage = `Destination PIN Code ${input.destinationPostalCode} not found in PIN Master database`;
        } else if (courier.status !== 'ACTIVE') {
          serviceable = false;
          reasonCode = 'COURIER_NOT_CONFIGURED';
          reasonMessage = `Courier partner ${courier.name} is currently INACTIVE`;
        } else if (service.status !== 'ACTIVE') {
          serviceable = false;
          reasonCode = 'SERVICE_INACTIVE';
          reasonMessage = `Service ${service.name} is currently INACTIVE`;
        } else if (defaultAccount && defaultAccount.status !== 'ACTIVE') {
          serviceable = false;
          reasonCode = 'ACCOUNT_INACTIVE';
          reasonMessage = `Courier account ${defaultAccount.accountName} is currently INACTIVE`;
        } else {
          // Look up Zone Mapping for Destination PIN
          const mapping = DEMO_ZONE_MAPPINGS.find(
            (m) =>
              (m.courierId === courier.id || m.courierId === courier.code.toLowerCase()) &&
              m.mode === input.mode &&
              m.postalCode === input.destinationPostalCode.trim() &&
              m.status === 'ACTIVE'
          );

          if (!mapping) {
            serviceable = false;
            reasonCode = 'NOT_SERVICEABLE';
            reasonMessage = `Destination PIN ${input.destinationPostalCode} is out of service area for ${service.name}`;
          } else if (!mapping.forward) {
            serviceable = false;
            reasonCode = 'NOT_SERVICEABLE';
            reasonMessage = `Forward delivery is disabled for PIN ${input.destinationPostalCode}`;
          } else if (input.paymentMode === 'COD' && !mapping.cod) {
            serviceable = false;
            reasonCode = 'COD_NOT_AVAILABLE';
            reasonMessage = `Cash-on-Delivery (COD) is not available for PIN ${input.destinationPostalCode}`;
          } else if (input.paymentMode === 'PREPAID' && !mapping.prepaid) {
            serviceable = false;
            reasonCode = 'PREPAID_NOT_AVAILABLE';
            reasonMessage = `Prepaid payment is not supported for PIN ${input.destinationPostalCode}`;
          }

          results.push({
            courierId: courier.id,
            courierCode: courier.code,
            courierName: courier.name,
            courierLogo: courier.logo,
            courierAccountId: defaultAccount?.id,
            serviceId: service.id,
            serviceCode: service.code,
            serviceName: service.name,
            mode: input.mode,
            transportMode: service.mode,
            serviceable,
            originZone: originPin?.stateCode || 'ORIGIN',
            destinationZone: mapping?.zoneCode || 'DEST',
            forward: mapping?.forward ?? false,
            cod: mapping?.cod ?? false,
            prepaid: mapping?.prepaid ?? false,
            pickup: mapping?.pickup ?? true,
            reasonCode,
            reasonMessage,
          });
          continue;
        }

        results.push({
          courierId: courier.id,
          courierCode: courier.code,
          courierName: courier.name,
          courierLogo: courier.logo,
          courierAccountId: defaultAccount?.id,
          serviceId: service.id,
          serviceCode: service.code,
          serviceName: service.name,
          mode: input.mode,
          transportMode: service.mode,
          serviceable: false,
          reasonCode,
          reasonMessage,
          forward: false,
          cod: false,
          prepaid: false,
          pickup: false,
        });
      }
    }

    return results;
  },
};
