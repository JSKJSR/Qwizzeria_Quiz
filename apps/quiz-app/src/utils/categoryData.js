/**
 * Predefined category → sub-category mapping for questions.
 * Used by QuestionForm, BulkImport, QuestionList, and the Excel parser.
 */
export const CATEGORY_MAP = {
  'Culture': ['Architecture', 'Fine art', 'Museums', 'Mythology', 'Philosophy', 'Religion', 'Theatre (High Brow)', 'World cultures'],
  'Entertainment': ['Ballet', 'Celebrities', 'Classical music', 'Film & TV Music', 'Jazz & World Music', 'Opera', 'Pop music', 'Radio', 'Television', 'Theatre (Popular/Musicals)'],
  'History': ['Civilisations', 'Current Affairs', 'Exploration', 'Famous People (History)', 'History'],
  'Lifestyle': ['Costume', 'Design', 'Fashion', 'Food & Drink', 'Handicrafts', 'Health & Fitness', 'Hobbies & Pastimes', 'Human Body', 'New Age Beliefs', 'Products & Brands', 'Tourism'],
  'Media': ['Comic strips', 'Comic books', 'Film', 'Graphic novels', 'Language', 'Literature', 'News Media', 'Periodicals', 'Social Media'],
  'Sciences': ['Exact sciences (Chemistry, Physics etc.)', 'Fauna', 'Flora', 'Social sciences'],
  'Sport & Games': ['Games', 'Sports', 'Records & achievements (genre context)'],
  'World': ['Cities', 'Human Geography', 'Physical Geography', 'Inventions', 'Space', 'Technology', 'Transport'],
};

export const CATEGORIES = Object.keys(CATEGORY_MAP);

export const ALL_SUB_CATEGORIES = Object.values(CATEGORY_MAP).flat();

/**
 * Check if a category is valid (in the predefined list).
 */
export function isValidCategory(category) {
  return CATEGORIES.includes(category);
}

/**
 * Check if a sub-category is valid for a given category.
 * If category is not provided, checks across all categories.
 */
export function isValidSubCategory(subCategory, category) {
  if (category && CATEGORY_MAP[category]) {
    return CATEGORY_MAP[category].includes(subCategory);
  }
  return ALL_SUB_CATEGORIES.includes(subCategory);
}
