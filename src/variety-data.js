// Reviewed culinary roles, not allergy identities or quantity-based guesses.
// Accompanying rice/roti and routine seasonings do not drive V1 variety.
const variety = (majorIngredients, families) => ({ majorIngredients, families });
export const varietyByDish = {
  'kanda-poha': variety(['poha', 'onion'], ['poha']),
  upma: variety(['semolina'], ['vegetable-upma']),
  idli: variety(['rice-urad-batter'], ['batter-breakfast']),
  dosa: variety(['rice-urad-batter', 'potato'], ['batter-breakfast']),
  'besan-chilla': variety(['chickpea'], ['chilla']),
  oats: variety(['oats', 'banana', 'almond'], ['porridge']),
  paratha: variety(['potato'], ['flatbread-breakfast']),
  thepla: variety(['spinach'], ['flatbread-breakfast']),
  vermicelli: variety(['wheat-vermicelli'], ['vegetable-upma']),
  'egg-toast': variety(['egg'], ['egg-breakfast']),
  'moong-chilla': variety(['moong'], ['chilla']),
  sabudana: variety(['sabudana', 'potato', 'peanut'], ['sabudana-khichdi']),
  'dal-rice': variety(['toor'], ['dal']),
  rajma: variety(['rajma'], ['pulse-curry']),
  chole: variety(['chickpea'], ['pulse-curry']),
  'palak-paneer': variety(['spinach', 'paneer'], ['paneer-curry']),
  bhindi: variety(['bhindi'], ['dry-sabzi']),
  'aloo-gobi': variety(['potato', 'cauliflower'], ['dry-sabzi']),
  khichdi: variety(['moong'], ['dal-khichdi']),
  pulao: variety(['carrot', 'beans', 'peas'], ['pulao']),
  sambar: variety(['toor'], ['dal']),
  'lemon-rice': variety(['lemon', 'carrot'], ['seasoned-rice']),
  'curd-rice': variety(['curd', 'cucumber'], ['seasoned-rice']),
  rasam: variety(['tomato'], ['rasam']),
  pitla: variety(['chickpea'], ['pulse-curry']),
  matki: variety(['chickpea'], ['pulse-curry']),
  'gujarati-dal': variety(['toor'], ['dal']),
  cabbage: variety(['cabbage', 'peas'], ['dry-sabzi']),
  'bengali-dal': variety(['masoor'], ['dal']),
  'soy-rice': variety(['soy'], ['pulao']),
  'egg-curry': variety(['egg'], ['egg-curry']),
  'egg-bhurji': variety(['egg'], ['egg-bhurji']),
  chicken: variety(['chicken'], ['chicken-curry']),
  'chicken-pulao': variety(['chicken'], ['pulao']),
  fish: variety(['fish'], ['fish-curry']),
  'pepper-chicken': variety(['chicken'], ['chicken-curry']),
  fruit: variety(['apple', 'banana'], ['fruit-snack']),
  makhana: variety(['makhana'], ['roasted-snack']),
  'chana-chaat': variety(['chickpea'], ['chaat', 'cooked-pulse-snack']),
  'peanut-chaat': variety(['peanut'], ['chaat']),
  'curd-fruit': variety(['curd', 'banana'], ['fruit-snack']),
  sandwich: variety(['cucumber', 'tomato'], ['sandwich']),
  sundal: variety(['chickpea'], ['cooked-pulse-snack']),
  dhokla: variety(['chickpea'], ['steamed-snack']),
  'carrot-chaat': variety(['carrot', 'cucumber'], ['chaat']),
  'egg-snack': variety(['egg'], ['boiled-egg-snack'])
};

// Deliberate exceptions: kanda (onion) defines poha, tomato defines rasam
// and sandwich filling. Thepla's minor besan is not chickpea-major; idli's
// chutney moong, fish curry's potato and routine vegetable additions are not
// major. Sabudana's potato/peanuts and dosa's potato filling are substantial.
// These labels NEVER determine whether an ingredient is safe to eat.
