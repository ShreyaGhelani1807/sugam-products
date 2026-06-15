const { validationResult } = require('express-validator');

// Runs after express-validator rule chains; returns the first error as 400.
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
  next();
}

module.exports = { validate };
