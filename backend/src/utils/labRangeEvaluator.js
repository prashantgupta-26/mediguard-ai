/**
 * Deterministic Lab Range Evaluator
 * Compares numeric lab test results against reference ranges deterministically in backend code.
 * Does NOT generate diagnostic labels.
 */

/**
 * Evaluates a single lab test result against its reference range
 * @param {string|number} rawResult Test result value (e.g., "10.2", 140)
 * @param {string} rawRange Reference range string (e.g., "12.0 - 16.0", "< 140", "> 50")
 * @returns {object} { abnormalFlag: boolean, rangeStatus: string, statusMessage: string }
 */
const evaluateLabRange = (rawResult, rawRange) => {
  if (rawResult === undefined || rawResult === null || !rawRange) {
    return {
      abnormalFlag: false,
      rangeStatus: 'uncertain',
      statusMessage: 'No reference range provided'
    };
  }

  const resultStr = String(rawResult).trim();
  const rangeStr = String(rawRange).trim();

  // Extract first floating point number from result
  const valMatch = resultStr.match(/[-+]?\d*\.?\d+/);
  if (!valMatch) {
    return {
      abnormalFlag: false,
      rangeStatus: 'uncertain',
      statusMessage: 'Non-numeric result'
    };
  }
  const val = parseFloat(valMatch[0]);

  // Case 1: Min - Max range (e.g., "12.0 - 16.0", "12-16", "4.0 to 10.0")
  const rangeMinMaxMatch = rangeStr.match(/([-+]?\d*\.?\d+)\s*(?:-|to|—|–)\s*([-+]?\d*\.?\d+)/i);
  if (rangeMinMaxMatch) {
    const min = parseFloat(rangeMinMaxMatch[1]);
    const max = parseFloat(rangeMinMaxMatch[2]);
    if (!isNaN(min) && !isNaN(max)) {
      if (val < min || val > max) {
        return {
          abnormalFlag: true,
          rangeStatus: 'abnormal',
          statusMessage: `Outside the provided reference range (${min} - ${max})`
        };
      }
      return {
        abnormalFlag: false,
        rangeStatus: 'normal',
        statusMessage: `Within reference range (${min} - ${max})`
      };
    }
  }

  // Case 2: Less than range (e.g., "< 140", "<= 200")
  const lessThanMatch = rangeStr.match(/<(?:\s*=)?\s*([-+]?\d*\.?\d+)/);
  if (lessThanMatch) {
    const maxVal = parseFloat(lessThanMatch[1]);
    if (!isNaN(maxVal)) {
      if (val > maxVal) {
        return {
          abnormalFlag: true,
          rangeStatus: 'abnormal',
          statusMessage: `Outside the provided reference range (< ${maxVal})`
        };
      }
      return {
        abnormalFlag: false,
        rangeStatus: 'normal',
        statusMessage: `Within reference range (< ${maxVal})`
      };
    }
  }

  // Case 3: Greater than range (e.g., "> 50", ">= 60")
  const greaterThanMatch = rangeStr.match(/>(?:\s*=)?\s*([-+]?\d*\.?\d+)/);
  if (greaterThanMatch) {
    const minVal = parseFloat(greaterThanMatch[1]);
    if (!isNaN(minVal)) {
      if (val < minVal) {
        return {
          abnormalFlag: true,
          rangeStatus: 'abnormal',
          statusMessage: `Outside the provided reference range (> ${minVal})`
        };
      }
      return {
        abnormalFlag: false,
        rangeStatus: 'normal',
        statusMessage: `Within reference range (> ${minVal})`
      };
    }
  }

  return {
    abnormalFlag: false,
    rangeStatus: 'uncertain',
    statusMessage: 'Reference range format unparsed'
  };
};

/**
 * Evaluates an array of extracted test items
 * @param {Array} tests Array of { testName, result, unit, referenceRange, ... }
 * @returns {Array} Updated tests with deterministic abnormalFlag and statusMessage
 */
const processLabTestsEvaluator = (tests = []) => {
  if (!Array.isArray(tests)) return [];

  return tests.map((t) => {
    const evalRes = evaluateLabRange(t.result, t.referenceRange);
    return {
      testName: String(t.testName || 'Unknown Test'),
      result: String(t.result || ''),
      unit: t.unit ? String(t.unit) : null,
      referenceRange: t.referenceRange ? String(t.referenceRange) : null,
      abnormalFlag: t.abnormalFlag === true || evalRes.abnormalFlag,
      rangeStatus: evalRes.rangeStatus,
      statusMessage: evalRes.statusMessage,
      confidence: typeof t.confidence === 'number' ? t.confidence : 0.9,
      needsReview: Boolean(t.needsReview || evalRes.rangeStatus === 'abnormal')
    };
  });
};

module.exports = {
  evaluateLabRange,
  processLabTestsEvaluator
};
