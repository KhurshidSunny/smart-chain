function sumQuantities(history) {
  if (!Array.isArray(history)) {
    return 0;
  }
  return history.reduce((sum, point) => sum + Number(point && point.quantity ? point.quantity : 0), 0);
}

function sameId(value, expected) {
  if (value === undefined || value === null || expected === undefined || expected === null) {
    return false;
  }
  if (typeof value === 'object') {
    return String(value._id || value.id || '') === String(expected);
  }
  return String(value) === String(expected);
}

function findByOrderId(rows, orderId) {
  if (!Array.isArray(rows)) {
    return null;
  }
  return rows.find((row) => sameId(row && (row.orderId || row._id), orderId)) || null;
}

function failureReport(step, detail, context) {
  return {
    ok: false,
    step,
    detail: detail ? String(detail) : 'failed',
    ...(context || {}),
  };
}

function exitCode(report) {
  return report && report.ok ? 0 : 1;
}

function directMongoUri(uri) {
  const text = String(uri || '');
  if (text.includes('directConnection=')) {
    return text;
  }
  return text.includes('?') ? `${text}&directConnection=true` : `${text}?directConnection=true`;
}

module.exports = {
  sumQuantities,
  sameId,
  findByOrderId,
  failureReport,
  exitCode,
  directMongoUri,
};
