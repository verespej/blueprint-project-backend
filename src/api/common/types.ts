export type TypAssessmentInstancePayload = {
  assessmentDisplayName: string;
  assessmentFullName: string;
  assessmentId: string;
  assessmentName: string;
  id: string;
  patientId: string;
  providerFamilyName: string;
  providerGivenName: string;
  providerId: string;
  sentAt: string | null;
  slug: string;
  submittedAt: string | null;
}

export type TypAssessmentResponsePayload = {
  answerId: string;
  assessmentInstanceId: string;
  id: string;
  questionId: string;
}
