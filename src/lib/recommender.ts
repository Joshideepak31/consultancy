import type { Country, Program, Student, University } from "./types";
import { finalFee } from "./store";

export interface Match {
  program: Program;
  university: University;
  country: Country;
  score: number;
  finalFee: number;
  reasons: string[];
  warnings: string[];
}

/**
 * Score a program against a (possibly very partial) student profile.
 * Missing student fields are treated as "no constraint" — never disqualifying.
 */
export function recommend(
  student: Student,
  programs: Program[],
  universities: University[],
  countries: Country[],
  limit = 12,
): Match[] {
  const uniMap = new Map(universities.map((u) => [u.id, u]));
  const ctyMap = new Map(countries.map((c) => [c.id, c]));

  const matches: Match[] = [];
  for (const p of programs) {
    if (p.status === "Archived") continue;
    const u = uniMap.get(p.universityId);
    if (!u) continue;
    const c = ctyMap.get(u.countryId);
    if (!c) continue;

    let score = 50;
    const reasons: string[] = [];
    const warnings: string[] = [];

    // Country preference
    if (student.preferredCountries?.length) {
      if (student.preferredCountries.includes(c.id)) {
        score += 20; reasons.push(`Preferred country: ${c.name}`);
      } else {
        score -= 25;
      }
    }

    // Level
    if (student.preferredLevel) {
      if (p.level === student.preferredLevel) { score += 15; reasons.push(`Matches ${p.level} level`); }
      else score -= 30;
    }

    // Category / interest
    if (student.preferredCategory && p.category) {
      if (p.category.toLowerCase() === student.preferredCategory.toLowerCase()) {
        score += 12; reasons.push(`${p.category} program`);
      }
    }

    // Intake
    if (student.preferredIntake && p.intakes?.length) {
      if (p.intakes.includes(student.preferredIntake)) {
        score += 8; reasons.push(`Available in ${student.preferredIntake} intake`);
      } else {
        warnings.push(`Not offered in ${student.preferredIntake} intake`);
      }
    }

    // Budget
    const fee = finalFee(p);
    if (student.budgetMax && fee > 0) {
      if (fee <= student.budgetMax) { score += 12; reasons.push(`Within budget (${p.currency ?? ""} ${fee.toLocaleString()})`); }
      else { score -= 15; warnings.push(`Over budget by ${(fee - student.budgetMax).toLocaleString()}`); }
    }

    // GPA
    if (student.gpa !== undefined && p.minGpa !== undefined) {
      if (student.gpa >= p.minGpa) { score += 8; reasons.push(`GPA meets minimum ${p.minGpa}`); }
      else { score -= 20; warnings.push(`GPA below minimum ${p.minGpa}`); }
    }

    // IELTS
    if (p.ieltsOverall !== undefined) {
      if (student.ielts !== undefined) {
        if (student.ielts >= p.ieltsOverall) { score += 10; reasons.push(`IELTS ${student.ielts} ≥ ${p.ieltsOverall}`); }
        else if (student.hasMoi && (p.moiAccepted || u.moi)) { score += 5; reasons.push("MOI accepted as English proof"); }
        else { score -= 15; warnings.push(`IELTS below required ${p.ieltsOverall}`); }
      } else if (student.hasMoi && (p.moiAccepted || u.moi)) {
        score += 5; reasons.push("MOI accepted as English proof");
      }
    }

    // Backlogs / gap
    if (student.hasBacklogs && u.backlogsAccepted === false) {
      score -= 10; warnings.push("University does not accept backlogs");
    }
    if (student.gapYears !== undefined && u.maxGap !== undefined && student.gapYears > u.maxGap) {
      score -= 10; warnings.push(`Gap exceeds university limit (${u.maxGap}y)`);
    }

    // Scholarship boost
    if (p.scholarshipAvailable) { score += 4; reasons.push("Scholarship available"); }

    matches.push({ program: p, university: u, country: c, score, finalFee: fee, reasons, warnings });
  }

  return matches.sort((a, b) => b.score - a.score).slice(0, limit);
}