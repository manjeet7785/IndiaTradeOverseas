function validate(schema) {
  return (req, res, next) => {
    const result = schema(req.body || {});
    if (!result.ok) {
      return res.status(400).json({ success: false, errorCode: 'VALIDATION_FAILED', message: result.message });
    }
    req.validatedBody = result.value;
    next();
  };
}

module.exports = validate;


