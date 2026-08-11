export function formatForecastMethod(method) {
  if (method === 'exponential_smoothing') {
    return 'Exp. smoothing';
  }
  if (method === 'moving_average') {
    return 'Moving average';
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
