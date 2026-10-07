const fhirValidator = require('../utils/fhirValidator');

class FhirService {
  /**
   * Transforms structured MediKiosk Clinical Summary & Documents into a FHIR R4 Bundle
   */
  createFhirBundle({ clinicalSummary, patient, documents = [] }) {
    if (!clinicalSummary) {
      throw new Error('Clinical Summary is required for FHIR Bundle generation');
    }

    const bundleId = `bundle-mk-${clinicalSummary.clinicalSessionId || Date.now()}`;
    const patientRefId = `Patient/${patient?._id || clinicalSummary.patientId || 'unknown'}`;
    const encounterRefId = `Encounter/${clinicalSummary.clinicalSessionId || 'session-unknown'}`;

    const entries = [];

    // 1. FHIR Patient Resource
    const patientResource = {
      resourceType: 'Patient',
      id: String(patient?._id || clinicalSummary.patientId || 'pt-1'),
      identifier: [
        {
          system: 'https://medikiosk.health/id',
          value: clinicalSummary.patientHealthId || patient?.healthId || 'MK-UNKNOWN'
        }
      ],
      name: [
        {
          use: 'official',
          text: clinicalSummary.patientName || (patient ? `${patient.name}`.trim() : 'Patient')
        }
      ],
      gender: (clinicalSummary.patientGender || patient?.gender || 'other').toLowerCase(),
      birthDate: patient?.dateOfBirth || undefined
    };

    if (patient?.abhaNumber) {
      patientResource.identifier.push({
        system: 'https://abdm.gov.in/abha',
        value: patient.abhaNumber
      });
    }

    entries.push({
      fullUrl: `urn:uuid:${patientResource.id}`,
      resource: patientResource
    });

    // 2. FHIR Encounter Resource
    const encounterResource = {
      resourceType: 'Encounter',
      id: clinicalSummary.clinicalSessionId || 'enc-1',
      status: 'finished',
      class: {
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
        code: 'AMB',
        display: 'ambulatory'
      },
      subject: { reference: patientRefId },
      period: {
        start: new Date(clinicalSummary.createdAt || Date.now()).toISOString()
      }
    };
    entries.push({
      fullUrl: `urn:uuid:${encounterResource.id}`,
      resource: encounterResource
    });

    // 3. FHIR Observations (Lab Test Results)
    const investigations = clinicalSummary.priorInvestigations || [];
    investigations.forEach((lab, idx) => {
      const obsId = `obs-lab-${idx + 1}`;
      const obsResource = {
        resourceType: 'Observation',
        id: obsId,
        status: 'final',
        category: [
          {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                code: 'laboratory',
                display: 'Laboratory'
              }
            ]
          }
        ],
        code: {
          text: lab.testName || 'Laboratory Test'
        },
        subject: { reference: patientRefId },
        encounter: { reference: encounterRefId },
        valueString: `${lab.resultValue || ''} ${lab.unit || ''}`.trim(),
        referenceRange: lab.referenceRange
          ? [{ text: lab.referenceRange }]
          : undefined,
        interpretation: lab.isAbnormal
          ? [{ coding: [{ code: 'A', display: 'Abnormal' }] }]
          : [{ coding: [{ code: 'N', display: 'Normal' }] }]
      };
      entries.push({
        fullUrl: `urn:uuid:${obsId}`,
        resource: obsResource
      });
    });

    // 4. FHIR Conditions (Past Medical History)
    const conditions = clinicalSummary.pastMedicalHistory || [];
    conditions.forEach((cond, idx) => {
      const condId = `cond-${idx + 1}`;
      const condResource = {
        resourceType: 'Condition',
        id: condId,
        clinicalStatus: {
          coding: [{ code: 'active', display: 'Active' }]
        },
        verificationStatus: {
          coding: [{ code: cond.verified ? 'confirmed' : 'unconfirmed' }]
        },
        code: {
          text: typeof cond === 'string' ? cond : cond.value
        },
        subject: { reference: patientRefId },
        note: cond.source ? [{ text: `Source: ${cond.source}` }] : undefined
      };
      entries.push({
        fullUrl: `urn:uuid:${condId}`,
        resource: condResource
      });
    });

    // 5. FHIR MedicationStatements
    const medications = clinicalSummary.currentMedications || [];
    medications.forEach((med, idx) => {
      const medId = `med-${idx + 1}`;
      const medResource = {
        resourceType: 'MedicationStatement',
        id: medId,
        status: 'active',
        medicationCodeableConcept: {
          text: med.name
        },
        subject: { reference: patientRefId },
        dosage: med.dose || med.frequency ? [
          {
            text: `${med.dose || ''} ${med.frequency || ''}`.trim(),
            route: med.route ? { text: med.route } : undefined
          }
        ] : undefined,
        note: [
          {
            text: `Source: ${med.isDocumentExtracted ? 'extracted_from_document' : 'patient_reported'}`
          }
        ]
      };
      entries.push({
        fullUrl: `urn:uuid:${medId}`,
        resource: medResource
      });
    });

    // 6. FHIR AllergyIntolerances
    const allergies = clinicalSummary.drugAllergies || [];
    allergies.forEach((alg, idx) => {
      const algId = `alg-${idx + 1}`;
      const algResource = {
        resourceType: 'AllergyIntolerance',
        id: algId,
        clinicalStatus: {
          coding: [{ code: 'active', display: 'Active' }]
        },
        verificationStatus: {
          coding: [{ code: 'unconfirmed', display: 'Unconfirmed' }]
        },
        type: 'allergy',
        category: ['medication'],
        code: {
          text: alg.allergen || alg.name || 'Allergen'
        },
        patient: { reference: patientRefId },
        reaction: alg.reaction
          ? [{ manifestation: [{ text: alg.reaction }] }]
          : undefined
      };
      entries.push({
        fullUrl: `urn:uuid:${algId}`,
        resource: algResource
      });
    });

    // 7. FHIR Procedures (Past Surgeries)
    const surgeries = clinicalSummary.pastSurgicalHistory || [];
    surgeries.forEach((proc, idx) => {
      const procId = `proc-${idx + 1}`;
      const procResource = {
        resourceType: 'Procedure',
        id: procId,
        status: 'completed',
        code: {
          text: proc.procedure
        },
        subject: { reference: patientRefId },
        performedDateTime: proc.date || undefined,
        note: proc.details ? [{ text: proc.details }] : undefined
      };
      entries.push({
        fullUrl: `urn:uuid:${procId}`,
        resource: procResource
      });
    });

    // 8. FHIR DocumentReferences (Uploaded Medical Documents)
    documents.forEach((doc, idx) => {
      const docRefId = `docref-${idx + 1}`;
      const docRefResource = {
        resourceType: 'DocumentReference',
        id: docRefId,
        status: 'current',
        docStatus: 'final',
        type: {
          text: doc.documentType || 'Medical Report'
        },
        subject: { reference: patientRefId },
        date: new Date(doc.uploadedAt || Date.now()).toISOString(),
        content: [
          {
            attachment: {
              contentType: doc.fileType || 'application/pdf',
              title: doc.originalFileName,
              url: `/api/patient/records/${doc._id}/view`
            }
          }
        ]
      };
      entries.push({
        fullUrl: `urn:uuid:${docRefId}`,
        resource: docRefResource
      });
    });

    // Assemble Bundle
    const bundle = {
      resourceType: 'Bundle',
      id: bundleId,
      meta: {
        lastUpdated: new Date().toISOString(),
        profile: ['http://hl7.org/fhir/StructureDefinition/Bundle']
      },
      type: 'collection',
      timestamp: new Date().toISOString(),
      entry: entries
    };

    // Perform validation check
    const validationResult = fhirValidator.validateBundle(bundle);

    return {
      bundle,
      validation: validationResult
    };
  }
}

module.exports = new FhirService();
