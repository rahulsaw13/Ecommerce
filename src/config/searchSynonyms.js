// Each entry is a group of synonyms. Searching any term in a group
// will match products containing ANY term in that group.
const SYNONYM_GROUPS = [
  // Vegetables
  ['potato', 'aloo', 'aaloo', 'alu', 'batata'],
  ['tomato', 'tamatar', 'tomat'],
  ['onion', 'pyaz', 'pyaaz', 'kanda'],
  ['garlic', 'lahsun', 'lehsun', 'lasun'],
  ['ginger', 'adrak', 'adrakh'],
  ['peas', 'matar', 'mattar', 'vatana'],
  ['cauliflower', 'gobi', 'gobhi', 'phoolgobi', 'phool gobi'],
  ['cabbage', 'bandgobi', 'band gobhi', 'patta gobi'],
  ['spinach', 'palak', 'paalak'],
  ['bitter gourd', 'karela', 'karella'],
  ['bottle gourd', 'lauki', 'ghia', 'dudhi'],
  ['brinjal', 'eggplant', 'baingan', 'baingun', 'vangi'],
  ['lady finger', 'okra', 'bhindi', 'bhendo'],
  ['capsicum', 'bell pepper', 'shimla mirch'],
  ['green chilli', 'hari mirch', 'hari mirchi'],
  ['coriander', 'dhania', 'dhaniya', 'kothamalli'],
  ['mint', 'pudina', 'phudina'],
  ['fenugreek', 'methi'],
  ['radish', 'mooli', 'muli'],
  ['pumpkin', 'kaddu', 'kaddoo', 'petha'],
  ['cucumber', 'kheera', 'khira', 'kakdi'],

  // Fruits
  ['banana', 'kela', 'kele'],
  ['apple', 'seb'],
  ['mango', 'aam'],
  ['orange', 'santra', 'narangi', 'malta'],
  ['lemon', 'nimbu', 'nebu'],
  ['papaya', 'papita', 'papite'],
  ['guava', 'amrood', 'amrud'],
  ['watermelon', 'tarbuj', 'tarbuz'],
  ['grapes', 'angoor'],
  ['pomegranate', 'anar'],
  ['coconut', 'nariyal', 'narial'],
  ['pineapple', 'ananas'],

  // Dry Fruits & Nuts (stocked heavily — Almond, Kaju, Walnut, Anjeer, Khajur etc.)
  ['almonds', 'almond', 'badam'],
  ['cashew', 'cashews', 'kaju'],
  ['walnut', 'walnuts', 'akhrot', 'akhroth'],
  ['pistachio', 'pistachios', 'pista'],
  ['fig', 'figs', 'anjeer'],
  ['dates', 'khajur', 'khurma'],
  ['dry dates', 'chhuara', 'chhuhara', 'chhuarah'],
  ['raisins', 'kismis', 'kishmish'],
  ['munakka', 'black raisins'],
  ['fox nuts', 'makhana', 'lotus seeds', 'phool makhana'],

  // Pulses / Dal
  ['lentil', 'dal', 'daal', 'masoor'],
  ['chickpea', 'chana', 'chole', 'kabuli chana'],
  ['chana dal', 'bengal gram', 'split chickpea'],
  ['kidney beans', 'rajma', 'rajmah'],
  ['black gram', 'urad dal', 'urad'],
  ['moong', 'mung', 'green gram', 'moong dal'],
  ['toor dal', 'arhar dal', 'pigeon pea'],

  // Grains / Rice / Flour
  ['rice', 'chawal', 'chaawal'],
  ['wheat', 'gehun', 'gehu'],
  ['flour', 'atta', 'maida', 'besan'],
  ['semolina', 'sooji', 'suji', 'rava'],
  ['poha', 'flattened rice', 'beaten rice'],
  ['chura', 'chewda'],                          // Bihar thick poha — Chura Bhagalpuri
  ['sattu', 'roasted gram flour'],              // Bihar specialty — Sattu 1 Kg
  ['daliya', 'dalia', 'broken wheat', 'lapsi'],
  ['barley', 'jow', 'jau'],
  ['sago', 'sabudana', 'tapioca'],
  ['arrowroot', 'ararot'],
  ['singhara', 'water chestnut flour'],
  ['soya chunks', 'meal maker', 'soya nuggets', 'soya bean'],

  // Oil / Ghee
  ['oil', 'tel', 'tail'],
  ['ghee', 'clarified butter', 'desi ghee'],
  ['mustard oil', 'sarson tel', 'sarso ka tel'],
  ['coconut oil', 'nariyal tel', 'narial tel'],
  ['sesame oil', 'til oil', 'gingelly oil'],
  ['soyabean oil', 'soybean oil', 'soya oil'],

  // Spices & Masala
  ['turmeric', 'haldi'],
  ['cumin', 'jeera', 'zeera'],
  ['coriander seeds', 'dhaniya sabut', 'dhana'],
  ['coriander powder', 'dhania powder', 'dhaniya powder'],
  ['red chilli', 'lal mirch', 'lal mirchi', 'mirch powder'],
  ['garam masala'],
  ['black pepper', 'kali mirch', 'kali mirchi'],
  ['cardamom', 'elaichi', 'ilaichi'],
  ['big cardamom', 'badi elaichi', 'black cardamom'],
  ['cinnamon', 'dalchini', 'dal chini'],
  ['cloves', 'laung', 'lavang', 'long'],       // product named "long 1 kg"
  ['bay leaf', 'tej patta', 'tez patta'],
  ['sesame', 'til', 'tilli'],
  ['fennel', 'sauf', 'souf', 'sounf'],
  ['mustard seeds', 'rai', 'sarso', 'sarson'],
  ['asafoetida', 'hing', 'heeng', 'hingu'],
  ['dry mango powder', 'amchoor', 'amchur'],
  ['carom seeds', 'ajwain', 'omam'],
  ['nigella seeds', 'kalonji', 'mangrela', 'onion seeds'],
  ['mace', 'javitri', 'jabtri'],
  ['panch phoron', 'pachforan', 'five spice'],
  ['black salt', 'kala namak', 'sanchal', 'kala noon'],
  ['rock salt', 'sendha namak', 'pink salt'],
  ['salt', 'namak', 'nimak', 'noon'],
  ['sugar', 'cheeni', 'chini', 'shakkar'],
  ['rock sugar', 'mishri', 'misri'],
  ['honey', 'shahad', 'shehed', 'madhu'],
  ['sambhar masala', 'sambar masala'],
  ['pav bhaji masala'],
  ['chhole masala', 'chole masala', 'chana masala'],

  // Dairy
  ['milk', 'doodh', 'dudh'],
  ['curd', 'dahi', 'yogurt', 'yoghurt'],
  ['butter', 'makhan', 'makkhan'],
  ['paneer', 'cottage cheese'],
  ['cream', 'malai'],
  ['lassi'],
  ['buttermilk', 'chaas', 'chhachh'],
  ['cheese'],

  // Snacks & Namkeen (big category here — Haldiram, Bikaji, Surabhi)
  ['biscuit', 'cookie', 'cookies'],
  ['chips', 'wafers', 'crisps'],
  ['namkeen', 'farsan', 'mixture', 'bhujia', 'bhujiya'],
  ['popcorn', 'pop corn'],
  ['bread', 'pav', 'double roti'],
  ['rusk', 'toast'],
  ['papad', 'papadum', 'papadam'],
  ['vermicelli', 'sewai', 'seviyan', 'sevai'],
  ['noodles', 'maggi', 'chowmein', 'chow mein'],
  ['pasta'],
  ['oats'],

  // Condiments & Sauces
  ['pickle', 'achar', 'achaar'],
  ['ketchup', 'tomato ketchup', 'tomato sauce', 'catchup'],
  ['jam'],
  ['mayonnaise', 'mayo'],
  ['soya sauce', 'soy sauce'],
  ['golgappa', 'pani puri', 'panipuri', 'gupchup', 'puchka', 'foochka'],

  // Health & Supplements
  ['psyllium husk', 'isabgol', 'ispaghula'],
  ['chyawanprash', 'chawanprash'],
  ['flax seeds', 'alsi', 'linseed'],
  ['peanuts', 'groundnut', 'mungfali', 'moongfali', 'singdana'],
  ['peanut butter'],
  ['coconut water', 'nariyal pani'],
  ['coconut powder', 'nariyal burada', 'desiccated coconut'],
  ['watermelon seeds', 'magaj', 'tarbuj beej'],

  // Beverages
  ['tea', 'chai', 'chaya'],
  ['coffee', 'kaafi'],
  ['juice', 'ras', 'sharbat'],
  ['water', 'paani', 'jal'],
  ['cold drink', 'soda', 'soft drink', 'cola'],

  // Puja / Incense (big category here)
  ['agarbatti', 'incense sticks', 'incense'],
  ['dhoop', 'incense cone', 'sambrani'],
  ['camphor', 'kapoor', 'kapur'],

  // Household
  ['soap', 'sabun', 'saabun'],
  ['shampoo', 'shampo'],
  ['detergent', 'washing powder', 'surf', 'tide', 'wheel'],
  ['toothpaste', 'paste', 'colgate', 'dant kanti'],
  ['dishwash', 'vim', 'vessel cleaner', 'dish wash'],
  ['floor cleaner', 'phenyl', 'phenyle'],
  ['mosquito', 'machhar', 'maxo', 'good knight'],
  ['matchbox', 'match box', 'diasalai'],
];

// Build a flat map: term → expanded terms[]
const SYNONYM_MAP = {};
SYNONYM_GROUPS.forEach((group) => {
  const lowerGroup = group.map((t) => t.toLowerCase());
  lowerGroup.forEach((term) => {
    SYNONYM_MAP[term] = lowerGroup;
  });
});

/**
 * Expand a search query to include all known synonyms.
 * Returns an array of terms — the product must match at least one.
 */
export const expandSearchTerms = (query) => {
  if (!query) return [];
  const q = query.toLowerCase().trim();
  // Exact group match
  if (SYNONYM_MAP[q]) return SYNONYM_MAP[q];
  // Partial match — if the query contains a synonym key as a word
  for (const key of Object.keys(SYNONYM_MAP)) {
    if (q.includes(key) || key.includes(q)) {
      return SYNONYM_MAP[key];
    }
  }
  return [q];
};
