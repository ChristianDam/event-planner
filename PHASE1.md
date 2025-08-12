# Creative Event Management Platform - Phase 1 Product Specification

**Project Overview:** Team-based event management platform for creative organizers in Aarhus and Copenhagen
**Tech Stack:** Next.js 14 (App Router), Convex, TypeScript, Tailwind CSS
**Target:** Artists, collectives, galleries, creative communities who work in teams

## Project Structure

```
/
├── convex/
│ ├── schema.ts # Database schema definitions
│ ├── auth.config.ts # Convex Auth configuration
│ ├── teams.ts # Team queries and mutations
│ ├── events.ts # Event queries and mutations
│ ├── rsvps.ts # RSVP system
│ └── permissions.ts # Permission helpers
├── app/
│ ├── (auth)/
│ │ ├── signup/page.tsx # User registration
│ │ ├── login/page.tsx # User login
│ │ └── join/[code]/page.tsx # Team invite acceptance
│ ├── dashboard/
│ │ └── [teamSlug]/
│ │ ├── page.tsx # Team dashboard
│ │ ├── events/
│ │ │ ├── new/page.tsx # Create event
│ │ │ └── [id]/edit/page.tsx # Edit event
│ │ └── settings/page.tsx # Team management
│ ├── [teamSlug]/
│ │ └── [eventSlug]/page.tsx # Public event page
│ ├── teams/
│ │ └── [teamSlug]/page.tsx # Team profile page
│ ├── aarhus/page.tsx # Aarhus events discovery
│ ├── copenhagen/page.tsx # Copenhagen events discovery
│ └── layout.tsx # Root layout
├── components/
│ ├── auth/
│ ├── teams/
│ ├── events/
│ └── ui/
└── lib/
├── convex.ts # Convex client setup
├── auth.ts # Auth utilities
└── permissions.ts # Permission checking hooks
```

## Database Schema

### Core Tables

**users**
```typescript
{
_id: Id<"users">,
email: string,
name: string,
bio?: string,
createdAt: number
}
```

**teams**
```typescript
{
_id: Id<"teams">,
name: string,
description?: string,
slug: string,
createdAt: number,
updatedAt: number
}
```

**teamMembers**
```typescript
{
_id: Id<"teamMembers">,
teamId: Id<"teams">,
userId: Id<"users">,
role: "owner" | "admin" | "member",
joinedAt: number
}
```

**events**
```typescript
{
_id: Id<"events">,
teamId: Id<"teams">,
createdBy: Id<"users">,
title: string,
description: string,
startDate: number,
endDate: number,
location: {
address: string,
venue?: string,
coordinates?: { lat: number, lng: number }
},
capacity?: number,
slug: string,
status: "draft" | "published",
createdAt: number,
updatedAt: number
}
```

**rsvps**
```typescript
{
_id: Id<"rsvps">,
eventId: Id<"events">,
attendeeName: string,
attendeeEmail: string,
message?: string,
status: "confirmed" | "waitlist",
createdAt: number
}
```

## Permission System

| Role | Create Events | Edit Any Event | Delete Events | Manage Members | Team Settings |
|------|---------------|----------------|---------------|----------------|---------------|
| Owner | ✅ | ✅ | ✅ | ✅ | ✅ |
| Admin | ✅ | ✅ | ✅ | ✅ | ❌ |
| Member | ✅ | Own only | Own only | ❌ | ❌ |

## URL Structure

- Team events: `/{teamSlug}/{eventSlug}`
- Team profile: `/teams/{teamSlug}`
- Team dashboard: `/dashboard/{teamSlug}`
- Team settings: `/dashboard/{teamSlug}/settings`
- City discovery: `/aarhus`, `/copenhagen`

## Implementation Tasks

### TASK 1: Database Setup & Auth
**File: `convex/schema.ts`**
- Define all database tables with proper indexing
- Set up relationships between users, teams, events
- Include search indexes for events and teams

**File: `convex/auth.config.ts`**
- Configure Convex Auth with email/password
- Set up user creation flow
- Handle team association during signup

**Files: `convex/teams.ts`, `convex/events.ts`, `convex/rsvps.ts`**
- Implement all CRUD operations with permission checking
- Team-scoped queries (events belong to teams)
- Real-time subscriptions for dashboard updates

### TASK 2: Team Onboarding Flow
**Files: `app/(auth)/signup/page.tsx`, `app/(auth)/login/page.tsx`**
- Registration with team creation or joining options
- Team invite code validation
- Redirect to appropriate team dashboard

**File: `app/join/[code]/page.tsx`**
- Handle team invitation acceptance
- Create user account and add to team
- Proper error handling for expired/invalid codes

### TASK 3: Team Management System
**File: `components/teams/TeamOnboarding.tsx`**
- Create new team or join existing flow
- Team name validation and slug generation
- User-friendly team setup process

**File: `components/teams/InviteSystem.tsx`**
- Generate and send team invitations
- Manage pending invites
- Role assignment for new members

**File: `app/dashboard/[teamSlug]/settings/page.tsx`**
- Team member management interface
- Role promotion/demotion (permission-based)
- Team profile editing

### TASK 4: Event Management
**File: `app/dashboard/[teamSlug]/events/new/page.tsx`**
- Team-scoped event creation form
- Rich text editor for descriptions
- Location autocomplete and validation
- Draft/publish workflow

**File: `app/dashboard/[teamSlug]/page.tsx`**
- Team dashboard with event overview
- Team metrics and recent activity
- Member activity feed
- Team switching for multi-team users

### TASK 5: Public Event Pages
**File: `app/[teamSlug]/[eventSlug]/page.tsx`**
- SEO-optimized event pages with team branding
- RSVP functionality for attendees
- Social sharing with team context
- Related events from same team

**File: `components/events/RSVPForm.tsx`**
- Simple attendee registration
- Capacity checking and waitlist handling
- Email confirmation system

### TASK 6: Discovery & Team Profiles
**Files: `app/aarhus/page.tsx`, `app/copenhagen/page.tsx`**
- City-specific event discovery
- Filter by date, category, team
- Search across events and teams
- Featured team spotlights

**File: `app/teams/[teamSlug]/page.tsx`**
- Public team profile pages
- Showcase all team's published events
- Team bio and member highlights
- Social links and contact info

### TASK 7: Permission & Security
**File: `lib/permissions.ts`**
- Permission checking hooks and utilities
- Team membership validation
- Role-based UI component rendering

**File: `middleware.ts`**
- Route protection for team-scoped pages
- Redirect unauthorized users appropriately
- Team context validation

## Design Requirements

### Visual Style
- **Creative-first design** appealing to artists and cultural organizers
- **Mobile-first responsive** design for on-the-go event management
- **Instagram-worthy event pages** for easy social sharing
- **Clean, modern interface** that doesn't intimidate non-technical users

### Team Branding
- Consistent visual identity across all team events
- Team logo/avatar display on event pages
- Customizable team color schemes (Phase 2)
- Professional appearance for credibility

### User Experience
- **Intuitive team switching** for multi-team members
- **Real-time collaboration** indicators
- **Clear permission feedback** (what user can/cannot do)
- **Smooth onboarding flow** for both team creation and joining

## Success Criteria

### Technical
- [ ] Teams can create and manage events collaboratively
- [ ] Permission system prevents unauthorized access
- [ ] Real-time updates across team members
- [ ] Public event pages load in <2 seconds
- [ ] Mobile experience is smooth and intuitive

### User Experience
- [ ] Team creation takes <2 minutes
- [ ] Event creation takes <5 minutes
- [ ] RSVP process takes <30 seconds
- [ ] Team members can easily collaborate on events
- [ ] Event pages look professional enough to share proudly

### Business
- [ ] Teams want to create multiple events (retention indicator)
- [ ] Events get meaningful RSVP numbers
- [ ] Teams invite additional members (growth indicator)
- [ ] Public event pages generate organic traffic

## Phase 1 Deliverables

1. **Working team-based authentication** with onboarding flow
2. **Event creation and management** with team collaboration
3. **Beautiful public event pages** with team branding
4. **Team dashboard** with analytics and member management
5. **City discovery pages** for finding events
6. **Permission system** ensuring proper access control
7. **Mobile-responsive design** optimized for creative users

## Next Phase Preview

Phase 2 will add:
- Payment processing for paid events
- Advanced visual customization for teams
- Email marketing tools for event promotion
- Enhanced analytics and reporting
- Team portfolio/showcase features

---

**Development Notes:**
- Prioritize team collaboration features that differentiate from individual event platforms
- Focus on visual appeal and ease of use for creative, non-technical users
- Build permission system robustly from the start to avoid security issues
- Design database schema to support future payment and customization features