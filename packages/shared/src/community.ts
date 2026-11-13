import type { RELIGIONS } from './profile';

type Religion = (typeof RELIGIONS)[number];

/**
 * A caste, denomination or sect, with its sub-castes. `aliases` are other common spellings,
 * so typed text such as "ezhava" or "Thiyya" lands on one canonical name and search matches it.
 */
export interface Community {
  name: string;
  subs?: readonly string[];
  aliases?: readonly string[];
  /** Mostly from outside Kerala; listed after the Kerala communities. */
  outsideKerala?: boolean;
}

/** Shown in every list; the member types their own value when they pick it. */
export const OTHER_COMMUNITY = 'Other';

const HINDU: Community[] = [
  // Kerala forward communities
  {
    name: 'Nair',
    aliases: ['Nayar', 'Nair (NSS)'],
    subs: [
      'Kiriyathil Nair',
      'Illathu Nair',
      'Swaroopathil Nair',
      'Charnavar Nair',
      'Pallichan Nair',
      'Vattakkadan Nair',
      'Vilakkithala Nair',
      'Veluthedathu Nair',
      'Menon',
      'Pillai',
      'Kurup',
      'Nambiar',
      'Panicker',
      'Kaimal',
      'Kartha',
      'Unnithan',
      'Thampi',
      'Valiathan',
      'Nayanar',
      'Mannadiar',
      'Kidavu',
      'Adiyodi',
      'Achan',
      'Marar (Nair)',
      'Menoki',
      'Nedungadi',
      'Elayath',
    ],
  },
  {
    name: 'Brahmin',
    aliases: ['Brahman'],
    subs: [
      'Namboothiri',
      'Potti',
      'Embranthiri',
      'Pushpaka Brahmin',
      'Iyer',
      'Iyengar',
      'Gowda Saraswat Brahmin (GSB)',
      'Saraswat',
      'Konkani Brahmin',
      'Tulu Brahmin',
      'Havyaka',
      'Shivalli',
      'Vaidiki',
      'Niyogi',
      'Deshastha',
      'Chitpavan',
      'Karhade',
      'Madhwa',
      'Smartha',
      'Gaur',
      'Kanyakubj',
      'Maithil',
      'Saryuparin',
      'Bhumihar',
    ],
  },
  { name: 'Namboothiri', aliases: ['Namboodiri', 'Nambudiri', 'Namputiri'] },
  {
    name: 'Ambalavasi',
    aliases: ['Ambalavasi Nair'],
    subs: [
      'Warrier',
      'Marar',
      'Pisharody',
      'Nambeesan',
      'Poduval',
      'Chakyar',
      'Nambiar (Ambalavasi)',
      'Pushpakan',
      'Theeyattunni',
      'Kurukkal',
      'Unni',
      'Moothathu',
      'Ilayathu',
      'Adikal',
      'Pidaran',
      'Thiyyadi Nambiar',
    ],
  },
  {
    name: 'Kshatriya',
    aliases: ['Samanthan', 'Samantha Kshatriya'],
    subs: [
      'Varma',
      'Thampuran',
      'Thirumulpad',
      'Raja',
      'Eradi',
      'Vellodi',
      'Nedungadi',
      'Thampan',
      'Koil Thampuran',
    ],
  },
  { name: 'Vaishya', aliases: ['Vaishya Vani'] },
  // Kerala backward communities
  {
    name: 'Ezhava',
    aliases: ['Ezhavas', 'Izhava', 'Elava', 'Ezhava (SNDP)', 'Chovan'],
    subs: [
      'Ezhava',
      'Chovan',
      'Ezhava Panicker',
      'Ezhava Thandan',
      'Illathu Ezhava',
      'Ezhavathi',
      'Kaikolan',
    ],
  },
  {
    name: 'Thiyya',
    aliases: ['Thiyyar', 'Tiyya', 'Theeya', 'Billava'],
    subs: ['Thiyya', 'Thandan', 'Billava'],
  },
  {
    name: 'Vishwakarma',
    aliases: ['Viswakarma', 'Kammala', 'Kammalar'],
    subs: [
      'Asari',
      'Moosari',
      'Thattan',
      'Kollan',
      'Karuvan',
      'Kalthachan',
      'Kallasari',
      'Pandikasala',
    ],
  },
  {
    name: 'Dheevara',
    aliases: ['Dheevaran', 'Araya', 'Arayan'],
    subs: [
      'Araya',
      'Valan',
      'Mukkuva',
      'Mukaya',
      'Bovi',
      'Nulayan',
      'Arayavathi',
      'Marakkan',
      'Pathiyan',
    ],
  },
  { name: 'Ezhuthachan', aliases: ['Ezhuthassan', 'Kadupattan'] },
  {
    name: 'Vaniya',
    aliases: ['Vaniyan', 'Vaniya Chettiar', 'Vania'],
    subs: ['Vaniya', 'Vanika Vaisya', 'Chakkala', 'Vaniyar'],
  },
  { name: 'Chakkala', aliases: ['Chakkala Nair'] },
  {
    name: 'Yadava',
    aliases: ['Yadav', 'Maniyani', 'Eruman', 'Kolaya'],
    subs: ['Maniyani', 'Eruman', 'Kolaya', 'Ayar', 'Golla', 'Idaiyar'],
  },
  { name: 'Kudumbi', aliases: ['Kudumbi Konkani'] },
  {
    name: 'Veerashaiva',
    aliases: ['Lingayat', 'Veerasaiva'],
    subs: ['Veerashaiva', 'Lingayat', 'Jangam', 'Yogeeswara', 'Malavettuvan'],
  },
  {
    name: 'Ganaka',
    aliases: ['Kaniyan', 'Kanisan', 'Kaniyar', 'Panicker (Ganaka)'],
    subs: ['Kaniyan', 'Kanisan', 'Panicker', 'Kalari Panicker', 'Kalari Kurup'],
  },
  { name: 'Vilakkithala Nair', aliases: ['Vilakkithalanair', 'Ambattan', 'Ossan'] },
  { name: 'Veluthedathu Nair', aliases: ['Veluthedan', 'Vannathan'] },
  { name: 'Devanga', aliases: ['Devanga Chettiar'] },
  { name: 'Saliya', aliases: ['Chaliya', 'Chaliyan', 'Pattariya'] },
  { name: 'Sourashtra', aliases: ['Saurashtra'] },
  {
    name: 'Nadar',
    aliases: ['Hindu Nadar', 'Shanar', 'Channar'],
    subs: ['Hindu Nadar', 'Nadar (SIUC)', 'Grammani'],
  },
  {
    name: 'Vellalar',
    aliases: ['Vellala', 'Vellala Pillai'],
    subs: [
      'Saiva Vellalar',
      'Karkathar',
      'Kodikal Pillai',
      'Nanchil Nattu Vellalar',
      'Thondaimandala',
    ],
  },
  {
    name: 'Mudaliar',
    aliases: ['Mudaliyar'],
    subs: ['Sengunthar', 'Agamudaya', 'Thuluva Vellala', 'Kaikolar'],
  },
  {
    name: 'Chettiar',
    aliases: ['Chetty', 'Chetti'],
    subs: [
      'Vaniya Chettiar',
      'Nattukottai',
      'Devanga',
      'Kudumbi Chetti',
      '24 Manai Telugu Chettiar',
      'Arya Vysya',
    ],
  },
  { name: 'Reddiar', aliases: ['Reddy', 'Reddiyar'] },
  { name: 'Naidu', aliases: ['Naicker', 'Nayakar'] },
  { name: 'Kusavan', aliases: ['Kulala', 'Kumbaran', 'Velan (Kusavan)', 'Odan', 'Andhra Nair'] },
  { name: 'Mannan', aliases: ['Vannan', 'Pathiyan (Mannan)'] },
  { name: 'Kaikolan', aliases: ['Kaikolar', 'Sengunthar'] },
  { name: 'Padmasali', aliases: ['Padmashali'] },
  { name: 'Thandan' },
  { name: 'Moopan' },
  { name: 'Pulluvan' },
  { name: 'Panan' },
  { name: 'Velan' },
  { name: 'Thachar', aliases: ['Thachan', 'Asari (Thachar)'] },
  // Scheduled castes and tribes of Kerala
  {
    name: 'Scheduled Caste',
    aliases: ['SC', 'Dalit'],
    subs: [
      'Pulaya',
      'Cheramar',
      'Paraya',
      'Sambava',
      'Kurava',
      'Sidhanar',
      'Thandan (SC)',
      'Vettuvan',
      'Pallan',
      'Kanakkan',
      'Padanna',
      'Ulladan',
      'Mala Panickar',
      'Vedan',
      'Nayadi',
      'Arunthathiyar',
      'Chakkiliyan',
      'Kootan',
      'Pulayan Vettuvan',
      'Kavara',
      'Thoti',
      'Velan (SC)',
      'Panan (SC)',
      'Pathiyan',
      'Bharathar',
      'Adi Dravida',
      'Kalladi',
    ],
  },
  { name: 'Pulaya', aliases: ['Pulayar', 'Cheramar', 'Cheraman'] },
  { name: 'Paraya', aliases: ['Parayan', 'Sambava', 'Sambavar'] },
  { name: 'Kurava', aliases: ['Kuravan', 'Sidhanar'] },
  {
    name: 'Scheduled Tribe',
    aliases: ['ST', 'Adivasi'],
    subs: [
      'Kurichiya',
      'Kuruma',
      'Paniya',
      'Adiya',
      'Irular',
      'Muthuvan',
      'Malayarayan',
      'Malai Arayan',
      'Ulladan (ST)',
      'Malavettuvan',
      'Kattunayakan',
      'Mannan (ST)',
      'Kanikkaran',
      'Malampandaram',
      'Uraly',
      'Hill Pulaya',
      'Mavilan',
      'Marati',
      'Koraga',
      'Cholanaikkan',
      'Kadar',
      'Kani',
      'Malasar',
      'Mudugar',
      'Malayan',
    ],
  },
  // Major communities from elsewhere in India
  { name: 'Bunt', aliases: ['Bunts', 'Shetty'], outsideKerala: true },
  { name: 'Vokkaliga', aliases: ['Gowda'], outsideKerala: true },
  { name: 'Kamma', outsideKerala: true },
  { name: 'Kapu', aliases: ['Telaga', 'Balija'], outsideKerala: true },
  { name: 'Velama', outsideKerala: true },
  { name: 'Raju', aliases: ['Kshatriya Raju'], outsideKerala: true },
  { name: 'Arya Vysya', aliases: ['Komati'], outsideKerala: true },
  { name: 'Gounder', aliases: ['Kongu Vellala Gounder'], outsideKerala: true },
  {
    name: 'Thevar',
    aliases: ['Mukkulathor', 'Kallar', 'Maravar', 'Agamudayar'],
    outsideKerala: true,
  },
  { name: 'Vanniyar', aliases: ['Vanniya Kula Kshatriya', 'Padayachi'], outsideKerala: true },
  { name: 'Maratha', outsideKerala: true },
  { name: 'Kunbi', outsideKerala: true },
  { name: 'Rajput', outsideKerala: true },
  { name: 'Jat', outsideKerala: true },
  { name: 'Gujjar', outsideKerala: true },
  { name: 'Kayastha', outsideKerala: true },
  { name: 'Khatri', outsideKerala: true },
  { name: 'Arora', outsideKerala: true },
  { name: 'Agarwal', aliases: ['Aggarwal'], outsideKerala: true },
  { name: 'Baniya', aliases: ['Bania', 'Vaish'], outsideKerala: true },
  { name: 'Marwari', outsideKerala: true },
  { name: 'Patel', aliases: ['Patidar'], outsideKerala: true },
  { name: 'Kurmi', outsideKerala: true },
  { name: 'Koli', outsideKerala: true },
  { name: 'Sindhi', outsideKerala: true },
  { name: 'Ahom', outsideKerala: true },
];

const CHRISTIAN: Community[] = [
  {
    name: 'Syro-Malabar Catholic',
    aliases: ['Syro Malabar', 'Syro-Malabar', 'Syrian Catholic', 'RC Syrian', 'SMC'],
    subs: ['Syro-Malabar', 'Knanaya Catholic', 'Syrian Catholic (Nasrani)'],
  },
  {
    name: 'Latin Catholic',
    aliases: ['Latin', 'Roman Catholic (Latin)', 'Latin Rite'],
    subs: [
      'Latin Catholic',
      'Anglo-Indian',
      'Mukkuva Christian',
      'Nadar Christian',
      'Konkani Catholic',
      'Mangalorean Catholic',
      'Goan Catholic',
    ],
  },
  { name: 'Roman Catholic', aliases: ['RC', 'Catholic'] },
  { name: 'Syro-Malankara Catholic', aliases: ['Malankara Catholic', 'Syro Malankara'] },
  {
    name: 'Knanaya',
    aliases: ['Knanaya Christian', 'Southist', 'Thekkumbhagar'],
    subs: ['Knanaya Catholic', 'Knanaya Jacobite', 'Knanaya Malankara Catholic'],
  },
  {
    name: 'Malankara Orthodox Syrian',
    aliases: ['Orthodox', 'Indian Orthodox', 'Orthodox Syrian', 'Malankara Orthodox'],
  },
  { name: 'Jacobite Syrian', aliases: ['Jacobite', 'Syrian Orthodox', 'Jacobite Syrian Orthodox'] },
  { name: 'Marthoma', aliases: ['Mar Thoma', 'Marthoma Syrian', 'Mar Thoma Syrian'] },
  { name: 'Church of South India (CSI)', aliases: ['CSI', 'Church of South India'] },
  {
    name: 'Church of North India (CNI)',
    aliases: ['CNI', 'Church of North India'],
    outsideKerala: true,
  },
  {
    name: 'Pentecostal',
    aliases: ['Pentecost', 'Penthecostal'],
    subs: [
      'Indian Pentecostal Church (IPC)',
      'Assemblies of God',
      'Church of God',
      'Sharon Fellowship',
      'The Pentecostal Mission (TPM)',
      'New India Church of God',
      'Full Gospel',
      'Ceylon Pentecostal Mission',
    ],
  },
  { name: 'St. Thomas Evangelical', aliases: ['St Thomas Evangelical', 'STECI'] },
  { name: 'Brethren', aliases: ['Plymouth Brethren', 'Kerala Brethren'] },
  { name: 'Chaldean Syrian', aliases: ['Assyrian Church of the East', 'Chaldean'] },
  { name: 'Malabar Independent Syrian', aliases: ['Thozhiyur Sabha', 'Thozhiyoor'] },
  { name: 'Evangelical', aliases: ['Born Again'] },
  { name: 'Believers Eastern Church', aliases: ['Believers Church', 'Believers'] },
  { name: 'Seventh-day Adventist', aliases: ['Adventist', 'SDA'] },
  { name: 'Salvation Army' },
  { name: 'Anglican', aliases: ['Church of England'] },
  { name: 'Lutheran' },
  { name: 'Methodist' },
  { name: 'Baptist' },
  { name: 'Presbyterian' },
  { name: 'Protestant' },
  { name: 'Jehovah’s Witness', aliases: ["Jehovah's Witness", 'Jehovahs Witness'] },
  { name: 'Christian (no denomination)', aliases: ['Non-denominational'] },
];

const MUSLIM: Community[] = [
  {
    name: 'Sunni',
    aliases: ['Sunni Muslim'],
    subs: ['Samastha (EK Sunni)', 'Kanthapuram (AP Sunni)', 'Shafi', 'Hanafi', 'Sunni (other)'],
  },
  {
    name: 'Mujahid',
    aliases: ['Salafi', 'KNM', 'Nadvathul Mujahideen'],
    subs: ['KNM', 'KNM (Markaz Dawa)', 'Wisdom', 'Salafi'],
  },
  { name: 'Jamaat-e-Islami', aliases: ['Jamaat', 'Jamaate Islami'] },
  { name: 'Thablighi', aliases: ['Tablighi Jamaat', 'Tabligh'] },
  {
    name: 'Shia',
    aliases: ['Shia Muslim', 'Shiite'],
    subs: ['Ithna Ashari', 'Dawoodi Bohra', 'Ismaili', 'Khoja'],
  },
  { name: 'Thangal (Sayyid)', aliases: ['Thangal', 'Sayyid', 'Syed', 'Sayed'] },
  { name: 'Mappila', aliases: ['Moplah', 'Mappilla', 'Malabar Muslim'] },
  { name: 'Rowther', aliases: ['Ravuthar', 'Rawther', 'Rowthar'] },
  { name: 'Pathan', aliases: ['Pattani', 'Khan'] },
  { name: 'Dakhni', aliases: ['Deccani', 'Dakhini'] },
  { name: 'Lebbai', aliases: ['Labbai', 'Lebba'] },
  { name: 'Marakkar', aliases: ['Marakayar', 'Marakkayar'] },
  { name: 'Ossan', aliases: ['Osan'] },
  { name: 'Pusalan', aliases: ['Puslar', 'Pusala', 'Kadalora Muslim'] },
  { name: 'Keyi', aliases: ['Keyee'] },
  { name: 'Koya', aliases: ['Koyas'] },
  { name: 'Memon', aliases: ['Kutchi Memon', 'Memons'], outsideKerala: true },
  { name: 'Bohra', aliases: ['Dawoodi Bohra', 'Bohri'], outsideKerala: true },
  { name: 'Beary', aliases: ['Byari', 'Bearys'], outsideKerala: true },
  { name: 'Navayath', aliases: ['Nawayath'], outsideKerala: true },
  { name: 'Ansari', outsideKerala: true },
  { name: 'Qureshi', aliases: ['Qureshy'], outsideKerala: true },
  { name: 'Muslim (no sect)', aliases: ['Just Muslim'] },
];

const JAIN: Community[] = [
  { name: 'Digambar', aliases: ['Digambara'] },
  {
    name: 'Shwetambar',
    aliases: ['Swetambar', 'Svetambara'],
    subs: ['Murtipujak', 'Sthanakvasi', 'Terapanthi'],
  },
  { name: 'Gujarati Jain', aliases: ['Jain (Gujarati)'] },
  { name: 'Marwari Jain', aliases: ['Jain (Marwari)'] },
  { name: 'Jain (no sect)' },
];

const SIKH: Community[] = [
  { name: 'Jat Sikh', aliases: ['Jatt', 'Jat'] },
  { name: 'Khatri Sikh', aliases: ['Khatri'] },
  { name: 'Arora Sikh', aliases: ['Arora'] },
  { name: 'Ramgarhia' },
  { name: 'Saini' },
  { name: 'Ravidasia', aliases: ['Ramdasia'] },
  { name: 'Mazhabi', aliases: ['Mazhabi Sikh'] },
  { name: 'Kamboj' },
  { name: 'Ahluwalia' },
  { name: 'Lubana' },
  { name: 'Sikh (no caste)' },
];

const BUDDHIST: Community[] = [
  { name: 'Theravada' },
  { name: 'Mahayana' },
  { name: 'Vajrayana', aliases: ['Tibetan Buddhist'] },
  { name: 'Navayana', aliases: ['Neo-Buddhist', 'Ambedkarite'] },
  { name: 'Buddhist (no school)' },
];

const OTHER_RELIGION: Community[] = [
  { name: 'Parsi', aliases: ['Zoroastrian', 'Irani'] },
  { name: 'Jewish', aliases: ['Cochin Jew', 'Malabar Jew'] },
  { name: 'Bahai', aliases: ["Baha'i"] },
  { name: 'Spiritual', aliases: ['Spiritual but not religious'] },
];

/** Castes, denominations and sects for each religion, Kerala first. */
export const COMMUNITIES: Record<Religion, readonly Community[]> = {
  HINDU,
  CHRISTIAN,
  MUSLIM,
  JAIN,
  SIKH,
  BUDDHIST,
  OTHER: OTHER_RELIGION,
  NONE: [],
};

/** What each religion calls the "community" field, so the form reads naturally. */
export const COMMUNITY_LABEL: Record<Religion, string> = {
  HINDU: 'Caste',
  CHRISTIAN: 'Denomination',
  MUSLIM: 'Sect or community',
  JAIN: 'Sect',
  SIKH: 'Caste',
  BUDDHIST: 'School',
  OTHER: 'Community',
  NONE: 'Community',
};
export const SUB_COMMUNITY_LABEL: Record<Religion, string> = {
  HINDU: 'Sub-caste',
  CHRISTIAN: 'Church or rite',
  MUSLIM: 'Sub-sect',
  JAIN: 'Sub-sect',
  SIKH: 'Sub-caste',
  BUDDHIST: 'Tradition',
  OTHER: 'Sub-community',
  NONE: 'Sub-community',
};

const key = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '');

/** Lookup tables per religion, plus one across all religions (a religion's own entries win). */
function buildIndex(lists: readonly (readonly Community[])[]) {
  const names = new Map<string, string>();
  const subs = new Map<string, string>();
  for (const list of lists)
    for (const c of list) {
      for (const n of [c.name, ...(c.aliases ?? [])])
        if (!names.has(key(n))) names.set(key(n), c.name);
      for (const s of c.subs ?? []) if (!subs.has(key(s))) subs.set(key(s), s);
    }
  return { names, subs };
}
const indexes = new Map(Object.entries(COMMUNITIES).map(([r, list]) => [r, buildIndex([list])]));
const anyIndex = buildIndex(Object.values(COMMUNITIES));
const indexFor = (religion?: string | null) => (religion && indexes.get(religion)) || anyIndex;

/** The communities for a religion, or every community when no religion is given. */
export function communitiesFor(religion?: string | null): readonly Community[] {
  if (religion && religion in COMMUNITIES) return COMMUNITIES[religion as Religion];
  return Object.values(COMMUNITIES).flat();
}

/** Sub-castes listed under a community (empty when it has none). */
export function subCommunitiesFor(
  religion: string | null | undefined,
  community: string | null | undefined,
): readonly string[] {
  if (!community) return [];
  const canonical = normalizeCommunity(community, religion);
  return communitiesFor(religion).find((c) => c.name === canonical)?.subs ?? [];
}

/** Maps typed text or an alias to the canonical community name; unknown text is kept as typed. */
export function normalizeCommunity(value: string, religion?: string | null): string {
  const v = value.trim().replace(/\s+/g, ' ');
  return indexFor(religion).names.get(key(v)) ?? v;
}

export function normalizeSubCommunity(value: string, religion?: string | null): string {
  const v = value.trim().replace(/\s+/g, ' ');
  return indexFor(religion).subs.get(key(v)) ?? v;
}

/** Search communities by name or alias, best matches first. */
export function searchCommunities(query: string, religion?: string | null): Community[] {
  const list = [...communitiesFor(religion)];
  const q = key(query);
  if (!q) return list;
  const score = (c: Community) => {
    const names = [c.name, ...(c.aliases ?? []), ...(c.subs ?? [])].map(key);
    if (names[0].startsWith(q)) return 0;
    if (names.some((n) => n.startsWith(q))) return 1;
    if (names.some((n) => n.includes(q))) return 2;
    return 9;
  };
  return list
    .map((c) => [c, score(c)] as const)
    .filter(([, s]) => s < 9)
    .sort((a, b) => a[1] - b[1])
    .map(([c]) => c);
}

/** Puts community and sub-caste in canonical form before they are stored. */
export function normalizeCommunityFields<
  T extends { community?: string | null; subCaste?: string | null },
>(fields: T, religion?: string | null): T {
  const out = { ...fields };
  if (typeof out.community === 'string')
    out.community = out.community.trim() ? normalizeCommunity(out.community, religion) : undefined;
  if (typeof out.subCaste === 'string')
    out.subCaste = out.subCaste.trim() ? normalizeSubCommunity(out.subCaste, religion) : null;
  return out;
}
