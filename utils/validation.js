const { body, param, query } = require('express-validator');

// Product Validation
const productValidation = [
  body('title').trim().isLength({ min: 1, max: 100 }).withMessage('Title must be between 1 and 100 characters'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('labels').isArray().withMessage('Labels must be an array'),
  body('labels.*')
    .isIn(['best seller', "people's choice", 'trending', 'new arrival', 'limited edition'])
    .withMessage('Invalid label value'),
  body('variety').isArray().withMessage('Variety must be an array'),
  body('variety.*.stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('variety.*.price.mrp').isFloat({ min: 0 }).withMessage('MRP must be a positive number'),
  body('variety.*.price.sellingPrice').isFloat({ min: 0 }).withMessage('Selling price must be a positive number'),
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
