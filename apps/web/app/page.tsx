import { getAnalysis, listSessions } from "@teach-gpt/core";
import { TeachDashboard } from "../components/teach-dashboard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const sessions = await listSessions();
  const first = sessions[0];
  const analysis = first?.analysis_path ? await getAnalysis(first.id) : null;
  return <TeachDashboard initialSessions={sessions} initialAnalysis={analysis} />;
}
