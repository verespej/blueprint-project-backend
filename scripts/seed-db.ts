import { eq } from 'drizzle-orm';

// Env var import MUST come BEFORE other local imports.
import '#config/env';

import {
  ASSESSMENT_SECTION_ANSWER_VALUE_TYPES,
  ASSESSMENT_SECTION_TYPES,
  assessmentInstancesTable,
  assessmentSectionAnswersTable,
  assessmentSectionQuestionsTable,
  assessmentSectionsTable,
  assessmentsTable,
  db,
  disordersTable,
  patientProvidersTable,
  submissionRulesTable,
  SUBMISSION_RULE_ACTION_TYPES,
  SUBMISSION_RULE_EVAL_OPS,
  SUBMISSION_RULE_FILTER_TYPES,
  SUBMISSION_RULE_SCORE_OPS,
  USER_TYPES,
  usersTable,
} from '#src/db';
import { generateSlug } from '#src/utils/slugs';

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

  //
  // BPDS
  //
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

  //
  // PHQ-9
  //
  const phq9Assessment = (await db.select().from(assessmentsTable)
    .where(eq(assessmentsTable.name, 'PHQ-9'))
    .get())!;
  const phq9AssessmentSection1 = await db.insert(assessmentSectionsTable)
    .values([
      {
        assessmentId: phq9Assessment.id,
        type: ASSESSMENT_SECTION_TYPES.STANDARD,
        title: 'During the past TWO (2) WEEKS, how much (or how often) have you been bothered by the following problems?',
      },
    ])
    .returning()
    .get();

  await db.insert(assessmentSectionAnswersTable)
    .values([
      {
        assessmentSectionId: phq9AssessmentSection1.id,
        displayOrder: 0,
        title: 'Not at all',
        valueType: ASSESSMENT_SECTION_ANSWER_VALUE_TYPES.NUMBER,
        value: '0',
      },
      {
        assessmentSectionId: phq9AssessmentSection1.id,
        displayOrder: 1,
        title: 'Several days',
        valueType: ASSESSMENT_SECTION_ANSWER_VALUE_TYPES.NUMBER,
        value: '1',
      },
      {
        assessmentSectionId: phq9AssessmentSection1.id,
        displayOrder: 2,
        title: 'More than half the days',
        valueType: ASSESSMENT_SECTION_ANSWER_VALUE_TYPES.NUMBER,
        value: '2',
      },
      {
        assessmentSectionId: phq9AssessmentSection1.id,
        displayOrder: 3,
        title: 'Nearly every day',
        valueType: ASSESSMENT_SECTION_ANSWER_VALUE_TYPES.NUMBER,
        value: '3',
      },
    ]);

  await db.insert(assessmentSectionQuestionsTable)
    .values([
      {
        assessmentSectionId: phq9AssessmentSection1.id,
        disorderId: depressionDisorder.id,
        displayOrder: 0,
        title: 'Little interest or pleasure in doing things?',
      },
      {
        assessmentSectionId: phq9AssessmentSection1.id,
        disorderId: depressionDisorder.id,
        displayOrder: 1,
        title: 'Feeling down, depressed, or hopeless?',
      },
      {
        assessmentSectionId: phq9AssessmentSection1.id,
        disorderId: depressionDisorder.id,
        displayOrder: 2,
        title: 'Trouble falling or staying asleep, or sleeping too much?',
      },
      {
        assessmentSectionId: phq9AssessmentSection1.id,
        disorderId: depressionDisorder.id,
        displayOrder: 3,
        title: 'Feeling tired or having little energy?',
      },
      {
        assessmentSectionId: phq9AssessmentSection1.id,
        disorderId: depressionDisorder.id,
        displayOrder: 4,
        title: 'Poor appetite or overeating?',
      },
      {
        assessmentSectionId: phq9AssessmentSection1.id,
        disorderId: depressionDisorder.id,
        displayOrder: 5,
        title: 'Feeling bad about yourself — or that you are a failure or have let yourself or your family down?',
      },
      {
        assessmentSectionId: phq9AssessmentSection1.id,
        disorderId: depressionDisorder.id,
        displayOrder: 6,
        title: 'Trouble concentrating on things, such as reading the newspaper or watching television?',
      },
      {
        assessmentSectionId: phq9AssessmentSection1.id,
        disorderId: depressionDisorder.id,
        displayOrder: 7,
        title: 'Moving or speaking so slowly that other people could have noticed? Or so fidgety or restless that you have been moving a lot more than usual?',
      },
      {
        assessmentSectionId: phq9AssessmentSection1.id,
        disorderId: depressionDisorder.id,
        displayOrder: 8,
        title: 'Thoughts that you would be better off dead, or thoughts of hurting yourself in some way?',
      },
    ]);

  //
  // ASRM
  //
  const asrmAssessment = (await db.select().from(assessmentsTable)
    .where(eq(assessmentsTable.name, 'ASRM'))
    .get())!;

  const asrmAssessmentSection1 = await db.insert(assessmentSectionsTable)
    .values([
      {
        assessmentId: asrmAssessment.id,
        type: ASSESSMENT_SECTION_TYPES.STANDARD,
        title: 'Happiness',
      },
    ])
    .returning()
    .get();
  await db.insert(assessmentSectionAnswersTable)
    .values([
      {
        assessmentSectionId: asrmAssessmentSection1.id,
        displayOrder: 0,
        title: 'I do not feel happier or more cheerful than usual',
        valueType: ASSESSMENT_SECTION_ANSWER_VALUE_TYPES.NUMBER,
        value: '1',
      },
      {
        assessmentSectionId: asrmAssessmentSection1.id,
        displayOrder: 1,
        title: 'I occasionally feel happier or more cheerful than usual',
        valueType: ASSESSMENT_SECTION_ANSWER_VALUE_TYPES.NUMBER,
        value: '2',
      },
      {
        assessmentSectionId: asrmAssessmentSection1.id,
        displayOrder: 2,
        title: 'I often feel happier or more cheerful than usual',
        valueType: ASSESSMENT_SECTION_ANSWER_VALUE_TYPES.NUMBER,
        value: '3',
      },
      {
        assessmentSectionId: asrmAssessmentSection1.id,
        displayOrder: 3,
        title: 'I feel happier or more cheerful than usual most of the time',
        valueType: ASSESSMENT_SECTION_ANSWER_VALUE_TYPES.NUMBER,
        value: '4',
      },
      {
        assessmentSectionId: asrmAssessmentSection1.id,
        displayOrder: 4,
        title: 'I feel happier of more cheerful than usual all of the time',
        valueType: ASSESSMENT_SECTION_ANSWER_VALUE_TYPES.NUMBER,
        value: '5',
      },
    ]);
  await db.insert(assessmentSectionQuestionsTable)
    .values([
      {
        assessmentSectionId: asrmAssessmentSection1.id,
        disorderId: maniaDisorder.id,
        displayOrder: 0,
        title: 'Choose the statement that best describes your mood for the past ONE (1) WEEK',
      },
    ]);

  const asrmAssessmentSection2 = await db.insert(assessmentSectionsTable)
    .values([
      {
        assessmentId: asrmAssessment.id,
        type: ASSESSMENT_SECTION_TYPES.STANDARD,
        title: 'Self-confidence',
      },
    ])
    .returning()
    .get();
  await db.insert(assessmentSectionAnswersTable)
    .values([
      {
        assessmentSectionId: asrmAssessmentSection2.id,
        displayOrder: 0,
        title: 'I do not feel more self-confident than usual',
        valueType: ASSESSMENT_SECTION_ANSWER_VALUE_TYPES.NUMBER,
        value: '1',
      },
      {
        assessmentSectionId: asrmAssessmentSection2.id,
        displayOrder: 1,
        title: 'I occasionally feel more self-confident than usual',
        valueType: ASSESSMENT_SECTION_ANSWER_VALUE_TYPES.NUMBER,
        value: '2',
      },
      {
        assessmentSectionId: asrmAssessmentSection2.id,
        displayOrder: 2,
        title: 'I often feel more self-confident than usual',
        valueType: ASSESSMENT_SECTION_ANSWER_VALUE_TYPES.NUMBER,
        value: '3',
      },
      {
        assessmentSectionId: asrmAssessmentSection2.id,
        displayOrder: 3,
        title: 'I frequently feel more self-confident than usual',
        valueType: ASSESSMENT_SECTION_ANSWER_VALUE_TYPES.NUMBER,
        value: '4',
      },
      {
        assessmentSectionId: asrmAssessmentSection2.id,
        displayOrder: 4,
        title: 'I feel extremely self-confident all of the time',
        valueType: ASSESSMENT_SECTION_ANSWER_VALUE_TYPES.NUMBER,
        value: '5',
      },
    ]);
  await db.insert(assessmentSectionQuestionsTable)
    .values([
      {
        assessmentSectionId: asrmAssessmentSection2.id,
        disorderId: maniaDisorder.id,
        displayOrder: 0,
        title: 'Choose the statement that best describes your mood for the past ONE (1) WEEK',
      },
    ]);

  const asrmAssessmentSection3 = await db.insert(assessmentSectionsTable)
    .values([
      {
        assessmentId: asrmAssessment.id,
        type: ASSESSMENT_SECTION_TYPES.STANDARD,
        title: 'Sleep',
      },
    ])
    .returning()
    .get();
  await db.insert(assessmentSectionAnswersTable)
    .values([
      {
        assessmentSectionId: asrmAssessmentSection3.id,
        displayOrder: 0,
        title: 'I do not need less sleep than usual',
        valueType: ASSESSMENT_SECTION_ANSWER_VALUE_TYPES.NUMBER,
        value: '1',
      },
      {
        assessmentSectionId: asrmAssessmentSection3.id,
        displayOrder: 1,
        title: 'I occasionally need less sleep than usual',
        valueType: ASSESSMENT_SECTION_ANSWER_VALUE_TYPES.NUMBER,
        value: '2',
      },
      {
        assessmentSectionId: asrmAssessmentSection3.id,
        displayOrder: 2,
        title: 'I often need less sleep than usual',
        valueType: ASSESSMENT_SECTION_ANSWER_VALUE_TYPES.NUMBER,
        value: '3',
      },
      {
        assessmentSectionId: asrmAssessmentSection3.id,
        displayOrder: 3,
        title: 'I frequently need less sleep than usual',
        valueType: ASSESSMENT_SECTION_ANSWER_VALUE_TYPES.NUMBER,
        value: '4',
      },
      {
        assessmentSectionId: asrmAssessmentSection3.id,
        displayOrder: 4,
        title: 'I can go all day and all night without any sleep and still not feel tired',
        valueType: ASSESSMENT_SECTION_ANSWER_VALUE_TYPES.NUMBER,
        value: '5',
      },
    ]);
  await db.insert(assessmentSectionQuestionsTable)
    .values([
      {
        assessmentSectionId: asrmAssessmentSection3.id,
        disorderId: maniaDisorder.id,
        displayOrder: 0,
        title: 'Choose the statement that best describes your mood for the past ONE (1) WEEK',
      },
    ]);

  const asrmAssessmentSection4 = await db.insert(assessmentSectionsTable)
    .values([
      {
        assessmentId: asrmAssessment.id,
        type: ASSESSMENT_SECTION_TYPES.STANDARD,
        title: 'Communication',
      },
    ])
    .returning()
    .get();
  await db.insert(assessmentSectionAnswersTable)
    .values([
      {
        assessmentSectionId: asrmAssessmentSection4.id,
        displayOrder: 0,
        title: 'I do not talk more than usual',
        valueType: ASSESSMENT_SECTION_ANSWER_VALUE_TYPES.NUMBER,
        value: '1',
      },
      {
        assessmentSectionId: asrmAssessmentSection4.id,
        displayOrder: 1,
        title: 'I occasionally talk more than usual',
        valueType: ASSESSMENT_SECTION_ANSWER_VALUE_TYPES.NUMBER,
        value: '2',
      },
      {
        assessmentSectionId: asrmAssessmentSection4.id,
        displayOrder: 2,
        title: 'I often talk more than usual',
        valueType: ASSESSMENT_SECTION_ANSWER_VALUE_TYPES.NUMBER,
        value: '3',
      },
      {
        assessmentSectionId: asrmAssessmentSection4.id,
        displayOrder: 3,
        title: 'I frequently talk more than usual',
        valueType: ASSESSMENT_SECTION_ANSWER_VALUE_TYPES.NUMBER,
        value: '4',
      },
      {
        assessmentSectionId: asrmAssessmentSection4.id,
        displayOrder: 4,
        title: 'I talk constantly and cannot be interrupted',
        valueType: ASSESSMENT_SECTION_ANSWER_VALUE_TYPES.NUMBER,
        value: '5',
      },
    ]);
  await db.insert(assessmentSectionQuestionsTable)
    .values([
      {
        assessmentSectionId: asrmAssessmentSection4.id,
        disorderId: maniaDisorder.id,
        displayOrder: 0,
        title: 'Choose the statement that best describes your mood for the past ONE (1) WEEK',
      },
    ]);

  const asrmAssessmentSection5 = await db.insert(assessmentSectionsTable)
    .values([
      {
        assessmentId: asrmAssessment.id,
        type: ASSESSMENT_SECTION_TYPES.STANDARD,
        title: 'Sleep',
      },
    ])
    .returning()
    .get();
  await db.insert(assessmentSectionAnswersTable)
    .values([
      {
        assessmentSectionId: asrmAssessmentSection5.id,
        displayOrder: 0,
        title: 'I have not been more active (either socially, sexually, at work, home, or school) than usual',
        valueType: ASSESSMENT_SECTION_ANSWER_VALUE_TYPES.NUMBER,
        value: '1',
      },
      {
        assessmentSectionId: asrmAssessmentSection5.id,
        displayOrder: 1,
        title: 'I have occasionally been more active than usual',
        valueType: ASSESSMENT_SECTION_ANSWER_VALUE_TYPES.NUMBER,
        value: '2',
      },
      {
        assessmentSectionId: asrmAssessmentSection5.id,
        displayOrder: 2,
        title: 'I have often been more active than usual',
        valueType: ASSESSMENT_SECTION_ANSWER_VALUE_TYPES.NUMBER,
        value: '3',
      },
      {
        assessmentSectionId: asrmAssessmentSection5.id,
        displayOrder: 3,
        title: 'I have frequently been more active than usual',
        valueType: ASSESSMENT_SECTION_ANSWER_VALUE_TYPES.NUMBER,
        value: '4',
      },
      {
        assessmentSectionId: asrmAssessmentSection5.id,
        displayOrder: 4,
        title: 'I am constantly more active or on the go all the time',
        valueType: ASSESSMENT_SECTION_ANSWER_VALUE_TYPES.NUMBER,
        value: '5',
      },
    ]);
  await db.insert(assessmentSectionQuestionsTable)
    .values([
      {
        assessmentSectionId: asrmAssessmentSection5.id,
        disorderId: maniaDisorder.id,
        displayOrder: 0,
        title: 'Choose the statement that best describes your mood for the past ONE (1) WEEK',
      },
    ]);

  //
  // ASSIST
  //
  const assistAssessment = (await db.select().from(assessmentsTable)
    .where(eq(assessmentsTable.name, 'ASSIST'))
    .get())!;
  const assistAssessmentSection1 = await db.insert(assessmentSectionsTable)
    .values([
      {
        assessmentId: assistAssessment.id,
        type: ASSESSMENT_SECTION_TYPES.STANDARD,
        title: 'At any point in your life, have you ever used...',
      },
    ])
    .returning()
    .get();

  await db.insert(assessmentSectionAnswersTable)
    .values([
      {
        assessmentSectionId: assistAssessmentSection1.id,
        displayOrder: 0,
        title: 'No',
        valueType: ASSESSMENT_SECTION_ANSWER_VALUE_TYPES.NUMBER,
        value: '0',
      },
      {
        assessmentSectionId: assistAssessmentSection1.id,
        displayOrder: 1,
        title: 'Yes',
        valueType: ASSESSMENT_SECTION_ANSWER_VALUE_TYPES.NUMBER,
        value: '3',
      },
    ]);

  await db.insert(assessmentSectionQuestionsTable)
    .values([
      {
        assessmentSectionId: assistAssessmentSection1.id,
        disorderId: substanceUseDisorder.id,
        displayOrder: 0,
        title: 'cannabis (marijuana, pot, grass, hash, etc.)?',
      },
      {
        assessmentSectionId: assistAssessmentSection1.id,
        disorderId: substanceUseDisorder.id,
        displayOrder: 1,
        title: 'cocaine (coke, crack, etc.)?',
      },
      {
        assessmentSectionId: assistAssessmentSection1.id,
        disorderId: substanceUseDisorder.id,
        displayOrder: 2,
        title: 'prescription stimulants just for the feeling, more than prescribed, or that were not prescribed for you. (Ritalin, Adderall, diet pills, etc.)?',
      },
      {
        assessmentSectionId: assistAssessmentSection1.id,
        disorderId: substanceUseDisorder.id,
        displayOrder: 3,
        title: 'methamphetamine (meth, crystal, speed, ecstasy, molly, etc.)?',
      },
      {
        assessmentSectionId: assistAssessmentSection1.id,
        disorderId: substanceUseDisorder.id,
        displayOrder: 4,
        title: 'inhalants (nitrous, glue, paint thinner, poppers, whippets, etc.)?',
      },
      {
        assessmentSectionId: assistAssessmentSection1.id,
        disorderId: substanceUseDisorder.id,
        displayOrder: 5,
        title: 'sedatives just for the feeling, more than prescribed, or that were not prescribed for you. (sleeping pills, Valium, Xanax, tranquilizers, benzos, etc.)?',
      },
      {
        assessmentSectionId: assistAssessmentSection1.id,
        disorderId: substanceUseDisorder.id,
        displayOrder: 6,
        title: 'hallucinogens (LSD, acid, mushrooms, PCP, Special K, ecstasy, etc.)?',
      },
      {
        assessmentSectionId: assistAssessmentSection1.id,
        disorderId: substanceUseDisorder.id,
        displayOrder: 7,
        title: 'street opioids (heroin, opium, etc.)?',
      },
      {
        assessmentSectionId: assistAssessmentSection1.id,
        disorderId: substanceUseDisorder.id,
        displayOrder: 8,
        title: 'prescription opioids just for the feeling, more than prescribed, or that were not prescribed for you. (Fentanyl, Oxycodone, OxyContin, Percocet, Vicodin, methadone, Buprenorphine, etc.)?',
      },
      {
        assessmentSectionId: assistAssessmentSection1.id,
        disorderId: substanceUseDisorder.id,
        displayOrder: 9,
        title: 'any other drug(s) to get high?',
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
    });

  const bpdsAssessment = (await db.select().from(assessmentsTable)
    .where(eq(assessmentsTable.name, 'BPDS'))
    .get())!;
  await db.insert(assessmentInstancesTable)
    .values({
      providerId: provider.id,
      patientId: patient.id,
      assessmentId: bpdsAssessment.id,
      slug: generateSlug(),
      sentAt: new Date().toISOString(),
    });
}

async function seedSubmissionRules() {
  const anxietyDisorder = (await db.select().from(disordersTable)
    .where(eq(disordersTable.name, 'anxiety'))
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

  const blueprintScreenerAssessment = (await db.select().from(assessmentsTable)
    .where(eq(assessmentsTable.name, 'BPDS'))
    .get())!;
  const depressionAnxietyAssessment = (await db.select().from(assessmentsTable)
    .where(eq(assessmentsTable.name, 'PHQ-9'))
    .get())!;
  const maniaAssessment = (await db.select().from(assessmentsTable)
    .where(eq(assessmentsTable.name, 'ASRM'))
    .get())!;
  const substanceUseAssessment = (await db.select().from(assessmentsTable)
    .where(eq(assessmentsTable.name, 'ASSIST'))
    .get())!;

  await db.insert(submissionRulesTable)
    .values([
      {
        assessmentId: blueprintScreenerAssessment.id,

        filterType: SUBMISSION_RULE_FILTER_TYPES.QUESTION_DOMAIN,
        filterValue: depressionDisorder.id,

        scoreOperation: SUBMISSION_RULE_SCORE_OPS.SUM,

        evalOperation: SUBMISSION_RULE_EVAL_OPS.GREATER_THAN_OR_EQUAL,
        evalValue: '2',

        actionType: SUBMISSION_RULE_ACTION_TYPES.ASSIGN_ASSESSMENT,
        actionValue: depressionAnxietyAssessment.id,
      },
      {
        assessmentId: blueprintScreenerAssessment.id,

        filterType: SUBMISSION_RULE_FILTER_TYPES.QUESTION_DOMAIN,
        filterValue: maniaDisorder.id,

        scoreOperation: SUBMISSION_RULE_SCORE_OPS.SUM,

        evalOperation: SUBMISSION_RULE_EVAL_OPS.GREATER_THAN_OR_EQUAL,
        evalValue: '2',

        actionType: SUBMISSION_RULE_ACTION_TYPES.ASSIGN_ASSESSMENT,
        actionValue: maniaAssessment.id,
      },
      {
        assessmentId: blueprintScreenerAssessment.id,

        filterType: SUBMISSION_RULE_FILTER_TYPES.QUESTION_DOMAIN,
        filterValue: anxietyDisorder.id,

        scoreOperation: SUBMISSION_RULE_SCORE_OPS.SUM,

        evalOperation: SUBMISSION_RULE_EVAL_OPS.GREATER_THAN_OR_EQUAL,
        evalValue: '2',

        actionType: SUBMISSION_RULE_ACTION_TYPES.ASSIGN_ASSESSMENT,
        actionValue: depressionAnxietyAssessment.id,
      },
      {
        assessmentId: blueprintScreenerAssessment.id,

        filterType: SUBMISSION_RULE_FILTER_TYPES.QUESTION_DOMAIN,
        filterValue: substanceUseDisorder.id,

        scoreOperation: SUBMISSION_RULE_SCORE_OPS.SUM,

        evalOperation: SUBMISSION_RULE_EVAL_OPS.GREATER_THAN_OR_EQUAL,
        evalValue: '1',

        actionType: SUBMISSION_RULE_ACTION_TYPES.ASSIGN_ASSESSMENT,
        actionValue: substanceUseAssessment.id,
      },
    ]);
}

async function seedDb() {
  await seedDisorders();
  await seedAssessments();
  await seedUsers();
  await seedSubmissionRules();
}

seedDb().then(() => {
  console.log('Successfully seeded DB');
}).catch(err => {
  console.log('ERROR', err);
});
