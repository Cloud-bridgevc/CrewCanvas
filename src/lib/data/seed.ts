// Fictional demonstration data. All companies, people and projects are invented.
import type {
  Approval,
  ChecklistItem,
  Crew,
  CrewAvailability,
  Dependency,
  Evidence,
  Person,
  Project,
  Subcontractor,
  WorkPackage,
} from "../types";

/** The demo is pinned to a fixed "today" so the scenario is reproducible. */
export const DEMO_AS_OF = "2026-10-19";

export const people: Person[] = [
  { id: "p-dana", name: "Dana Ruiz", role: "superintendent", company: "Northline Builders", email: "dana.ruiz@northline.example" },
  { id: "p-marcus", name: "Marcus Chen", role: "project_manager", company: "Northline Builders", email: "marcus.chen@northline.example" },
  { id: "p-priya", name: "Priya Natarajan", role: "project_engineer", company: "Northline Builders", email: "priya.n@northline.example" },
  { id: "p-owen", name: "Owen Hale", role: "safety_manager", company: "Northline Builders", email: "owen.hale@northline.example" },
  { id: "p-jo", name: "Jo Whitaker", role: "superintendent", company: "Northline Builders", email: "jo.whitaker@northline.example" },
  { id: "p-luis", name: "Luis Ortega", role: "foreman", company: "Summit Concrete Co.", email: "luis@summitconcrete.example" },
];

export const projects: Project[] = [
  {
    id: "hpm",
    code: "HPM-26",
    name: "Harbor Point Medical Pavilion",
    client: "Harbor Point Health Partners",
    location: "Bayview, WA",
    sector: "Healthcare · 4-story steel frame · 62,000 sf",
    startDate: "2026-09-08",
    endDate: "2027-06-30",
    status: "active",
    contractValue: "$28.4M",
    superintendentId: "p-dana",
    projectManagerId: "p-marcus",
  },
  {
    id: "nlc",
    code: "NLC-26",
    name: "Northgate Logistics Center — Tenant Fit-out",
    client: "Northgate Industrial REIT",
    location: "Kent Valley, WA",
    sector: "Industrial · Interior fit-out · 18,500 sf office",
    startDate: "2026-10-05",
    endDate: "2027-01-22",
    status: "active",
    contractValue: "$4.1M",
    superintendentId: "p-jo",
    projectManagerId: "p-marcus",
  },
  {
    id: "crt",
    code: "CRT-27",
    name: "Cedar Row Townhomes — Phase 2",
    client: "Cedar Row Living LLC",
    location: "Maple Hollow, WA",
    sector: "Multifamily · 24 wood-frame units",
    startDate: "2026-11-02",
    endDate: "2027-09-15",
    status: "preconstruction",
    contractValue: "$9.7M",
    superintendentId: "p-jo",
    projectManagerId: "p-marcus",
  },
];

export const subcontractors: Subcontractor[] = [
  { id: "s-ironclad", name: "Ironclad Steel Erectors", trade: "Structural steel", contactName: "Rae Donnelly", contactEmail: "rae@ironclad.example", phone: "(253) 555-0141" },
  { id: "s-summit", name: "Summit Concrete Co.", trade: "Concrete", contactName: "Luis Ortega", contactEmail: "luis@summitconcrete.example", phone: "(253) 555-0177" },
  { id: "s-brightline", name: "Brightline Electric", trade: "Electrical", contactName: "Tess Moreau", contactEmail: "tess@brightline.example", phone: "(253) 555-0102" },
  { id: "s-delta", name: "Delta Mechanical & Plumbing", trade: "Plumbing / HVAC", contactName: "Sam Okafor", contactEmail: "sam@deltamech.example", phone: "(253) 555-0190" },
  { id: "s-apex", name: "Apex Fire Protection", trade: "Fire sprinkler", contactName: "Bea Lindqvist", contactEmail: "bea@apexfire.example", phone: "(253) 555-0133" },
  { id: "s-clearview", name: "Clearview Glazing", trade: "Curtain wall / glazing", contactName: "Nate Kim", contactEmail: "nate@clearview.example", phone: "(253) 555-0168" },
  { id: "s-ridgeline", name: "Ridgeline Roofing", trade: "Roofing", contactName: "Ana Petrov", contactEmail: "ana@ridgeline.example", phone: "(253) 555-0115" },
  { id: "s-keystone", name: "Keystone Testing & Inspection", trade: "Special inspection (3rd party)", contactName: "Grant Yu", contactEmail: "grant@keystonetesting.example", phone: "(253) 555-0109" },
];

export const crews: Crew[] = [
  { id: "c-iron-a", subcontractorId: "s-ironclad", name: "Raising Gang A", trade: "Structural steel", headcount: 6, foreman: "Rae Donnelly" },
  { id: "c-summit-1", subcontractorId: "s-summit", name: "Placement Crew 1", trade: "Concrete", headcount: 8, foreman: "Luis Ortega" },
  { id: "c-summit-2", subcontractorId: "s-summit", name: "Site Crew 2", trade: "Concrete", headcount: 5, foreman: "Hector Ruiz" },
  { id: "c-bright-a", subcontractorId: "s-brightline", name: "Crew A", trade: "Electrical", headcount: 4, foreman: "Tess Moreau" },
  { id: "c-bright-b", subcontractorId: "s-brightline", name: "Crew B", trade: "Electrical", headcount: 3, foreman: "Devon Pike" },
  { id: "c-delta-1", subcontractorId: "s-delta", name: "Plumbing Crew 1", trade: "Plumbing", headcount: 4, foreman: "Sam Okafor" },
  { id: "c-delta-2", subcontractorId: "s-delta", name: "Plumbing Crew 2", trade: "Plumbing", headcount: 3, foreman: "Mia Grant" },
  { id: "c-apex-1", subcontractorId: "s-apex", name: "Sprinkler Crew", trade: "Fire sprinkler", headcount: 3, foreman: "Bea Lindqvist" },
  { id: "c-clear-1", subcontractorId: "s-clearview", name: "Install Crew", trade: "Curtain wall", headcount: 5, foreman: "Nate Kim" },
  { id: "c-ridge-1", subcontractorId: "s-ridgeline", name: "Roofing Crew", trade: "Roofing", headcount: 6, foreman: "Ana Petrov" },
];

export const availability: CrewAvailability[] = [
  { id: "av-1", crewId: "c-clear-1", startDate: "2026-10-26", endDate: "2026-10-27", status: "unavailable", reason: "Manufacturer installer certification (off site)" },
  { id: "av-2", crewId: "c-iron-a", startDate: "2026-10-22", endDate: "2026-10-23", status: "reduced", reason: "Down 1 ironworker (5 of 6)" },
  { id: "av-3", crewId: "c-summit-1", startDate: "2026-10-30", endDate: "2026-10-30", status: "unavailable", reason: "Committed to another GC's pour" },
];

export const workPackages: WorkPackage[] = [
  // ---- Harbor Point Medical Pavilion ----
  { id: "wp-100", projectId: "hpm", code: "03-100", name: "Foundations & footings", trade: "Concrete", zone: "Building footprint", exclusiveZone: false, subcontractorId: "s-summit", crewId: "c-summit-1", startDate: "2026-09-08", endDate: "2026-09-25", status: "complete", percentComplete: 100, equipment: [] },
  { id: "wp-110", projectId: "hpm", code: "05-110", name: "Structural steel — Levels 1–2", trade: "Structural steel", zone: "Levels 1–2", exclusiveZone: false, subcontractorId: "s-ironclad", crewId: "c-iron-a", startDate: "2026-09-28", endDate: "2026-10-09", status: "complete", percentComplete: 100, equipment: ["90T mobile crane"] },
  { id: "wp-120", projectId: "hpm", code: "05-120", name: "Structural steel — Level 3 to roof", trade: "Structural steel", zone: "Levels 3–Roof", exclusiveZone: false, subcontractorId: "s-ironclad", crewId: "c-iron-a", startDate: "2026-10-12", endDate: "2026-10-23", status: "in_progress", percentComplete: 45, equipment: ["90T mobile crane"] },
  { id: "wp-200", projectId: "hpm", code: "03-200", name: "Level 2 slab-on-deck pour", trade: "Concrete", zone: "Level 2", exclusiveZone: true, subcontractorId: "s-summit", crewId: "c-summit-1", startDate: "2026-10-22", endDate: "2026-10-23", status: "not_started", percentComplete: 0, equipment: ["42m concrete pump"] },
  { id: "wp-210", projectId: "hpm", code: "03-210", name: "Loading dock slab-on-grade", trade: "Concrete", zone: "Loading dock", exclusiveZone: false, subcontractorId: "s-summit", crewId: "c-summit-1", startDate: "2026-10-28", endDate: "2026-10-29", status: "not_started", percentComplete: 0, equipment: [] },
  { id: "wp-300", projectId: "hpm", code: "22-300", name: "Level 1 underground plumbing & rough-in", trade: "Plumbing", zone: "Level 1 East", exclusiveZone: false, subcontractorId: "s-delta", crewId: "c-delta-1", startDate: "2026-10-13", endDate: "2026-10-21", status: "in_progress", percentComplete: 70, equipment: [] },
  { id: "wp-310", projectId: "hpm", code: "26-310", name: "Level 1 electrical rough-in", trade: "Electrical", zone: "Level 1 West", exclusiveZone: false, subcontractorId: "s-brightline", crewId: "c-bright-a", startDate: "2026-10-20", endDate: "2026-10-27", status: "not_started", percentComplete: 0, equipment: ["Scissor lift"] },
  { id: "wp-320", projectId: "hpm", code: "26-320", name: "Temporary power — Levels 2–3", trade: "Electrical", zone: "Levels 2–3", exclusiveZone: false, subcontractorId: "s-brightline", crewId: "c-bright-a", startDate: "2026-10-22", endDate: "2026-10-23", status: "not_started", percentComplete: 0, equipment: [] },
  { id: "wp-330", projectId: "hpm", code: "21-330", name: "Fire sprinkler mains — Level 1", trade: "Fire sprinkler", zone: "Level 1 East", exclusiveZone: true, subcontractorId: "s-apex", crewId: "c-apex-1", startDate: "2026-10-20", endDate: "2026-10-23", status: "not_started", percentComplete: 0, equipment: ["Scissor lift"] },
  { id: "wp-400", projectId: "hpm", code: "08-400", name: "Curtain wall — north & east elevations", trade: "Curtain wall", zone: "North & east elevations", exclusiveZone: false, subcontractorId: "s-clearview", crewId: "c-clear-1", startDate: "2026-10-26", endDate: "2026-11-13", status: "not_started", percentComplete: 0, equipment: ["Glass vacuum lifter"] },
  { id: "wp-500", projectId: "hpm", code: "07-500", name: "Roofing — insulation & membrane", trade: "Roofing", zone: "Roof", exclusiveZone: false, subcontractorId: "s-ridgeline", crewId: "c-ridge-1", startDate: "2026-10-29", endDate: "2026-11-10", status: "not_started", percentComplete: 0, equipment: ["90T mobile crane"] },
  { id: "wp-600", projectId: "hpm", code: "09-600", name: "Level 2 framing & MEP rough-in", trade: "Multi-trade", zone: "Level 2", exclusiveZone: false, subcontractorId: "s-delta", crewId: "c-delta-1", startDate: "2026-11-02", endDate: "2026-11-20", status: "not_started", percentComplete: 0, equipment: [] },

  // ---- Northgate Logistics Center ----
  { id: "wp-n10", projectId: "nlc", code: "22-010", name: "Office restroom plumbing", trade: "Plumbing", zone: "Office core", exclusiveZone: false, subcontractorId: "s-delta", crewId: "c-delta-2", startDate: "2026-10-14", endDate: "2026-10-23", status: "in_progress", percentComplete: 60, equipment: [] },
  { id: "wp-n20", projectId: "nlc", code: "26-020", name: "Office electrical rough-in", trade: "Electrical", zone: "Office area", exclusiveZone: false, subcontractorId: "s-brightline", crewId: "c-bright-b", startDate: "2026-10-26", endDate: "2026-10-30", status: "not_started", percentComplete: 0, equipment: [] },
  { id: "wp-n30", projectId: "nlc", code: "21-030", name: "Sprinkler drops & heads — office", trade: "Fire sprinkler", zone: "Office area", exclusiveZone: false, subcontractorId: "s-apex", crewId: "c-apex-1", startDate: "2026-11-02", endDate: "2026-11-06", status: "not_started", percentComplete: 0, equipment: [] },

  // ---- Cedar Row Townhomes ----
  { id: "wp-c10", projectId: "crt", code: "33-010", name: "Site utilities — sanitary & storm", trade: "Civil / concrete", zone: "Site", exclusiveZone: false, subcontractorId: "s-summit", crewId: "c-summit-2", startDate: "2026-11-02", endDate: "2026-11-20", status: "not_started", percentComplete: 0, equipment: ["Excavator"] },
  { id: "wp-c20", projectId: "crt", code: "03-020", name: "Building A foundations", trade: "Concrete", zone: "Building A", exclusiveZone: false, subcontractorId: "s-summit", crewId: "c-summit-2", startDate: "2026-11-23", endDate: "2026-12-11", status: "not_started", percentComplete: 0, equipment: [] },
];

export const dependencies: Dependency[] = [
  { id: "d-1", projectId: "hpm", predecessorId: "wp-100", successorId: "wp-110", lagDays: 0 },
  { id: "d-2", projectId: "hpm", predecessorId: "wp-110", successorId: "wp-120", lagDays: 0 },
  { id: "d-3", projectId: "hpm", predecessorId: "wp-110", successorId: "wp-200", lagDays: 0, note: "Deck pour requires accepted L1–L2 steel" },
  { id: "d-4", projectId: "hpm", predecessorId: "wp-100", successorId: "wp-300", lagDays: 0 },
  { id: "d-5", projectId: "hpm", predecessorId: "wp-100", successorId: "wp-210", lagDays: 0 },
  { id: "d-6", projectId: "hpm", predecessorId: "wp-120", successorId: "wp-400", lagDays: 2, note: "Survey of embed plates after topping out" },
  { id: "d-7", projectId: "hpm", predecessorId: "wp-120", successorId: "wp-500", lagDays: 3, note: "Roof deck acceptance" },
  { id: "d-8", projectId: "hpm", predecessorId: "wp-200", successorId: "wp-600", lagDays: 3, note: "Slab cure before loading" },
  { id: "d-9", projectId: "nlc", predecessorId: "wp-n10", successorId: "wp-n20", lagDays: 0 },
  { id: "d-10", projectId: "nlc", predecessorId: "wp-n20", successorId: "wp-n30", lagDays: 0 },
  { id: "d-11", projectId: "crt", predecessorId: "wp-c10", successorId: "wp-c20", lagDays: 0 },
];

const v = (by: string, at: string) => ({ verifiedById: by, verifiedAt: at });

export const checklist: ChecklistItem[] = [
  // Foundations / steel (complete & approved)
  { id: "ck-100-1", workPackageId: "wp-100", label: "Footing excavation inspected by geotechnical engineer", category: "prerequisite", required: true, status: "verified", responsibleParty: "Keystone Testing & Inspection", ...v("p-priya", "2026-09-07T15:30:00Z"), evidenceIds: [] },
  { id: "ck-110-1", workPackageId: "wp-110", label: "Anchor bolt survey accepted", category: "prerequisite", required: true, status: "verified", responsibleParty: "Northline survey", ...v("p-priya", "2026-09-25T20:00:00Z"), evidenceIds: [] },
  { id: "ck-110-2", workPackageId: "wp-110", label: "Crane lift plan & outrigger pad review", category: "safety", required: true, status: "verified", responsibleParty: "Ironclad Steel Erectors", ...v("p-owen", "2026-09-26T17:00:00Z"), evidenceIds: [] },
  { id: "ck-120-1", workPackageId: "wp-120", label: "Crane lift plan updated for upper levels", category: "safety", required: true, status: "verified", responsibleParty: "Ironclad Steel Erectors", ...v("p-owen", "2026-10-09T18:00:00Z"), evidenceIds: [] },
  { id: "ck-120-2", workPackageId: "wp-120", label: "Perimeter cable & fall-protection anchors installed L3", category: "safety", required: true, status: "verified", responsibleParty: "Ironclad Steel Erectors", ...v("p-owen", "2026-10-09T18:30:00Z"), evidenceIds: ["ev-3"] },

  // L2 slab-on-deck pour — the demonstration package
  { id: "ck-200-1", workPackageId: "wp-200", label: "Special inspection of L2 steel connections (bolting & welds) — report received", category: "prerequisite", required: true, status: "pending", responsibleParty: "Keystone Testing & Inspection", dueBy: "2026-10-21", evidenceIds: [], notes: "Inspection requested Oct 15. Keystone has not issued the field report.", linkedWorkPackageId: "wp-110" },
  { id: "ck-200-2", workPackageId: "wp-200", label: "Metal deck attachment & side-lap fasteners inspected", category: "quality", required: true, status: "verified", responsibleParty: "Northline project engineer", ...v("p-priya", "2026-10-16T21:10:00Z"), evidenceIds: ["ev-1"] },
  { id: "ck-200-3", workPackageId: "wp-200", label: "Embeds, sleeves & deck penetrations signed off by MEP trades", category: "prerequisite", required: true, status: "verified", responsibleParty: "Delta / Brightline / Apex", ...v("p-priya", "2026-10-16T22:00:00Z"), evidenceIds: ["ev-2"] },
  { id: "ck-200-4", workPackageId: "wp-200", label: "Welded wire reinforcement placement inspected", category: "quality", required: true, status: "verified", responsibleParty: "Keystone Testing & Inspection", ...v("p-priya", "2026-10-17T19:00:00Z"), evidenceIds: [] },
  { id: "ck-200-5", workPackageId: "wp-200", label: "Mix design, pump & truck schedule confirmed with supplier", category: "logistics", required: true, status: "verified", responsibleParty: "Summit Concrete Co.", ...v("p-luis", "2026-10-16T16:00:00Z"), evidenceIds: [] },
  { id: "ck-200-6", workPackageId: "wp-200", label: "Leading-edge & perimeter fall protection in place on L2", category: "safety", required: true, status: "verified", responsibleParty: "Northline safety", ...v("p-owen", "2026-10-17T17:30:00Z"), evidenceIds: ["ev-4"] },
  { id: "ck-200-7", workPackageId: "wp-200", label: "Pour-day weather forecast reviewed", category: "logistics", required: false, status: "verified", responsibleParty: "Northline superintendent", ...v("p-dana", "2026-10-18T15:00:00Z"), evidenceIds: [], notes: "Dry through Oct 23 (10% precip)." },

  // Loading dock slab (verified, awaiting approval — a resequencing candidate)
  { id: "ck-210-1", workPackageId: "wp-210", label: "Subgrade compaction test passed", category: "prerequisite", required: true, status: "verified", responsibleParty: "Keystone Testing & Inspection", ...v("p-priya", "2026-10-14T20:00:00Z"), evidenceIds: ["ev-6"] },
  { id: "ck-210-2", workPackageId: "wp-210", label: "Under-slab vapor barrier & dowels inspected", category: "quality", required: true, status: "verified", responsibleParty: "Northline project engineer", ...v("p-priya", "2026-10-15T20:00:00Z"), evidenceIds: [] },
  { id: "ck-210-3", workPackageId: "wp-210", label: "Truck access route & washout location set", category: "logistics", required: true, status: "verified", responsibleParty: "Summit Concrete Co.", ...v("p-luis", "2026-10-15T21:00:00Z"), evidenceIds: [] },

  // Plumbing (in progress, approved)
  { id: "ck-300-1", workPackageId: "wp-300", label: "Underground plumbing permit inspection scheduled", category: "permit", required: true, status: "verified", responsibleParty: "Delta Mechanical & Plumbing", ...v("p-priya", "2026-10-12T17:00:00Z"), evidenceIds: [] },
  // Electrical
  { id: "ck-310-1", workPackageId: "wp-310", label: "Level 1 West turned over by plumbing", category: "prerequisite", required: true, status: "verified", responsibleParty: "Delta Mechanical & Plumbing", ...v("p-dana", "2026-10-16T23:00:00Z"), evidenceIds: [] },
  { id: "ck-310-2", workPackageId: "wp-310", label: "Electrical drawings Rev C on site", category: "quality", required: true, status: "verified", responsibleParty: "Brightline Electric", ...v("p-priya", "2026-10-16T23:10:00Z"), evidenceIds: [] },
  { id: "ck-310-3", workPackageId: "wp-310", label: "Scissor lift annual inspection current", category: "safety", required: true, status: "verified", responsibleParty: "Brightline Electric", ...v("p-owen", "2026-10-17T16:00:00Z"), evidenceIds: [] },
  { id: "ck-320-1", workPackageId: "wp-320", label: "Temporary power plan approved", category: "permit", required: true, status: "verified", responsibleParty: "Brightline Electric", ...v("p-priya", "2026-10-15T18:00:00Z"), evidenceIds: [] },
  { id: "ck-320-2", workPackageId: "wp-320", label: "Lockout/tagout briefing completed", category: "safety", required: true, status: "verified", responsibleParty: "Brightline Electric", ...v("p-owen", "2026-10-16T15:00:00Z"), evidenceIds: [] },
  // Sprinkler
  { id: "ck-330-1", workPackageId: "wp-330", label: "Hydraulic calcs approved by fire marshal", category: "permit", required: true, status: "verified", responsibleParty: "Apex Fire Protection", ...v("p-priya", "2026-10-10T18:00:00Z"), evidenceIds: [] },
  { id: "ck-330-2", workPackageId: "wp-330", label: "Hanger layout clash-checked against plumbing", category: "prerequisite", required: true, status: "verified", responsibleParty: "Apex Fire Protection", ...v("p-priya", "2026-10-15T18:00:00Z"), evidenceIds: [] },
  { id: "ck-330-3", workPackageId: "wp-330", label: "Hot work permit", category: "safety", required: false, status: "not_applicable", responsibleParty: "Apex Fire Protection", evidenceIds: [], notes: "Grooved / threaded pipe — no hot work." },
  // Curtain wall
  { id: "ck-400-1", workPackageId: "wp-400", label: "Curtain wall shop drawings approved", category: "prerequisite", required: true, status: "verified", responsibleParty: "Clearview Glazing", ...v("p-priya", "2026-10-02T18:00:00Z"), evidenceIds: [] },
  { id: "ck-400-2", workPackageId: "wp-400", label: "Embed plates surveyed — north & east", category: "prerequisite", required: true, status: "pending", responsibleParty: "Northline survey", dueBy: "2026-10-24", evidenceIds: [], linkedWorkPackageId: "wp-120" },
  { id: "ck-400-3", workPackageId: "wp-400", label: "Glass delivery confirmed", category: "logistics", required: true, status: "pending", responsibleParty: "Clearview Glazing", dueBy: "2026-10-23", evidenceIds: [] },
  // Roofing
  { id: "ck-500-1", workPackageId: "wp-500", label: "Roof deck accepted from steel erector", category: "prerequisite", required: true, status: "pending", responsibleParty: "Ironclad Steel Erectors", dueBy: "2026-10-27", evidenceIds: [], linkedWorkPackageId: "wp-120" },
  { id: "ck-500-2", workPackageId: "wp-500", label: "Material hoisting pick plan", category: "safety", required: true, status: "verified", responsibleParty: "Ridgeline Roofing", ...v("p-owen", "2026-10-16T19:00:00Z"), evidenceIds: [] },
  // L2 framing
  { id: "ck-600-1", workPackageId: "wp-600", label: "L2 slab cure & strength test (7-day)", category: "prerequisite", required: true, status: "pending", responsibleParty: "Keystone Testing & Inspection", dueBy: "2026-10-30", evidenceIds: [], linkedWorkPackageId: "wp-200" },

  // Northgate
  { id: "ck-n10-1", workPackageId: "wp-n10", label: "Rough plumbing permit", category: "permit", required: true, status: "verified", responsibleParty: "Delta Mechanical & Plumbing", ...v("p-jo", "2026-10-13T17:00:00Z"), evidenceIds: [] },
  { id: "ck-n20-1", workPackageId: "wp-n20", label: "Office walls framed & top track inspected", category: "prerequisite", required: true, status: "pending", responsibleParty: "Northline", dueBy: "2026-10-23", evidenceIds: [] },
  { id: "ck-n20-2", workPackageId: "wp-n20", label: "Electrical permit posted", category: "permit", required: true, status: "verified", responsibleParty: "Brightline Electric", ...v("p-jo", "2026-10-15T17:00:00Z"), evidenceIds: [] },
  { id: "ck-n30-1", workPackageId: "wp-n30", label: "Ceiling grid layout approved", category: "prerequisite", required: true, status: "pending", responsibleParty: "Northline", dueBy: "2026-10-30", evidenceIds: [] },
  // Cedar Row
  { id: "ck-c10-1", workPackageId: "wp-c10", label: "Grading permit issued", category: "permit", required: true, status: "pending", responsibleParty: "Cedar Row Living LLC", dueBy: "2026-10-28", evidenceIds: [] },
  { id: "ck-c10-2", workPackageId: "wp-c10", label: "Utility locate ticket active", category: "safety", required: true, status: "pending", responsibleParty: "Summit Concrete Co.", dueBy: "2026-10-29", evidenceIds: [] },
];

export const approvals: Approval[] = [
  { id: "ap-100", workPackageId: "wp-100", approvedById: "p-dana", approvedAt: "2026-09-07T16:00:00Z", verifiedItemIds: ["ck-100-1"] },
  { id: "ap-110", workPackageId: "wp-110", approvedById: "p-dana", approvedAt: "2026-09-27T15:00:00Z", verifiedItemIds: ["ck-110-1", "ck-110-2"] },
  { id: "ap-120", workPackageId: "wp-120", approvedById: "p-dana", approvedAt: "2026-10-10T15:00:00Z", verifiedItemIds: ["ck-120-1", "ck-120-2"], notes: "Released for erection L3–Roof." },
  { id: "ap-300", workPackageId: "wp-300", approvedById: "p-dana", approvedAt: "2026-10-12T15:30:00Z", verifiedItemIds: ["ck-300-1"] },
  { id: "ap-310", workPackageId: "wp-310", approvedById: "p-dana", approvedAt: "2026-10-17T23:30:00Z", verifiedItemIds: ["ck-310-1", "ck-310-2", "ck-310-3"] },
  { id: "ap-330", workPackageId: "wp-330", approvedById: "p-dana", approvedAt: "2026-10-16T23:40:00Z", verifiedItemIds: ["ck-330-1", "ck-330-2"] },
  { id: "ap-n10", workPackageId: "wp-n10", approvedById: "p-jo", approvedAt: "2026-10-13T18:00:00Z", verifiedItemIds: ["ck-n10-1"] },
];

export const evidence: Evidence[] = [
  { id: "ev-1", projectId: "hpm", workPackageId: "wp-200", type: "photo", title: "L2 deck side-lap fasteners — grid C/4", submittedById: "p-priya", submittedAt: "2026-10-16T21:05:00Z", s3Key: "hpm/wp-200/2026-10-16/deck-sidelap-c4.jpg", tags: ["deck", "quality"] },
  { id: "ev-2", projectId: "hpm", workPackageId: "wp-200", type: "checklist_result", title: "MEP embed sign-off sheet — Level 2", body: "Delta, Brightline and Apex initialed all 38 sleeve and embed locations. 2 sleeves relocated at grid B/2 per RFI-041.", submittedById: "p-priya", submittedAt: "2026-10-16T22:00:00Z", s3Key: "hpm/wp-200/2026-10-16/mep-embed-signoff.pdf", tags: ["embeds", "mep"] },
  { id: "ev-3", projectId: "hpm", workPackageId: "wp-120", type: "photo", title: "L3 perimeter cable installed — east side", submittedById: "p-owen", submittedAt: "2026-10-09T18:20:00Z", s3Key: "hpm/wp-120/2026-10-09/l3-perimeter-cable.jpg", tags: ["safety", "steel"] },
  { id: "ev-4", projectId: "hpm", workPackageId: "wp-200", type: "photo", title: "L2 leading-edge protection — north bay", submittedById: "p-owen", submittedAt: "2026-10-17T17:25:00Z", s3Key: "hpm/wp-200/2026-10-17/l2-edge-protection.jpg", tags: ["safety"] },
  { id: "ev-5", projectId: "hpm", workPackageId: "wp-120", type: "progress_note", title: "Steel L3–Roof daily progress", body: "Columns L3 set grids A–D. Roof beams started grid A. Erector reports bolt-up running ~2 days behind; one ironworker out Thu–Fri.", submittedById: "p-dana", submittedAt: "2026-10-16T23:45:00Z", tags: ["steel", "progress"] },
  { id: "ev-6", projectId: "hpm", workPackageId: "wp-210", type: "checklist_result", title: "Loading dock subgrade compaction — 96% Proctor", submittedById: "p-priya", submittedAt: "2026-10-14T20:00:00Z", s3Key: "hpm/wp-210/2026-10-14/compaction-report.pdf", tags: ["geotech"] },
  { id: "ev-7", projectId: "hpm", workPackageId: "wp-300", type: "photo", title: "L1 East underground — trench before backfill", submittedById: "p-priya", submittedAt: "2026-10-15T19:00:00Z", s3Key: "hpm/wp-300/2026-10-15/l1-east-trench.jpg", tags: ["plumbing"] },
  { id: "ev-8", projectId: "hpm", workPackageId: "wp-300", type: "progress_note", title: "Plumbing L1 East status", body: "Underground complete. Above-ground rough-in 70%. Delta needs L1 East through Oct 21 for vent stacks.", submittedById: "p-dana", submittedAt: "2026-10-16T23:50:00Z", tags: ["plumbing", "progress"] },
  { id: "ev-9", projectId: "hpm", workPackageId: "wp-200", type: "progress_note", title: "Special inspection follow-up", body: "Called Keystone 10/16. Inspector tentatively Oct 20 AM; written report not yet issued.", submittedById: "p-marcus", submittedAt: "2026-10-16T22:30:00Z", tags: ["inspection"] },
  { id: "ev-10", projectId: "hpm", workPackageId: "wp-120", type: "photo", title: "Roof beams grid A — crane pick", submittedById: "p-dana", submittedAt: "2026-10-17T20:10:00Z", s3Key: "hpm/wp-120/2026-10-17/roof-beams-a.jpg", tags: ["steel", "progress"] },
];
