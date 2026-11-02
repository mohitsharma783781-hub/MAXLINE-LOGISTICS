/**
 * MAXLINE LOGISTICS - Delhivery Client Warehouse Registration API
 * Registers a seller or merchant origin warehouse directly with Delhivery HQ.
 */

const DELHIVERY_API_TOKEN = process.env.DELHIVERY_API_TOKEN || '745fcc8cddf49e2c15e9e018a20d78b7ede7656e';
const DELHIVERY_HOST = 'track.delhivery.com';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const {
      name,
      phone,
      address,
      city,
      pin,
      country = 'India',
      email = 'maxlinelogistic@gmail.com',
      return_address,
      return_city,
      return_state,
      return_pin,
    } = req.body || {};

    if (!name || !phone || !address || !pin) {
      return res.status(400).json({
        success: false,
        message: 'Name, phone, address, and pincode are required to register a Delhivery warehouse.',
      });
    }

    // Clean warehouse name: alphanumeric, underscore, no special characters
    const cleanName = String(name).trim().replace(/[^a-zA-Z0-9_-]/g, '_').toUpperCase();

    const payload = {
      name: cleanName,
      email: email || 'maxlinelogistic@gmail.com',
      phone: String(phone).replace(/\D/g, '').slice(-10),
      address: String(address).slice(0, 200),
      city: city || 'City',
      country: country || 'India',
      pin: String(pin).trim(),
      return_address: String(return_address || address).slice(0, 200),
      return_city: return_city || city || 'City',
      return_state: return_state || 'State',
      return_country: country || 'India',
      return_pin: String(return_pin || pin).trim(),
    };

    const response = await fetch(`https://${DELHIVERY_HOST}/api/backend/clientwarehouse/create/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${DELHIVERY_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.status === 201 || data.success) {
      return res.status(201).json({
        success: true,
        name: cleanName,
        data: data.data || data,
        message: 'Warehouse successfully registered with Delhivery HQ.',
      });
    }

    return res.status(response.status || 400).json({
      success: false,
      message: data.error || data.message || 'Failed to register warehouse with Delhivery.',
      raw: data,
    });
  } catch (error) {
    console.error('[Delhivery Warehouse Create Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error registering warehouse with Delhivery.',
      error: error.message,
    });
  }
};
