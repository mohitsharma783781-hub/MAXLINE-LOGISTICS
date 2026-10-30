import * as XLSX from 'xlsx';
import * as path from 'path';

function createSampleWorkbook() {
  const wb = XLSX.utils.book_new();

  // 1. Delhivery Sheet
  const delhiveryData = [
    ['', '', '← Destinations: North & Central (N1–W2)', '', '', '', '', '', '', 'Destinations: South, East & North-East (S1–NE2) →', '', '', '', '', '', '', '', '', 'Docket Fee', 'INR 65/- per docket'],
    ['#', 'Origin \\ Dest →', 'N1', 'N2', 'N3', 'N4', 'C1', 'C2', 'W1', 'W2', 'S1', 'S2', 'S3', 'S4', 'E1', 'E2', 'NE1', 'NE2', 'Fuel Surcharge (FSC)', '13.5% on base freight'],
    ['1', 'N1', 5.5, 5.5, 5.5, 6, 7.5, 7.5, 8, 8, 8, 8.5, 8.5, 8.5, 8.5, 8.5, 15, 15, 'Freight on Value (FOV)', 'Higher of INR 50 or 0.05% of invoice value'],
    ['2', 'N2', 5.5, 5.5, 5.8, 6, 8, 8, 8.5, 8.5, 8.5, 8.5, 8.5, 8.5, 8.5, 8.5, 15, 15, 'Volumetric Divisor', 'L × B × H / 4500'],
    ['3', 'N3', 6.1, 6.06, 6.1, 6.1, 8, 8, 8.5, 8.5, 8.5, 8.5, 8.5, 8.5, 8.5, 8.5, 15, 15, 'Minimum Chargeable Weight', '20 kg per docket'],
    ['4', 'N4', 6.1, 6.1, 6.1, 6.1, 8, 8, 8.5, 8.5, 8.5, 8.5, 8.5, 8.5, 8.5, 8.5, 15, 15, 'ODA Charges', 'Higher of INR 550 or INR 2.25/kg'],
    ['5', 'C1', 7.5, 7.5, 7.5, 7.5, 5.5, 5.5, 8.8, 8.8, 7, 7.5, 7.5, 7.5, 9, 9, 13, 13, 'Appointment / ABD Deliveries', 'Higher of INR 550 or INR 3/kg (above base + FSC)'],
    ['6', 'C2', 7.5, 7.5, 7.5, 7.5, 5.64, 5.5, 8.8, 8.8, 7.5, 7.5, 7.5, 7.5, 9, 9, 13, 13, 'Reattempt Charges (beyond free attempts)', 'Higher of INR 500 or INR 2/kg'],
    ['7', 'W1', 8, 8, 8, 8, 8, 8, 6, 6, 7.5, 7.5, 7.5, 7.5, 9.5, 10, 14.22, 15, 'Mall / Special Deliveries', 'Higher of INR 500 or INR 2/kg'],
    ['8', 'W2', 8, 8, 8, 8, 8.5, 8.5, 6, 6, 7.5, 7.5, 7.5, 7.5, 10, 10, 15, 15, 'Free Delivery Attempts', '3 attempts'],
    ['9', 'S1', 8.76, 9.71, 10, 10, 10.2, 10.2, 8.4, 8.4, 5.2, 5.64, 6, 6.1, 10, 10.26, 15, 15, 'RTO Charges', 'Same as forward freight'],
    ['10', 'S2', 8.76, 10, 10, 10, 10.2, 10.2, 8.4, 8.5, 5.82, 5.93, 6, 6.1, 10.5, 10.26, 15, 15, 'Demurrage (post 7 free days at hub)', 'INR 1.50/day/kg, minimum INR 100/day/docket'],
    ['11', 'S3', 9.18, 10, 10, 10, 10.2, 10.2, 8.4, 8.5, 6.06, 6.1, 6.1, 6.1, 10.5, 10.5, 15, 15, 'Handling Charges (single box > 100 kg)', 'INR 1.15/kg, minimum INR 200'],
    ['12', 'S4', 9.36, 10, 10, 10, 10.2, 10.2, 8.5, 8.5, 6.1, 6.1, 6.1, 6.1, 10.5, 10.5, 15, 15, 'Green Tax', 'INR 75/- per docket'],
    ['13', 'E1', 9, 9.71, 10, 10.5, 11.11, 10.28, 10.2, 10.2, 8.9, 9, 8.9, 8.9, 5.5, 5.5, 10.81, 12, 'COD Charges', 'Not Applicable'],
    ['14', 'E2', 9, 9.71, 10, 10.5, 10.28, 10.73, 10.2, 10.2, 8.9, 9, 9, 9, 5.5, 5.5, 12, 12, 'Maximum Liability Cap', 'INR 5,000/- per docket'],
    ['15', 'NE1', 15, 15, 15, 15, 13, 13, 15, 15, 15, 15, 15, 15, 10.7, 11, 9.8, 9.8, 'Payment Mode', 'Wallet Recharge Only (Prepaid)'],
    ['16', 'NE2', 15, 15, 15, 15, 13, 13, 15, 15, 15, 15, 15, 15, 11, 11, 9.8, 10, 'Courier', 'Delhivery'],
    [],
    [],
    ['Zone', 'Coverage'],
    ['N1', 'Delhi-NCR, Chandigarh, Jaipur'],
    ['N2', 'Ludhiana, Dehradun'],
    ['N3', 'UP, Rajasthan, Punjab, Haryana'],
    ['N4', 'J&K, Uttarakhand, HP'],
    ['C1', 'Raipur, Indore, Bhopal'],
    ['C2', 'MP, Chhattisgarh'],
    ['W1', 'Surat, Pune, Mumbai, Ahmedabad'],
    ['W2', 'Maharashtra, Gujarat, Goa'],
    ['S1', 'Chennai, Hyderabad, Bangalore'],
    ['S2', 'Telangana, Karnataka, AP'],
    ['S3', 'Tamil Nadu, Coimbatore, Pondicherry'],
    ['S4', 'Kerala'],
    ['E1', 'Siliguri, Patna, Kolkata, Bhubaneswar'],
    ['E2', 'West Bengal, Jharkhand, Orissa, Bihar'],
    ['NE1', 'Guwahati'],
    ['NE2', 'Rest of North East']
  ];
  const wsDelhivery = XLSX.utils.aoa_to_sheet(delhiveryData);
  XLSX.utils.book_append_sheet(wb, wsDelhivery, 'Delhivery');

  // 2. Ekart Sheet
  const ekartData = [
    ['', '', '← Destinations: North & Central (N1–W2)', '', '', '', '', '', '', 'Destinations: South, East & North-East (S1–NE2) →', '', '', '', '', '', '', '', '', 'Docket Fee', 'INR 65/- per docket'],
    ['#', 'Origin \\ Dest →', 'N1', 'N2', 'N3', 'N4', 'C1', 'C2', 'W1', 'W2', 'S1', 'S2', 'S3', 'S4', 'E1', 'E2', 'NE1', 'NE2', 'Fuel Surcharge (FSC)', '15% on base freight'],
    ['1', 'N1', 6.5, 6.5, 6.5, 7, 8.5, 8.5, 9, 9, 9, 9.5, 9.5, 9.5, 9.5, 9.5, 16, 16, 'Freight on Value (FOV)', 'Higher of INR 50 or 0.05% of invoice value'],
    ['2', 'N2', 6.5, 6.5, 6.8, 7, 9, 9, 9.5, 9.5, 9.5, 9.5, 9.5, 9.5, 9.5, 9.5, 16, 16, 'Volumetric Divisor', 'L × B × H / 4500'],
    ['3', 'N3', 7.1, 7.06, 7.1, 7.1, 9, 9, 9.5, 9.5, 9.5, 9.5, 9.5, 9.5, 9.5, 9.5, 16, 16, 'Minimum Chargeable Weight', '20 kg per docket'],
    ['4', 'N4', 7.1, 7.1, 7.1, 7.1, 9, 9, 9.5, 9.5, 9.5, 9.5, 9.5, 9.5, 9.5, 9.5, 16, 16, 'ODA Charges', 'Higher of INR 550 or INR 2.25/kg'],
    ['5', 'C1', 8.5, 8.5, 8.5, 8.5, 6.5, 6.5, 9.8, 9.8, 8, 8.5, 8.5, 8.5, 10, 10, 14, 14, 'Appointment / ABD Deliveries', 'Higher of INR 550 or INR 3/kg (above base + FSC)'],
    ['6', 'C2', 8.5, 8.5, 8.5, 8.5, 6.64, 6.5, 9.8, 9.8, 8.5, 8.5, 8.5, 8.5, 10, 10, 14, 14, 'Reattempt Charges (beyond free attempts)', 'Higher of INR 500 or INR 2/kg'],
    ['7', 'W1', 9, 9, 9, 9, 9, 9, 7, 7, 8.5, 8.5, 8.5, 8.5, 10.5, 11, 15.22, 16, 'Mall / Special Deliveries', 'Higher of INR 500 or INR 2/kg'],
    ['8', 'W2', 9, 9, 9, 9, 9.5, 9.5, 7, 7, 8.5, 8.5, 8.5, 8.5, 11, 11, 16, 16, 'Free Delivery Attempts', '3 attempts'],
    ['9', 'S1', 9.76, 10.71, 11, 11, 11.2, 11.2, 9.4, 9.4, 6.2, 6.64, 7, 7.1, 11, 11.26, 16, 16, 'RTO Charges', 'Same as forward freight'],
    ['10', 'S2', 9.76, 11, 11, 11, 11.2, 11.2, 9.4, 9.5, 6.82, 6.93, 7, 7.1, 11.5, 11.26, 16, 16, 'Demurrage (post 7 free days at hub)', 'INR 1.50/day/kg, minimum INR 100/day/docket'],
    ['11', 'S3', 10.18, 11, 11, 11, 11.2, 11.2, 9.4, 9.5, 7.06, 7.1, 7.1, 7.1, 11.5, 11.5, 16, 16, 'Handling Charges (single box > 100 kg)', 'INR 1.15/kg, minimum INR 200'],
    ['12', 'S4', 10.36, 11, 11, 11, 11.2, 11.2, 9.5, 9.5, 7.1, 7.1, 7.1, 7.1, 11.5, 11.5, 16, 16, 'Green Tax', 'INR 75/- per docket'],
    ['13', 'E1', 10, 10.71, 11, 11.5, 12.11, 11.28, 11.2, 11.2, 9.9, 10, 9.9, 9.9, 6.5, 6.5, 11.81, 13, 'COD Charges', 'Not Applicable'],
    ['14', 'E2', 10, 10.71, 11, 11.5, 11.28, 11.73, 11.2, 11.2, 9.9, 10, 10, 10, 6.5, 6.5, 13, 13, 'Maximum Liability Cap', 'INR 5,000/- per docket'],
    ['15', 'NE1', 16, 16, 16, 16, 14, 14, 16, 16, 16, 16, 16, 16, 11.7, 12, 10.8, 10.8, '', ''],
    ['16', 'NE2', 16, 16, 16, 16, 14, 14, 16, 16, 16, 16, 16, 16, 12, 12, 10.8, 11, 'Courier', 'Ekart'],
    [],
    [],
    ['Zone', 'Coverage'],
    ['N1', 'Delhi-NCR, Chandigarh, Jaipur'],
    ['N2', 'Ludhiana, Dehradun'],
    ['N3', 'UP, Rajasthan, Punjab, Haryana'],
    ['N4', 'J&K, Uttarakhand, HP'],
    ['C1', 'Raipur, Indore, Bhopal'],
    ['C2', 'MP, Chhattisgarh'],
    ['W1', 'Surat, Pune, Mumbai, Ahmedabad'],
    ['W2', 'Maharashtra, Gujarat, Goa'],
    ['S1', 'Chennai, Hyderabad, Bangalore'],
    ['S2', 'Telangana, Karnataka, AP'],
    ['S3', 'Tamil Nadu, Coimbatore, Pondicherry'],
    ['S4', 'Kerala'],
    ['E1', 'Siliguri, Patna, Kolkata, Bhubaneswar'],
    ['E2', 'West Bengal, Jharkhand, Orissa, Bihar'],
    ['NE1', 'Guwahati'],
    ['NE2', 'Rest of North East']
  ];
  const wsEkart = XLSX.utils.aoa_to_sheet(ekartData);
  XLSX.utils.book_append_sheet(wb, wsEkart, 'Ekart');

  // 3. Movin Standard Premium Sheet (14x14 matrix)
  const movinData = [
    ['From/To', 'C1', 'C2', 'E1', 'E2', 'N1', 'N2', 'N3', 'NE1', 'NE2', 'S1', 'S2', 'S3', 'W1', 'W2', '', 'Cost Component', 'Description/Details'],
    ['C1', 7.52, 7.74, 8.9, 8.6, 8.38, 8.38, 8.9, 19.35, 23.65, 8.9, 8.9, 10.75, 8.38, 8.38, '', 'Minimum Billable Weight', '20 kg per consignment'],
    ['C2', 7.74, 7.74, 8.6, 8.38, 8.6, 8.6, 9.67, 23.65, 23.65, 8.6, 8.9, 9.67, 8.6, 8.38, '', 'Minimum Shipment Charge', 'INR 300.00'],
    ['E1', 8.9, 8.6, 7.52, 7.74, 9.67, 9.67, 13.6, 8.6, 8.9, 9.67, 9.67, 13.6, 10.75, 10.75, '', 'Fuel Surcharge (FSC)', '15% of Base Freight'],
    ['E2', 8.6, 8.38, 7.74, 7.74, 8.9, 8.9, 10.75, 8.9, 9.67, 8.9, 9.67, 13.6, 9.67, 9.67, '', 'Volume Weight Divisor', '4500 (L x B x H in cm ÷ 4500 = volume weight in kg)'],
    ['N1', 8.38, 8.6, 9.67, 8.9, 7.52, 7.74, 8.38, 19.35, 23.65, 10.75, 10.75, 19.35, 8.9, 9.67, '', 'Docket Fee', 'INR 75 per shipment'],
    ['N2', 8.38, 8.6, 9.67, 8.9, 7.74, 7.74, 8.6, 23.65, 23.65, 10.75, 10.75, 19.35, 8.9, 9.67, '', 'Additional Handling Charge', 'INR 50 per package'],
    ['N3', 8.9, 9.67, 13.6, 10.75, 8.38, 8.6, 8.38, 23.65, 23.65, 19.35, 19.35, 23.65, 10.75, 10.75, '', 'Over Maximum Charge', 'INR 600 per package'],
    ['NE1', 19.35, 23.65, 8.6, 8.9, 19.35, 23.65, 23.65, 8.38, 8.6, 19.35, 23.65, 23.65, 19.35, 23.65, '', 'Special Handling of Undeliverable Shipments', 'INR 600 per shipment'],
    ['NE2', 23.65, 23.65, 8.9, 9.67, 23.65, 23.65, 23.65, 8.6, 8.6, 23.65, 23.65, 23.65, 23.65, 23.65, '', 'Address Correction', 'INR 300 per shipment, no discount = Net INR 300.00'],
    ['S1', 8.9, 8.6, 9.67, 8.9, 10.75, 10.75, 19.35, 19.35, 23.65, 7.74, 7.74, 8.38, 8.6, 8.6, '', 'Appointment Delivery', 'Min INR 550 per shipment or INR 2.50 per kg, whichever is higher'],
    ['S2', 8.9, 8.9, 9.67, 9.67, 10.75, 10.75, 19.35, 23.65, 23.65, 7.74, 8.38, 8.38, 8.6, 8.6, '', 'Demurrage Charge', 'Min INR 600 or INR 2/kg/day'],
    ['S3', 10.75, 9.67, 13.6, 13.6, 19.35, 19.35, 23.65, 23.65, 23.65, 8.38, 8.38, 7.52, 8.9, 8.9, '', 'Print Return Label', 'INR 150 per shipment'],
    ['W1', 8.38, 8.6, 10.75, 9.67, 8.9, 8.9, 10.75, 19.35, 23.65, 8.6, 8.6, 8.9, 7.52, 7.74, '', "Owner's Risk (Freight on Value)", '0.1% of declared value, minimum INR 150 per shipment'],
    ['W2', 8.38, 8.38, 10.75, 9.67, 9.67, 9.67, 10.75, 23.65, 23.65, 8.6, 8.6, 8.9, 7.74, 7.74, '', 'Large Package Surcharge (LPS)', 'INR 500'],
    ['Zone', 'Coverage'],
    ['N1', 'Delhi-NCR, Chandigarh, Jaipur'],
    ['N2', 'Ludhiana, Dehradun'],
    ['N3', 'UP, Rajasthan, Punjab, Haryana'],
    ['N4', 'J&K, Uttarakhand, HP'],
    ['C1', 'Raipur, Indore, Bhopal'],
    ['C2', 'MP, Chhattisgarh'],
    ['W1', 'Surat, Pune, Mumbai, Ahmedabad'],
    ['W2', 'Maharashtra, Gujarat, Goa'],
    ['S1', 'Chennai, Hyderabad, Bangalore'],
    ['S2', 'Telangana, Karnataka, AP'],
    ['S3', 'Tamil Nadu, Coimbatore, Pondicherry'],
    ['S4', 'Kerala'],
    ['E1', 'Siliguri, Patna, Kolkata, Bhubaneswar'],
    ['E2', 'West Bengal, Jharkhand, Orissa, Bihar'],
    ['NE1', 'Guwahati'],
    ['NE2', 'Rest of North East']
  ];
  const wsMovin = XLSX.utils.aoa_to_sheet(movinData);
  XLSX.utils.book_append_sheet(wb, wsMovin, 'Movin Standard Premium');

  const destPath = path.resolve('Shypfy B2B Rate Card Courier Wise_50 (3).xlsx');
  XLSX.writeFile(wb, destPath);
  console.log(`Successfully generated: ${destPath}`);
}

createSampleWorkbook();
