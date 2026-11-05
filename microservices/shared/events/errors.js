class PermanentError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PermanentError';
    this.permanent = true;
  }
}

function isPermanent(err) {
  if (!err) {
    return false;
  }
  if (err.permanent === true || err.name === 'PermanentError') {
    return true;
  }
  if (err.name === 'ValidationError' || err.name === 'CastError') {
    return true;
  }
  return false;
}

module.exports = { PermanentError, isPermanent };
