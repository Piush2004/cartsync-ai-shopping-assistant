import { BodyMeasurements } from './types';

export interface BenchmarkTarget {
  id: string;
  dataset: 'CAESAR' | 'ANSUR' | 'INTERNAL';
  predicted: BodyMeasurements;
  groundTruth: BodyMeasurements;
}

export interface MetricReport {
  mae: number;   // Mean Absolute Error
  rmse: number;  // Root Mean Square Error
  mape: number;  // Mean Absolute Percentage Error
}

export interface BenchmarkReport {
  dataset: string;
  sampleSize: number;
  overall: MetricReport;
  perMeasurement: Record<keyof BodyMeasurements, MetricReport>;
}

/**
 * Validates the extraction pipeline against ground truth data.
 * Useful for MLOps tracking and establishing quantitative accuracy metrics
 * before shipping to production.
 */
export function generateBenchmarkReport(targets: BenchmarkTarget[]): BenchmarkReport {
  if (targets.length === 0) {
    throw new Error('Cannot benchmark empty dataset');
  }

  const keys = Object.keys(targets[0].groundTruth) as Array<keyof BodyMeasurements>;
  
  const perMeasurement: Record<string, MetricReport> = {};
  let globalAbsoluteErrorSum = 0;
  let globalSquaredErrorSum = 0;
  let globalPercentageErrorSum = 0;
  let totalDataPoints = 0;

  keys.forEach(key => {
    let absoluteErrorSum = 0;
    let squaredErrorSum = 0;
    let percentageErrorSum = 0;

    targets.forEach(target => {
      const p = target.predicted[key];
      const gt = target.groundTruth[key];
      const error = p - gt;
      
      absoluteErrorSum += Math.abs(error);
      squaredErrorSum += error * error;
      percentageErrorSum += Math.abs(error / gt);

      globalAbsoluteErrorSum += Math.abs(error);
      globalSquaredErrorSum += error * error;
      globalPercentageErrorSum += Math.abs(error / gt);
      totalDataPoints++;
    });

    const count = targets.length;
    perMeasurement[key] = {
      mae: absoluteErrorSum / count,
      rmse: Math.sqrt(squaredErrorSum / count),
      mape: (percentageErrorSum / count) * 100
    };
  });

  return {
    dataset: targets[0].dataset, // Simplification assuming homogenous array
    sampleSize: targets.length,
    overall: {
      mae: globalAbsoluteErrorSum / totalDataPoints,
      rmse: Math.sqrt(globalSquaredErrorSum / totalDataPoints),
      mape: (globalPercentageErrorSum / totalDataPoints) * 100
    },
    perMeasurement: perMeasurement as Record<keyof BodyMeasurements, MetricReport>
  };
}
