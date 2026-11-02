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

    const cleanOrigin = (input.originPostalCode || '').replace(/\D/g, '').trim();
    const cleanDest = (input.destinationPostalCode || '').replace(/\D/g, '').trim();

    const isOriginValid = /^\d{6}$/.test(cleanOrigin);
    const isDestValid = /^\d{6}$/.test(cleanDest);

    // 1. Verify Origin & Destination PINs in Master (or resolve valid Indian PIN)
    let originPin = DEMO_PIN_MASTER.find((p) => p.postalCode === cleanOrigin);
    if (!originPin && isOriginValid) {
      originPin = {
        id: `pin-${cleanOrigin}`,
        country: 'IN',
        postalCode: cleanOrigin,
        city: 'Origin Hub',
        district: 'District',
        state: 'State',
        stateCode: cleanOrigin.slice(0, 2),
        countryCode: 'IN',
        status: 'ACTIVE',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      };
    }

    let destPin = DEMO_PIN_MASTER.find((p) => p.postalCode === cleanDest);
    if (!destPin && isDestValid) {
      destPin = {
        id: `pin-${cleanDest}`,
        country: 'IN',
        postalCode: cleanDest,
        city: 'Destination Hub',
        district: 'District',
        state: 'State',
        stateCode: cleanDest.slice(0, 2),
        countryCode: 'IN',
        status: 'ACTIVE',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      };
    }

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

        if (!isOriginValid) {
          serviceable = false;
          reasonCode = 'PIN_NOT_FOUND';
          reasonMessage = `Origin PIN Code ${input.originPostalCode} is invalid`;
        } else if (!isDestValid || cleanDest === '999999') {
          serviceable = false;
          reasonCode = 'NOT_SERVICEABLE';
          reasonMessage = `Destination PIN Code ${input.destinationPostalCode} is out of service area`;
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
        }

        // Look up Zone Mapping for Destination PIN if configured
        const mapping = DEMO_ZONE_MAPPINGS.find(
          (m) =>
            (m.courierId === courier.id || m.courierId === courier.code.toLowerCase()) &&
            m.mode === input.mode &&
            m.postalCode === cleanDest &&
            m.status === 'ACTIVE'
        );

        if (mapping && !mapping.forward) {
          serviceable = false;
          reasonCode = 'NOT_SERVICEABLE';
          reasonMessage = `Forward delivery is disabled for PIN ${cleanDest}`;
        } else if (mapping && input.paymentMode === 'COD' && !mapping.cod) {
          serviceable = false;
          reasonCode = 'COD_NOT_AVAILABLE';
          reasonMessage = `Cash-on-Delivery (COD) is not available for PIN ${cleanDest}`;
        } else if (mapping && input.paymentMode === 'PREPAID' && !mapping.prepaid) {
          serviceable = false;
          reasonCode = 'PREPAID_NOT_AVAILABLE';
          reasonMessage = `Prepaid payment is not supported for PIN ${cleanDest}`;
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
          destinationZone: mapping?.zoneCode || destPin?.stateCode || 'DEST',
          forward: mapping?.forward ?? true,
          cod: mapping?.cod ?? true,
          prepaid: mapping?.prepaid ?? true,
          pickup: mapping?.pickup ?? true,
          reasonCode,
          reasonMessage,
        });
      }
    }

    return results;
  },
};
