import { eq } from 'drizzle-orm';

import {
  ASSESSMENT_SECTION_ANSWER_VALUE_TYPES,
  ASSESSMENT_SECTION_TYPES,
  assessmentSectionAnswersTable,
  assessmentSectionQuestionsTable,
  assessmentSectionsTable,
  assessmentsTable,
  db,
  disordersTable,
  patientProvidersTable,
  USER_TYPES,
  usersTable,
} from '#src/db';

async function seedDisorders() {
  await db.insert(disordersTable)
    .values([
      {
        name: 'anxiety',
        displayName: 'Anxiety',
      },
      {
        name: 'cross_cutting',
        displayName: 'Cross-Cutting',
      },
      {
        name: 'depression',
        displayName: 'Depression',
      },
      {
        name: 'mania',
        displayName: 'Mania',
      },
      {
        name: 'substance_use',
        displayName: 'Substance Use',
      },
    ]);
}

async function seedAssessments() {
  const anxietyDisorder = (await db.select().from(disordersTable)
    .where(eq(disordersTable.name, 'anxiety'))
    .get())!;
  const crossCuttingDisorder = (await db.select().from(disordersTable)
    .where(eq(disordersTable.name, 'cross_cutting'))
    .get())!;
  const depressionDisorder = (await db.select().from(disordersTable)
    .where(eq(disordersTable.name, 'depression'))
    .get())!;
  const maniaDisorder = (await db.select().from(disordersTable)
    .where(eq(disordersTable.name, 'mania'))
    .get())!;
  const substanceUseDisorder = (await db.select().from(disordersTable)
    .where(eq(disordersTable.name, 'substance_use'))
    .get())!;

  await db.insert(assessmentsTable)
    .values([
      {
        name: 'ASSIST',
        fullName: 'Alcohol, Smoking, and Substance Involvement Screening Test',
        displayName: 'ASSIST',
        disorderId: substanceUseDisorder.id,
        locked: false,
      },
      {
        name: 'ASRM',
        fullName: 'Altman Self-Rating Mania Scale',
        displayName: 'ASRM',
        disorderId: maniaDisorder.id,
        locked: false,
      },
      {
        name: 'BPDS',
        fullName: 'Blueprint Diagnostic Screener',
        displayName: 'BDS',
        disorderId: crossCuttingDisorder.id,
        locked: true,
      },
      {
        name: 'PHQ-9',
        fullName: 'Patient Health Questionnaire-9',
        displayName: 'Patient Health Questionnaire',
        disorderId: depressionDisorder.id,
        locked: false,
      },
    ]);

  const bpdsAssessment = (await db.select().from(assessmentsTable)
    .where(eq(assessmentsTable.name, 'BPDS'))
    .get())!;
  const bpdsAssessmentSection1 = await db.insert(assessmentSectionsTable)
    .values([
      {
        assessmentId: bpdsAssessment.id,
        type: ASSESSMENT_SECTION_TYPES.STANDARD,
        title: 'During the past TWO (2) WEEKS, how much (or how often) have you been bothered by the following problems?',
      },
    ])
    .returning()
    .get();

  await db.insert(assessmentSectionAnswersTable)
    .values([
      {
        assessmentSectionId: bpdsAssessmentSection1.id,
        displayOrder: 0,
        title: 'Not at all',
        valueType: ASSESSMENT_SECTION_ANSWER_VALUE_TYPES.NUMBER,
        value: '0',
      },
      {
        assessmentSectionId: bpdsAssessmentSection1.id,
        displayOrder: 1,
        title: 'Rare, less than a day or two',
        valueType: ASSESSMENT_SECTION_ANSWER_VALUE_TYPES.NUMBER,
        value: '1',
      },
      {
        assessmentSectionId: bpdsAssessmentSection1.id,
        displayOrder: 2,
        title: 'Several days',
        valueType: ASSESSMENT_SECTION_ANSWER_VALUE_TYPES.NUMBER,
        value: '2',
      },
      {
        assessmentSectionId: bpdsAssessmentSection1.id,
        displayOrder: 3,
        title: 'More than half the days',
        valueType: ASSESSMENT_SECTION_ANSWER_VALUE_TYPES.NUMBER,
        value: '3',
      },
      {
        assessmentSectionId: bpdsAssessmentSection1.id,
        displayOrder: 4,
        title: 'Nearly every day',
        valueType: ASSESSMENT_SECTION_ANSWER_VALUE_TYPES.NUMBER,
        value: '4',
      },
    ]);

  await db.insert(assessmentSectionQuestionsTable)
    .values([
      {
        assessmentSectionId: bpdsAssessmentSection1.id,
        disorderId: depressionDisorder.id,
        displayOrder: 0,
        title: 'Little interest or pleasure in doing things?',
      },
      {
        assessmentSectionId: bpdsAssessmentSection1.id,
        disorderId: depressionDisorder.id,
        displayOrder: 1,
        title: 'Feeling down, depressed, or hopeless?',
      },
      {
        assessmentSectionId: bpdsAssessmentSection1.id,
        disorderId: maniaDisorder.id,
        displayOrder: 2,
        title: 'Sleeping less than usual, but still have a lot of energy?',
      },
      {
        assessmentSectionId: bpdsAssessmentSection1.id,
        disorderId: maniaDisorder.id,
        displayOrder: 3,
        title: 'Starting lots more projects than usual or doing more risky things than usual?',
      },
      {
        assessmentSectionId: bpdsAssessmentSection1.id,
        disorderId: anxietyDisorder.id,
        displayOrder: 4,
        title: 'Feeling nervous, anxious, frightened, worried, or on edge?',
      },
      {
        assessmentSectionId: bpdsAssessmentSection1.id,
        disorderId: anxietyDisorder.id,
        displayOrder: 5,
        title: 'Feeling panic or being frightened?',
      },
      {
        assessmentSectionId: bpdsAssessmentSection1.id,
        disorderId: anxietyDisorder.id,
        displayOrder: 6,
        title: 'Avoiding situations that make you feel anxious?',
      },
      {
        assessmentSectionId: bpdsAssessmentSection1.id,
        disorderId: substanceUseDisorder.id,
        displayOrder: 7,
        title: 'Drinking at least 4 drinks of any kind of alcohol in a single day?',
      },
    ]);
}

async function seedUsers() {
  const provider = await db.insert(usersTable)
    .values({
      type: USER_TYPES.PROVIDER,
      givenName: 'Good',
      familyName: 'Therapist',
      email: 'good.therapist@example.com',
      password: 'test123',
    })
    .returning()
    .get();
  const patient = await db.insert(usersTable)
    .values({
      type: USER_TYPES.PATIENT,
      givenName: 'Nice',
      familyName: 'Patient',
      email: 'nice.patient@example.com',
      password: 'test456',
    })
    .returning()
    .get();

  await db.insert(patientProvidersTable)
    .values({
      onboardedAt: new Date().toISOString(),
      patientId: patient.id,
      providerId: provider.id,
    })
    .returning()
    .get();
}

async function seedDb() {
  await seedDisorders();
  await seedAssessments();
  await seedUsers();
}

seedDb().then(() => {
  console.log('Successfully seeded DB');
}).catch(err => {
  console.log('ERROR', err);
});
