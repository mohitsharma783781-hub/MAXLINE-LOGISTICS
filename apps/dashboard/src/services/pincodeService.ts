/**
 * MAXLINE LOGISTICS - India Postal Pincode Auto-Detection Service
 * Integrates directly with India Post's nationwide directory (19,000+ pincodes)
 * Provides automatic, zero-latency city, district, and state auto-population.
 */

export interface PincodeLookupResult {
  pincode: string;
  city: string;
  district: string;
  state: string;
  country: string;
  postOffices: string[];
  success: boolean;
  message?: string;
}

// In-memory runtime cache to eliminate redundant network roundtrips
const pincodeMemoryCache = new Map<string, PincodeLookupResult>();

// Fallback high-density city-state dictionary for instant offline resolution
const POPULAR_PINCODES: Record<string, { city: string; state: string; district: string }> = {
  '110001': { city: 'New Delhi', district: 'Central Delhi', state: 'Delhi' },
  '110020': { city: 'New Delhi', district: 'South Delhi', state: 'Delhi' },
  '122001': { city: 'Gurugram', district: 'Gurgaon', state: 'Haryana' },
  '122002': { city: 'Gurugram', district: 'Gurgaon', state: 'Haryana' },
  '134113': { city: 'Panchkula', district: 'Panchkula', state: 'Haryana' },
  '141001': { city: 'Ludhiana', district: 'Ludhiana', state: 'Punjab' },
  '160017': { city: 'Chandigarh', district: 'Chandigarh', state: 'Chandigarh' },
  '201301': { city: 'Noida', district: 'Gautam Buddha Nagar', state: 'Uttar Pradesh' },
  '302001': { city: 'Jaipur', district: 'Jaipur', state: 'Rajasthan' },
  '380001': { city: 'Ahmedabad', district: 'Ahmedabad', state: 'Gujarat' },
  '395001': { city: 'Surat', district: 'Surat', state: 'Gujarat' },
  '400001': { city: 'Mumbai', district: 'Mumbai', state: 'Maharashtra' },
  '411001': { city: 'Pune', district: 'Pune', state: 'Maharashtra' },
  '500001': { city: 'Hyderabad', district: 'Hyderabad', state: 'Telangana' },
  '560001': { city: 'Bengaluru', district: 'Bangalore', state: 'Karnataka' },
  '600001': { city: 'Chennai', district: 'Chennai', state: 'Tamil Nadu' },
  '700001': { city: 'Kolkata', district: 'Kolkata', state: 'West Bengal' },
};

export class PincodeService {
  /**
   * Lookup city, district, and state for any 6-digit Indian Pincode.
   */
  public static async lookup(pincode: string | number): Promise<PincodeLookupResult> {
    const cleanPin = String(pincode || '').replace(/\D/g, '').slice(0, 6);

    if (cleanPin.length !== 6) {
      return {
        pincode: cleanPin,
        city: '',
        district: '',
        state: '',
        country: 'India',
        postOffices: [],
        success: false,
        message: 'Pincode must be exactly 6 numeric digits.',
      };
    }

    // 1. Check in-memory cache
    if (pincodeMemoryCache.has(cleanPin)) {
      return pincodeMemoryCache.get(cleanPin)!;
    }

    // 2. Check localStorage cache
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const cachedRaw = localStorage.getItem(`maxline_pin_${cleanPin}`);
        if (cachedRaw) {
          const parsed = JSON.parse(cachedRaw);
          pincodeMemoryCache.set(cleanPin, parsed);
          return parsed;
        }
      }
    } catch {}

    // 3. Fast offline fallback check
    if (POPULAR_PINCODES[cleanPin]) {
      const pop = POPULAR_PINCODES[cleanPin];
      const result: PincodeLookupResult = {
        pincode: cleanPin,
        city: pop.city,
        district: pop.district,
        state: pop.state,
        country: 'India',
        postOffices: [pop.city],
        success: true,
      };
      this.cacheResult(cleanPin, result);
      return result;
    }

    // 4. Query live India Post Open Directory API
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s timeout

      const res = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data[0]?.Status === 'Success' && Array.isArray(data[0]?.PostOffice) && data[0].PostOffice.length > 0) {
          const offices = data[0].PostOffice;
          const primary = offices[0];

          const district = primary.District || '';
          const state = primary.State || '';
          // City priority: District > Division > Name
          const city = primary.District || primary.Division || primary.Name || district;
          const postOfficesList = offices.map((o: any) => o.Name).filter(Boolean);

          const result: PincodeLookupResult = {
            pincode: cleanPin,
            city,
            district,
            state,
            country: 'India',
            postOffices: postOfficesList,
            success: true,
          };

          this.cacheResult(cleanPin, result);
          return result;
        }
      }
    } catch (err) {
      console.warn(`[PincodeService] Network lookup failed for ${cleanPin}, falling back to postal circle:`, err);
    }

    // 5. Fallback using India Postal Circle State Codes
    const circleState = this.resolvePostalCircleState(cleanPin);
    const fallbackResult: PincodeLookupResult = {
      pincode: cleanPin,
      city: '',
      district: '',
      state: circleState || '',
      country: 'India',
      postOffices: [],
      success: !!circleState,
      message: circleState ? `State detected from postal circle: ${circleState}` : 'Pincode not found.',
    };

    if (circleState) {
      this.cacheResult(cleanPin, fallbackResult);
    }

    return fallbackResult;
  }

  private static cacheResult(pincode: string, result: PincodeLookupResult) {
    pincodeMemoryCache.set(pincode, result);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(`maxline_pin_${pincode}`, JSON.stringify(result));
      }
    } catch {}
  }

  /**
   * Resolves the Indian State based on official India Post circle prefixes.
   */
  public static resolvePostalCircleState(pin: string): string {
    const prefix = pin.slice(0, 2);
    const prefix3 = pin.slice(0, 3);

    if (prefix === '11') return 'Delhi';
    if (prefix === '12' || prefix === '13') return 'Haryana';
    if (prefix === '14' || prefix === '15') return 'Punjab';
    if (prefix === '16') return 'Chandigarh';
    if (prefix === '17') return 'Himachal Pradesh';
    if (prefix === '18' || prefix === '19') return 'Jammu & Kashmir';
    if (prefix >= '20' && prefix <= '28') return 'Uttar Pradesh';
    if (prefix === '24' || prefix === '26') return 'Uttarakhand';
    if (prefix >= '30' && prefix <= '34') return 'Rajasthan';
    if (prefix >= '36' && prefix <= '39') return 'Gujarat';
    if (prefix >= '40' && prefix <= '44') return 'Maharashtra';
    if (prefix === '40' && (prefix3 === '403')) return 'Goa';
    if (prefix >= '45' && prefix <= '48') return 'Madhya Pradesh';
    if (prefix === '49') return 'Chhattisgarh';
    if (prefix >= '50' && prefix <= '53') {
      if (prefix === '50') return 'Telangana';
      return 'Andhra Pradesh';
    }
    if (prefix >= '56' && prefix <= '59') return 'Karnataka';
    if (prefix >= '60' && prefix <= '66') return 'Tamil Nadu';
    if (prefix >= '67' && prefix <= '69') return 'Kerala';
    if (prefix >= '70' && prefix <= '74') return 'West Bengal';
    if (prefix >= '75' && prefix <= '77') return 'Odisha';
    if (prefix >= '80' && prefix <= '85') return 'Bihar';
    if (prefix === '82' || prefix === '83') return 'Jharkhand';
    if (prefix === '78' || prefix === '79') {
      if (prefix3 === '795') return 'Manipur';
      if (prefix3 === '796') return 'Mizoram';
      if (prefix3 === '797') return 'Nagaland';
      if (prefix3 === '798') return 'Tripura';
      if (prefix3 === '799') return 'Tripura';
      if (prefix3 === '790' || prefix3 === '791' || prefix3 === '792') return 'Arunachal Pradesh';
      if (prefix3 === '793' || prefix3 === '794') return 'Meghalaya';
      return 'Assam';
    }
    return '';
  }
}
