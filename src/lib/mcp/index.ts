import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getProfileTool from "./tools/get-profile";
import listAssessmentsTool from "./tools/list-assessments";
import listSavedPlansTool from "./tools/list-saved-plans";
import listDebtsTool from "./tools/list-debts";

// The OAuth issuer MUST be the direct Supabase host, built from the project
// ref so it stays a build-time literal and never triggers a runtime env read.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "rprx-4-life-mcp",
  title: "RPRx 4 Life",
  version: "0.1.0",
  instructions:
    "Read the signed-in user's RPRx financial wellness data: profile, Four Horsemen assessments, saved strategy plans, and debts. All tools are read-only and scoped to the authenticated user via Supabase RLS.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [getProfileTool, listAssessmentsTool, listSavedPlansTool, listDebtsTool],
});
