// Mirrors packages/shared. Keep in sync, or generate from apps/api/openapi.json.

const religions = [
  'HINDU',
  'CHRISTIAN',
  'MUSLIM',
  'JAIN',
  'SIKH',
  'BUDDHIST',
  'OTHER',
  'NONE',
];
const maritalStatuses = [
  'NEVER_MARRIED',
  'DIVORCED',
  'WIDOWED',
  'AWAITING_DIVORCE',
];
const keralaDistricts = [
  'THIRUVANANTHAPURAM',
  'KOLLAM',
  'PATHANAMTHITTA',
  'ALAPPUZHA',
  'KOTTAYAM',
  'IDUKKI',
  'ERNAKULAM',
  'THRISSUR',
  'PALAKKAD',
  'MALAPPURAM',
  'KOZHIKODE',
  'WAYANAD',
  'KANNUR',
  'KASARAGOD',
];
const stars = [
  'ASWATHY',
  'BHARANI',
  'KARTHIKA',
  'ROHINI',
  'MAKAYIRAM',
  'THIRUVATHIRA',
  'PUNARTHAM',
  'POOYAM',
  'AYILYAM',
  'MAKAM',
  'POORAM',
  'UTHRAM',
  'ATHAM',
  'CHITHIRA',
  'CHOTHI',
  'VISAKHAM',
  'ANIZHAM',
  'THRIKKETTA',
  'MOOLAM',
  'POORADAM',
  'UTHRADAM',
  'THIRUVONAM',
  'AVITTAM',
  'CHATHAYAM',
  'POORURUTTATHI',
  'UTHRATTATHI',
  'REVATHI',
];
const countries = {
  'IN': 'India',
  'AE': 'United Arab Emirates',
  'SA': 'Saudi Arabia',
  'QA': 'Qatar',
  'KW': 'Kuwait',
  'OM': 'Oman',
  'BH': 'Bahrain',
  'GB': 'United Kingdom',
  'US': 'United States',
  'CA': 'Canada',
  'AU': 'Australia',
  'NZ': 'New Zealand',
  'IE': 'Ireland',
  'DE': 'Germany',
  'SG': 'Singapore',
  'MY': 'Malaysia',
};

String humanize(String v) {
  final s = v.replaceAll('_', ' ').toLowerCase();
  return s.isEmpty ? s : s[0].toUpperCase() + s.substring(1);
}

/// Government IDs accepted for verification (packages/shared/src/verification.ts).
const idDocumentTypes = {
  'AADHAAR': 'Aadhaar card',
  'PASSPORT': 'Passport',
  'EMIRATES_ID': 'Emirates ID',
  'DRIVING_LICENCE': 'Driving licence',
  'NATIONAL_ID': 'Other national ID',
};

/// Passports have one page to photograph; other cards need front and back.
bool idNeedsBack(String type) => type != 'PASSPORT';
