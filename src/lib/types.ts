export type RecordStatus = "Draft" | "Verified" | "Needs Update" | "Outdated" | "Archived";
export type Tri = "Low" | "Medium" | "High";

export interface Country {
  id: string;
  name: string;
  flag?: string;
  currency: string;
  timezone?: string;
  shortDescription?: string;
  summary?: string;
  // study rules
  avgTuition?: string;
  avgLivingCost?: number;
  workRights?: string;
  pswDuration?: string;
  prPossibility?: Tri;
  popularIntakes?: string[];
  processingTime?: string;
  // english/academic
  ielts?: boolean;
  pte?: boolean;
  duolingo?: boolean;
  moi?: boolean;
  minGpa?: number;
  gapAccepted?: boolean;
  maxGap?: number;
  backlogsAccepted?: boolean;
  gapNotes?: string;
  // visa & finance
  visaFee?: number;
  medical?: boolean;
  biometrics?: boolean;
  tbTest?: boolean;
  bankStatement?: boolean;
  bankBalance?: number;
  sponsorAllowed?: boolean;
  loanAccepted?: boolean;
  financialNotes?: string;
  // dependent
  dependentAllowed?: boolean;
  spouseCanWork?: boolean;
  childrenAllowed?: boolean;
  dependentVisaFee?: number;
  dependentFinancial?: number;
  dependentNotes?: string;
  // notes
  internalNotes?: string;
  riskNotes?: string;
  publicSummary?: string;
  lastVerified?: string;
  source?: string;
  status: RecordStatus;
  updatedAt: string;
}

export interface University {
  id: string;
  name: string;
  countryId: string;
  city?: string;
  campus?: string;
  logo?: string;
  website?: string;
  type?: "Public" | "Private";
  ranking?: string;
  partner?: boolean;
  priority?: Tri;
  // admission
  ugAccepted?: boolean;
  pgAccepted?: boolean;
  foundationAccepted?: boolean;
  iyOneAccepted?: boolean;
  minGpaUg?: number;
  minGpaPg?: number;
  threeYrBachelor?: boolean;
  fourYrBachelor?: boolean;
  indianDegree?: boolean;
  nepaliDegree?: boolean;
  nepaliMoiUnis?: string[];
  indianMoiUnis?: string[];
  gapAccepted?: boolean;
  maxGap?: number;
  backlogsAccepted?: boolean;
  // english
  ieltsRequired?: boolean;
  ieltsOverall?: number;
  ieltsBand?: number;
  pteRequired?: boolean;
  pteScore?: number;
  duolingo?: boolean;
  moi?: boolean;
  g12Waiver?: boolean;
  g12English?: string;
  waiverNotes?: string;
  // fees
  applicationFee?: number;
  deposit?: number;
  avgTuition?: number;
  scholarshipAvailable?: boolean;
  scholarshipAmount?: number;
  scholarshipType?: string;
  scholarshipNotes?: string;
  // process
  offerProcessingTime?: string;
  interviewRequired?: boolean;
  preCasInterview?: boolean;
  casProcess?: boolean;
  credibilityInterview?: boolean;
  visaConfidence?: Tri;
  internalWarnings?: string;
  processNotes?: string;
  // notes
  counselorNotes?: string;
  status: RecordStatus;
  updatedAt: string;
}

export type ProgramLevel =
  | "Foundation"
  | "Diploma"
  | "Undergraduate"
  | "International Year One"
  | "Postgraduate"
  | "MBA"
  | "PhD";

export interface Program {
  id: string;
  name: string;
  universityId: string;
  level: ProgramLevel;
  faculty?: string;
  category?: string;
  duration?: string;
  placement?: boolean;
  description?: string;
  intakes?: string[];
  applicationDeadline?: string;
  intakeNotes?: string;
  currency?: string;
  annualTuition?: number;
  totalTuition?: number;
  applicationFee?: number;
  deposit?: number;
  scholarshipAvailable?: boolean;
  scholarshipAmount?: number;
  scholarshipPercentage?: number;
  otherFees?: number;
  feeNotes?: string;
  minGpa?: number;
  minPlus2?: number;
  minBachelor?: number;
  academicBackground?: string;
  relatedBackground?: boolean;
  workExperience?: boolean;
  portfolio?: boolean;
  ieltsOverall?: number;
  pteScore?: number;
  moiAccepted?: boolean;
  status: RecordStatus;
  updatedAt: string;
}

export interface Student {
  id: string;
  fullName?: string;
  email?: string;
  phone?: string;
  preferredCountries?: string[];
  preferredLevel?: ProgramLevel | "";
  preferredCategory?: string;
  preferredIntake?: string;
  budgetMax?: number;
  gpa?: number;
  ielts?: number;
  pte?: number;
  hasMoi?: boolean;
  gapYears?: number;
  hasBacklogs?: boolean;
  notes?: string;
  shortlistedProgramIds?: string[];
  createdAt: string;
  trackerEvents?: TrackerEvent[];
}

export const TRACKER_STAGES = [
  "Initial Consultation",
  "Document Collection",
  "Application Submitted",
  "Offer Letter Received",
  "Interview",
  "CAS / I-20 Issued",
  "Tuition Deposit Paid",
  "Bank Statement Ready",
  "Visa Application Submitted",
  "Biometrics",
  "Medical",
  "Visa Approved",
  "Pre-Departure Briefing",
  "Departed",
] as const;
export type TrackerStage = typeof TRACKER_STAGES[number];

export interface TrackerEvent {
  id: string;
  stage: TrackerStage;
  at: string; // ISO timestamp
  note?: string;
}

export type RuleScope = "Country" | "University" | "Program" | "Global";
export type RuleCategory = "GPA" | "English" | "Gap" | "Backlogs" | "Finance" | "Visa" | "Other";

export interface Rule {
  id: string;
  title: string;
  scope: RuleScope;
  category: RuleCategory;
  appliesTo?: string[]; // ids of countries/universities/programs
  description: string;
  status: RecordStatus;
  updatedAt: string;
}

export type MediaKind = "Brochure" | "Fee Sheet" | "Flyer" | "Screenshot" | "PDF" | "Other";
export interface MediaItem {
  id: string;
  title: string;
  kind: MediaKind;
  url: string; // data URL or external
  mime?: string;
  size?: number;
  countryId?: string;
  universityId?: string;
  programId?: string;
  tags?: string[];
  description?: string;
  uploadedAt: string;
  folderId?: string;
}

export interface Folder {
  id: string;
  name: string;
  parentId?: string;
  createdAt: string;
}

export type NoteCategory = "Embassy" | "Visa Policy" | "University Update" | "Process" | "Escalation" | "Other";
export interface Note {
  id: string;
  title: string;
  category: NoteCategory;
  body: string;
  pinned?: boolean;
  countryId?: string;
  universityId?: string;
  updatedAt: string;
}

export interface Counselor {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "Counselor" | "Senior Counselor" | "Lead";
  countries?: string[];
  active: boolean;
  joinedAt: string;
}

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  action: "create" | "update" | "delete" | "verify" | "archive";
  entity: "Country" | "University" | "Program" | "Rule" | "Note" | "Media" | "Counselor" | "ProcessMap" | "Settings";
  entityName: string;
  details?: string;
}

export interface ProcessStep {
  id: string;
  title: string;
  owner?: "Student" | "Counselor" | "University" | "Embassy";
  duration?: string;
  description?: string;
}
export interface ProcessMap {
  id: string;
  title: string;
  countryId?: string;
  type: "Application" | "CAS" | "Visa" | "Departure" | "End-to-End";
  steps: ProcessStep[];
  status: RecordStatus;
  updatedAt: string;
}

export interface Settings {
  workspaceName: string;
  defaultCurrency: string;
  primaryContact?: string;
  brandTagline?: string;
  fiscalYearStart?: string;
}