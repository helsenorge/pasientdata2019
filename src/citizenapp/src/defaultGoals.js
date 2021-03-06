/*
 * Default goals used if the user has no goals in the fhir database.
 */

const defaultGoals = {
  StepsGoal: {
    type: "lower",
    value: 10000,
    unit: "skritt"
  },
  WeightGoal: {
    type: "upper",
    value: 70,
    unit: "kg"
  },
  PhysicalActivityGoal: {
    type: "lower",
    value: 630,
    unit: "min"
  },
  MeanGlucoseGoal: {
    type: "upper",
    value: 7,
    unit: "mmol/l"
  },
  BloodSugarWithinRangePercentageGoal: {
    type: "upper",
    value: 80,
    unit: "%"
  },
  CarbsGoal: {
    type: "upper",
    value: 280,
    unit: "g"
  },
  BloodSugarRangeGoal: {
    type: "range",
    lower: 3,
    upper: 12,
    unit: "mmol/l"
  }
};

export default defaultGoals;
