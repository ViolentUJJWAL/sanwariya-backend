const { body, param, query } = require('express-validator');

// Product Validation
const productValidation =[
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Product title is required')
    .isLength({ max: 100 })
    .withMessage('Product title cannot exceed 100 characters'),
  body('description')
    .notEmpty()
    .withMessage('Product description is required'),
  body('category')
    .notEmpty()
    .withMessage('Category is required'),
  body('variety')
    .notEmpty()
    .withMessage('Variety is required')
    .bail() // Stop further validation if notEmpty fails
    .custom((value) => {
      try {
        const parsed = JSON.parse(value);
        if (!Array.isArray(parsed)) {
          throw new Error('Variety must be an array');
        }
        // Optionally add deeper validation for variety structure
        parsed.forEach(v => {
          if (!v.additionalDesc || !v.price || typeof v.stock !== 'number') {
            throw new Error('Invalid variety structure');
          }
        });
        return true;
      } catch (e) {
        throw new Error(`Invalid JSON format for variety: ${e.message}`);
      }
    }),
  body('labels')
    .optional()
    .custom((value) => {
      if (!value) return true; // Skip if not provided
      try {
        const parsed = JSON.parse(value);
        if (!Array.isArray(parsed)) throw new Error('Labels must be an array');
        const validLabels = ['best seller', 'people\'s choice', 'trending', 'new arrival', 'limited edition'];
        parsed.forEach(label => {
          if (!validLabels.includes(label)) throw new Error(`Invalid label: ${label}`);
        });
        return true;
      } catch (e) {
        throw new Error(`Invalid JSON format for labels: ${e.message}`);
      }
    }),
  body('tags')
    .optional()
    .custom((value) => {
      if (!value) return true; // Skip if not provided
      try {
        const parsed = JSON.parse(value);
        if (!Array.isArray(parsed)) throw new Error('Tags must be an array');
        parsed.forEach(tag => {
          if (typeof tag !== 'string' || tag.length > 50) {
            throw new Error('Each tag must be a string and cannot exceed 50 characters');
          }
        });
        return true;
      } catch (e) {
        throw new Error(`Invalid JSON format for tags: ${e.message}`);
      }
    }),
];
// Review Validation
const reviewValidation = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('description').optional().trim().isString(),
  body('images').optional().isArray(),
  body('images.*').optional().isURL().matches(/\.(jpg|jpeg|png|webp|gif)$/i),
];

// Stock Update Validation
const stockValidation = [
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
];

// Price Update Validation
const priceValidation = [
  body('mrp').optional().isFloat({ min: 0 }).withMessage('MRP must be a positive number'),
  body('sellingPrice').optional().isFloat({ min: 0 }).withMessage('Selling price must be a positive number'),
];

// Query Parameters Validation
const paginationValidation = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

const productFilterValidation = [
  ...paginationValidation,
  query('category').optional().trim(),
  query('minPrice').optional().isFloat({ min: 0 }),
  query('maxPrice').optional().isFloat({ min: 0 }),
  query('sort').optional().isIn(['price', '-price', 'rating', '-rating', 'newest']),
];

const labelValidation = [
  param('label').isIn(['best seller', "people's choice", 'trending', 'new arrival', 'limited edition']),
];

const searchValidation = [
  query('q').trim().notEmpty(),
  ...paginationValidation,
];

module.exports = {
  productValidation,
  reviewValidation,
  stockValidation,
  priceValidation,
  paginationValidation,
  productFilterValidation,
  labelValidation,
  searchValidation,
};
