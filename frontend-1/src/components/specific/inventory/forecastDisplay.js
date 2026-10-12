export function formatForecastMethod(method) {
  if (method === 'exponential_smoothing') {
    return 'Exp. smoothing';
  }
  if (method === 'moving_average') {
    return 'Moving average';
  }
  if (method === 'croston') {
    return 'Croston';
  }
  return method || 'n/a';
}

export function formatEvaluationHint(evaluation) {
  if (!evaluation || evaluation.mae == null) {
    return 'Holdout error: not enough history yet';
  }

  const mapePart =
    evaluation.mape != null ? ` · MAPE ${evaluation.mape}%` : '';

  return `Holdout MAE ${evaluation.mae}${mapePart}`;
}

export function formatUncertaintyBand(uncertainty) {
  if (!uncertainty || uncertainty.lower == null || uncertainty.upper == null) {
    return null;
  }

  const levelPct = Math.round((uncertainty.level || 0.8) * 100);
  return `~${levelPct}% band ${Math.round(uncertainty.lower)}-${Math.round(uncertainty.upper)}`;
}

export function formatForecastExplanation(explanation) {
  if (!explanation || typeof explanation !== 'string') {
    return null;
  }
  return explanation;
}
