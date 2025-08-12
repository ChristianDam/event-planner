import { Suspense } from "react";
import { TeamProfileClient } from "./TeamProfileClient";

export default async function TeamProfilePage({ 
  params 
}: { 
  params: Promise<{ teamSlug: string }> 
}) {
  const { teamSlug } = await params;
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TeamProfileClient teamSlug={teamSlug} />
    </Suspense>
  );
}

// SEO and metadata
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ teamSlug: string }> 
}) {
  const { teamSlug } = await params;
  
  return {
    title: `${teamSlug.replace(/-/g, ' ')} - Creative Team Profile`,
    description: `Discover ${teamSlug.replace(/-/g, ' ')}'s upcoming creative events in Aarhus and Copenhagen.`,
    openGraph: {
      title: `${teamSlug.replace(/-/g, ' ')} - Creative Team`,
      description: `Discover ${teamSlug.replace(/-/g, ' ')}'s upcoming creative events.`,
      type: 'website',
    },
  };
}