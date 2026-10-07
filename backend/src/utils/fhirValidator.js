/**
 * FHIR R4 Structure & Quality Validator Utility
 */

class FhirValidator {
  /**
   * Validates a FHIR R4 Bundle
   */
  validateBundle(bundle) {
    const errors = [];
    const warnings = [];

    if (!bundle || typeof bundle !== 'object') {
      return { isValid: false, errors: ['Invalid FHIR bundle object'], warnings: [] };
    }

    if (bundle.resourceType !== 'Bundle') {
      errors.push(`Invalid resourceType: expected 'Bundle', got '${bundle.resourceType}'`);
    }

    if (!bundle.type) {
      errors.push('Missing required Bundle.type field');
    }

    if (!Array.isArray(bundle.entry)) {
      errors.push('Bundle.entry must be an array');
    } else {
      bundle.entry.forEach((entry, idx) => {
        if (!entry.resource) {
          errors.push(`Bundle.entry[${idx}] missing resource property`);
        } else {
          const res = entry.resource;
          const resValidation = this.validateResource(res, idx);
          errors.push(...resValidation.errors);
          warnings.push(...resValidation.warnings);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      resourceCount: bundle.entry ? bundle.entry.length : 0
    };
  }

  /**
   * Validates individual FHIR resources
   */
  validateResource(res, idx) {
    const errors = [];
    const warnings = [];

    if (!res.resourceType) {
      errors.push(`Entry[${idx}] resource missing 'resourceType'`);
      return { errors, warnings };
    }

    if (!res.id) {
      errors.push(`Entry[${idx}] ${res.resourceType} missing 'id'`);
    }

    switch (res.resourceType) {
      case 'Patient':
        if (!res.name || !Array.isArray(res.name) || res.name.length === 0) {
          warnings.push(`Patient resource missing structured name array`);
        }
        break;

      case 'Observation':
        if (!res.code || !res.code.text) {
          errors.push(`Observation[${res.id}] missing code.text`);
        }
        if (!res.status) {
          errors.push(`Observation[${res.id}] missing status`);
        }
        break;

      case 'Condition':
        if (!res.code || !res.code.text) {
          errors.push(`Condition[${res.id}] missing code.text`);
        }
        if (!res.subject || !res.subject.reference) {
          errors.push(`Condition[${res.id}] missing subject reference`);
        }
        break;

      case 'MedicationStatement':
        if (!res.medicationCodeableConcept && !res.medicationReference) {
          errors.push(`MedicationStatement[${res.id}] missing medication details`);
        }
        break;

      case 'AllergyIntolerance':
        if (!res.code || !res.code.text) {
          errors.push(`AllergyIntolerance[${res.id}] missing code.text`);
        }
        break;

      default:
        break;
    }

    return { errors, warnings };
  }
}

module.exports = new FhirValidator();
