import { Suspense } from "react";
import { EventPageClient } from "./EventPageClient";

export default async function EventPage({ 
  params 
}: { 
  params: Promise<{ teamSlug: string; eventSlug: string }> 
}) {
  const { teamSlug, eventSlug } = await params;
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EventPageClient teamSlug={teamSlug} eventSlug={eventSlug} />
    </Suspense>
  );
}

// SEO and metadata
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ teamSlug: string; eventSlug: string }> 
}) {
  const { teamSlug, eventSlug } = await params;
  
  return {
    title: `${eventSlug.replace(/-/g, ' ')} - ${teamSlug} | Creative Events`,
    description: `Join this creative event organized by ${teamSlug}. RSVP now!`,
    openGraph: {
      title: `${eventSlug.replace(/-/g, ' ')} - ${teamSlug}`,
      description: `Join this creative event organized by ${teamSlug}. RSVP now!`,
      type: 'website',
    },
  };
}