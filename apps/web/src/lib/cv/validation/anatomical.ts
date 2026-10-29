/**
 * Plausible-bounds validation, mirroring apps/api/schemas/measurement.py's
 * _MEASUREMENT_BOUNDS_CM exactly. Kept as a duplicated constant (not a
 * shared package) deliberately -- apps/web and apps/api are separate
 * deployable units with no shared code today (see
 * docs/architecture/canonical-architecture-decision.md); if these two
 * tables drift, that's a bug to catch in review/tests, not a reason to add
 * cross-package infrastructure for one small object.
 */
export const MEASUREMENT_BOUNDS_CM: Record<string, [number, number]> = {
  chest: [20.0, 250.0],
  waist: [20.0, 250.0],
  hip: [20.0, 250.0],
  inseam: [20.0, 150.0],
  shoulder: [10.0, 100.0],
  arm_length: [10.0, 120.0],
  torso_length: [10.0, 120.0],
};

export type PlausibilityFailure = { field: string; value: number; reason: "OUT_OF_BOUNDS" | "NOT_FINITE" };

export function checkPlausibility(measurements: Record<string, number | undefined>): PlausibilityFailure[] {
  const failures: PlausibilityFailure[] = [];
  for (const [field, value] of Object.entries(measurements)) {
    if (value === undefined) continue;
    const bounds = MEASUREMENT_BOUNDS_CM[field];
    if (!bounds) continue;

    if (!Number.isFinite(value)) {
      failures.push({ field, value, reason: "NOT_FINITE" });
      continue;
    }
    const [low, high] = bounds;
    if (value < low || value > high) {
      failures.push({ field, value, reason: "OUT_OF_BOUNDS" });
    }
  }
  return failures;
}

export interface HistoricalChangeFlag {
  field: string;
  previousValueCm: number;
  newValueCm: number;
  relativeChange: number;
}

/**
 * A change bigger than this fraction of the previous value is surfaced to
 * the user for explicit review rather than silently overwriting their
 * profile (master brief §16/§17 -- "do not automatically overwrite").
 * 10% is deliberately tight: a genuine measurement (weight change, better
 * capture, posture) can exceed this, but so can a bad capture, and the cost
 * of an extra confirmation click is much lower than the cost of silently
 * corrupting someone's sizing profile.
 */
const SIGNIFICANT_CHANGE_THRESHOLD = 0.10;

export function checkHistoricalConsistency(
  previous: Record<string, number | undefined>,
  next: Record<string, number | undefined>
): HistoricalChangeFlag[] {
  const flags: HistoricalChangeFlag[] = [];
  for (const [field, newValue] of Object.entries(next)) {
    const prevValue = previous[field];
    if (newValue === undefined || prevValue === undefined || prevValue === 0) continue;

    const relativeChange = Math.abs(newValue - prevValue) / Math.abs(prevValue);
    if (relativeChange > SIGNIFICANT_CHANGE_THRESHOLD) {
      flags.push({ field, previousValueCm: prevValue, newValueCm: newValue, relativeChange });
    }
  }
  return flags;
}
