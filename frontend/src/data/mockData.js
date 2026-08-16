// ---------------------------------------------------------------------------
// Mock data for the Keystone Real Estate AI Sales CRM (frontend-only)
// ---------------------------------------------------------------------------

export const STATUSES = [
  "NEW",
  "CONTACTED",
  "INTERESTED",
  "HIGHLY_INTERESTED",
  "QUALIFIED",
  "CONVERTED",
  "NOT_INTERESTED",
  "LOST",
];

export const STATUS_LABELS = {
  NEW: "New",
  CONTACTED: "Contacted",
  INTERESTED: "Interested",
  HIGHLY_INTERESTED: "Highly Interested",
  QUALIFIED: "Qualified",
  CONVERTED: "Converted",
  NOT_INTERESTED: "Not Interested",
  LOST: "Lost",
};

export const STATUS_COLOR_KEY = {
  NEW: "new",
  CONTACTED: "contacted",
  INTERESTED: "interested",
  HIGHLY_INTERESTED: "highly",
  QUALIFIED: "qualified",
  CONVERTED: "converted",
  NOT_INTERESTED: "notinterested",
  LOST: "lost",
};

export const SOURCES = [
  "Website",
  "WhatsApp",
  "Instagram",
  "Facebook",
  "Referral",
  "Advertisement",
  "AI Agent",
  "Manual",
];

export const ROLES = [
  "Sales Executive",
  "Senior Sales Executive",
  "Sales Manager",
  "Administrator",
];

// ---------------------------------------------------------------------------
// Salespeople
// ---------------------------------------------------------------------------
export const initialSalespeople = [
  {
    id: "sp-1",
    name: "Priya Nair",
    email: "priya.nair@keystonecrm.in",
    phone: "+91 98450 21837",
    role: "Senior Sales Executive",
    status: "Active",
    createdAt: "2024-11-02",
    avatarColor: "#B08D57",
  },
  {
    id: "sp-2",
    name: "Arjun Mehta",
    email: "arjun.mehta@keystonecrm.in",
    phone: "+91 99010 44521",
    role: "Sales Executive",
    status: "Active",
    createdAt: "2025-01-14",
    avatarColor: "#3D5079",
  },
  {
    id: "sp-3",
    name: "Kavya Reddy",
    email: "kavya.reddy@keystonecrm.in",
    phone: "+91 90080 11226",
    role: "Sales Manager",
    status: "Active",
    createdAt: "2024-06-20",
    avatarColor: "#0D9488",
  },
  {
    id: "sp-4",
    name: "Rohan Deshpande",
    email: "rohan.deshpande@keystonecrm.in",
    phone: "+91 88888 34129",
    role: "Sales Executive",
    status: "Active",
    createdAt: "2025-03-08",
    avatarColor: "#8B5CF6",
  },
  {
    id: "sp-5",
    name: "Ananya Iyer",
    email: "ananya.iyer@keystonecrm.in",
    phone: "+91 97400 65213",
    role: "Senior Sales Executive",
    status: "Inactive",
    createdAt: "2024-09-11",
    avatarColor: "#DC2626",
  },
  {
    id: "sp-6",
    name: "Vikram Shetty",
    email: "vikram.shetty@keystonecrm.in",
    phone: "+91 96860 77045",
    role: "Administrator",
    status: "Active",
    createdAt: "2024-04-01",
    avatarColor: "#2A3C60",
  },
];

// ---------------------------------------------------------------------------
// Properties
// ---------------------------------------------------------------------------
export const initialProperties = [
  {
    id: "pr-1",
    name: "Skyline Residency",
    type: "Apartment",
    location: "Whitefield, Bengaluru",
    price: "₹1.25 Cr",
    bhk: "3 BHK",
    area: "1,850 sq.ft.",
    amenities: ["Swimming Pool", "Gym", "Parking", "Security"],
    availability: "Ready to Move",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80",
  },
  {
    id: "pr-2",
    name: "Palm Meadows Villas",
    type: "Villa",
    location: "Sarjapur Road, Bengaluru",
    price: "₹2.4 Cr",
    bhk: "4 BHK",
    area: "3,200 sq.ft.",
    amenities: ["Private Garden", "Clubhouse", "Parking", "Power Backup"],
    availability: "Under Construction",
    image: "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&q=80",
  },
  {
    id: "pr-3",
    name: "Lakeview Heights",
    type: "Apartment",
    location: "Gachibowli, Hyderabad",
    price: "₹95 Lakh",
    bhk: "2 BHK",
    area: "1,240 sq.ft.",
    amenities: ["Lake View", "Gym", "Kids Play Area", "Security"],
    availability: "Ready to Move",
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
  },
  {
    id: "pr-4",
    name: "Orchid Business Bay",
    type: "Commercial",
    location: "Hinjewadi, Pune",
    price: "₹3.1 Cr",
    bhk: "Office Space",
    area: "4,500 sq.ft.",
    amenities: ["Cafeteria", "24x7 Access", "Parking", "Conference Rooms"],
    availability: "Ready to Move",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
  },
  {
    id: "pr-5",
    name: "Riverstone Enclave",
    type: "Apartment",
    location: "Baner, Pune",
    price: "₹1.6 Cr",
    bhk: "3 BHK",
    area: "1,980 sq.ft.",
    amenities: ["Riverside Deck", "Gym", "Swimming Pool", "Parking"],
    availability: "Under Construction",
    image: "https://images.unsplash.com/photo-1560184897-ae75f418493e?w=800&q=80",
  },
  {
    id: "pr-6",
    name: "Sea Pearl Residences",
    type: "Apartment",
    location: "Andheri West, Mumbai",
    price: "₹2.9 Cr",
    bhk: "3 BHK",
    area: "1,650 sq.ft.",
    amenities: ["Sea View", "Gym", "Concierge", "Parking"],
    availability: "Ready to Move",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
  },
  {
    id: "pr-7",
    name: "Emerald Greens Plots",
    type: "Plot",
    location: "Devanahalli, Bengaluru",
    price: "₹68 Lakh",
    bhk: "Residential Plot",
    area: "2,400 sq.ft.",
    amenities: ["Gated Layout", "Wide Roads", "Underground Cabling"],
    availability: "Ready to Move",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80",
  },
  {
    id: "pr-8",
    name: "Cedar Court Homes",
    type: "Apartment",
    location: "Kondapur, Hyderabad",
    price: "₹1.1 Cr",
    bhk: "3 BHK",
    area: "1,720 sq.ft.",
    amenities: ["Gym", "Parking", "Rainwater Harvesting", "Security"],
    availability: "Ready to Move",
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80",
  },
];

// ---------------------------------------------------------------------------
// Helpers to build leads
// ---------------------------------------------------------------------------
const leadNames = [
  "Rahul Sharma", "Sneha Kulkarni", "Aditya Rao", "Meera Pillai", "Karthik Iyer",
  "Divya Menon", "Sanjay Gupta", "Pooja Agarwal", "Nikhil Bhat", "Ritika Desai",
  "Vivek Nambiar", "Anjali Krishnan", "Suresh Patil", "Neha Kapoor", "Manish Choudhary",
  "Lakshmi Narayan", "Farhan Sheikh", "Ishita Bansal", "Gaurav Malhotra", "Swathi Reddy",
];

const cities = [
  { city: "Bengaluru", area: "Whitefield" },
  { city: "Bengaluru", area: "Sarjapur Road" },
  { city: "Bengaluru", area: "Indiranagar" },
  { city: "Hyderabad", area: "Gachibowli" },
  { city: "Hyderabad", area: "Kondapur" },
  { city: "Pune", area: "Baner" },
  { city: "Pune", area: "Hinjewadi" },
  { city: "Mumbai", area: "Andheri West" },
];

const bhkOptions = ["1 BHK", "2 BHK", "3 BHK", "4 BHK", "Villa", "Plot"];
const budgets = ["₹45 Lakh", "₹68 Lakh", "₹85 Lakh", "₹95 Lakh", "₹1.1 Cr", "₹1.25 Cr", "₹1.6 Cr", "₹2.4 Cr", "₹2.9 Cr", "₹3.1 Cr"];

function seedRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}
const rnd = seedRandom(42);
function pick(arr) { return arr[Math.floor(rnd() * arr.length)]; }

const leadStatusCycle = [
  "NEW", "NEW", "NEW", "CONTACTED", "CONTACTED", "INTERESTED", "INTERESTED",
  "HIGHLY_INTERESTED", "HIGHLY_INTERESTED", "HIGHLY_INTERESTED", "QUALIFIED",
  "QUALIFIED", "CONVERTED", "CONVERTED", "NOT_INTERESTED", "LOST",
  "NEW", "CONTACTED", "HIGHLY_INTERESTED", "QUALIFIED",
];

const assignPattern = ["sp-1", "sp-2", "sp-3", null, "sp-4", "sp-1", null, "sp-2", "sp-3", "sp-4", null, "sp-1", "sp-2", null, "sp-3", "sp-4", "sp-1", null, "sp-2", "sp-3"];

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export const initialLeads = leadNames.map((name, i) => {
  const loc = cities[i % cities.length];
  const status = leadStatusCycle[i];
  const first = name.split(" ")[0].toLowerCase();
  return {
    id: `lead-${i + 1}`,
    name,
    email: `${first}.${name.split(" ")[1].toLowerCase()}@gmail.com`,
    phone: `+91 9${(800000000 + i * 137931).toString().slice(0, 9)}`,
    propertyInterest: pick(["Apartment", "Villa", "Plot", "Commercial Space"]),
    location: `${loc.area}, ${loc.city}`,
    budget: budgets[i % budgets.length],
    bhk: bhkOptions[i % bhkOptions.length],
    area: `${1100 + i * 65} sq.ft.`,
    requirements: pick([
      "Prefers a corner unit with good ventilation and natural light.",
      "Looking for a gated community with strong security and amenities.",
      "Wants possession within the next 6 months.",
      "Interested in proximity to tech parks and schools.",
      "Open to resale or new construction, prioritizing budget.",
      "Needs vaastu-compliant layout with east-facing entrance.",
    ]),
    source: SOURCES[i % SOURCES.length],
    status,
    assignedTo: assignPattern[i],
    createdAt: daysAgo(30 - i),
    updatedAt: daysAgo(Math.max(0, 20 - i)),
    lastInteraction: daysAgo(Math.floor(rnd() * 10)),
    notes: [
      {
        id: `note-${i}-1`,
        author: "AI Agent",
        text: "Lead engaged with WhatsApp broadcast and requested more details on pricing.",
        createdAt: daysAgo(25 - i),
      },
    ],
    activity: [
      { id: `act-${i}-1`, type: "created", text: "Lead created", timestamp: daysAgo(30 - i) },
      { id: `act-${i}-2`, type: "message", text: "Message received via " + SOURCES[i % SOURCES.length], timestamp: daysAgo(28 - i) },
      { id: `act-${i}-3`, type: "status", text: `Status changed to ${STATUS_LABELS[status]}`, timestamp: daysAgo(20 - i) },
    ],
  };
});

// ensure at least a handful are HIGHLY_INTERESTED and unassigned for the attention panel
initialLeads[6].status = "HIGHLY_INTERESTED";
initialLeads[6].assignedTo = null;
initialLeads[11].status = "HIGHLY_INTERESTED";
initialLeads[11].assignedTo = null;

// ---------------------------------------------------------------------------
// Activity feed (global, recent-first)
// ---------------------------------------------------------------------------
export const initialActivity = [
  { id: "g-1", type: "status", text: "Rahul Sharma became Highly Interested", timestamp: daysAgo(0) , minutesAgo: 2},
  { id: "g-2", type: "lead", text: "New lead received from WhatsApp", timestamp: daysAgo(0), minutesAgo: 8 },
  { id: "g-3", type: "assign", text: "Priya assigned a lead to Arjun", timestamp: daysAgo(0), minutesAgo: 15 },
  { id: "g-4", type: "convert", text: "Lead converted successfully — Meera Pillai", timestamp: daysAgo(0), minutesAgo: 32 },
  { id: "g-5", type: "message", text: "AI Agent responded to Karthik Iyer on Instagram", timestamp: daysAgo(0), minutesAgo: 47 },
  { id: "g-6", type: "status", text: "Divya Menon marked as Qualified", timestamp: daysAgo(0), minutesAgo: 63 },
  { id: "g-7", type: "lead", text: "New lead received from Website", timestamp: daysAgo(1), minutesAgo: 130 },
  { id: "g-8", type: "assign", text: "Kavya assigned a lead to Rohan", timestamp: daysAgo(1), minutesAgo: 180 },
  { id: "g-9", type: "note", text: "Note added on Sanjay Gupta's profile", timestamp: daysAgo(1), minutesAgo: 220 },
  { id: "g-10", type: "status", text: "Pooja Agarwal became Highly Interested", timestamp: daysAgo(1), minutesAgo: 260 },
  { id: "g-11", type: "lost", text: "Lead marked as Lost — Nikhil Bhat", timestamp: daysAgo(2), minutesAgo: 320 },
  { id: "g-12", type: "convert", text: "Lead converted successfully — Ritika Desai", timestamp: daysAgo(2), minutesAgo: 400 },
  { id: "g-13", type: "message", text: "AI Agent qualified a new lead from Facebook Ads", timestamp: daysAgo(2), minutesAgo: 480 },
  { id: "g-14", type: "assign", text: "Vikram assigned a lead to Priya", timestamp: daysAgo(3), minutesAgo: 600 },
  { id: "g-15", type: "status", text: "Anjali Krishnan moved to Contacted", timestamp: daysAgo(3), minutesAgo: 700 },
  { id: "g-16", type: "lead", text: "New lead received from Referral", timestamp: daysAgo(3), minutesAgo: 780 },
  { id: "g-17", type: "note", text: "Note added on Suresh Patil's profile", timestamp: daysAgo(4), minutesAgo: 900 },
  { id: "g-18", type: "status", text: "Neha Kapoor became Highly Interested", timestamp: daysAgo(4), minutesAgo: 980 },
  { id: "g-19", type: "assign", text: "Arjun assigned a lead to himself", timestamp: daysAgo(5), minutesAgo: 1100 },
  { id: "g-20", type: "convert", text: "Lead converted successfully — Farhan Sheikh", timestamp: daysAgo(5), minutesAgo: 1200 },
  { id: "g-21", type: "message", text: "AI Agent sent property recommendations to Ishita Bansal", timestamp: daysAgo(6), minutesAgo: 1350 },
  { id: "g-22", type: "status", text: "Gaurav Malhotra marked as Qualified", timestamp: daysAgo(6), minutesAgo: 1420 },
];

// ---------------------------------------------------------------------------
// Chat conversations
// ---------------------------------------------------------------------------
export const initialConversations = [
  {
    id: "conv-1",
    leadId: "lead-1",
    unread: 2,
    messages: [
      { id: "m1", sender: "lead", text: "Hi, I'm looking for a 3 BHK in Whitefield under 1.5 crore.", timestamp: daysAgo(0) },
      { id: "m2", sender: "ai", text: "I found a few 3 BHK options in Whitefield that match your requirements. Would you like me to show you the best matches?", timestamp: daysAgo(0) },
      { id: "m3", sender: "lead", text: "Yes please, and let me know about possession timelines.", timestamp: daysAgo(0) },
    ],
  },
  {
    id: "conv-2",
    leadId: "lead-7",
    unread: 1,
    messages: [
      { id: "m1", sender: "lead", text: "Do you have any villas near Sarjapur Road?", timestamp: daysAgo(0) },
      { id: "m2", sender: "ai", text: "Yes! Palm Meadows Villas is a gated community on Sarjapur Road with 4 BHK units starting at ₹2.4 Cr. Should I share the brochure?", timestamp: daysAgo(0) },
    ],
  },
  {
    id: "conv-3",
    leadId: "lead-3",
    unread: 0,
    messages: [
      { id: "m1", sender: "lead", text: "What's the price for a 2 BHK in Gachibowli?", timestamp: daysAgo(1) },
      { id: "m2", sender: "ai", text: "Lakeview Heights in Gachibowli offers 2 BHK units at ₹95 Lakh with a lake view and premium amenities.", timestamp: daysAgo(1) },
      { id: "m3", sender: "lead", text: "Sounds good, can someone call me tomorrow?", timestamp: daysAgo(1) },
      { id: "m4", sender: "ai", text: "Absolutely, I've notified your assigned executive to call you tomorrow morning.", timestamp: daysAgo(1) },
    ],
  },
  {
    id: "conv-4",
    leadId: "lead-4",
    unread: 0,
    messages: [
      { id: "m1", sender: "lead", text: "I need office space around Hinjewadi, Pune.", timestamp: daysAgo(1) },
      { id: "m2", sender: "ai", text: "Orchid Business Bay in Hinjewadi has 4,500 sq.ft. office spaces ready to move in, priced at ₹3.1 Cr.", timestamp: daysAgo(1) },
    ],
  },
  {
    id: "conv-5",
    leadId: "lead-12",
    unread: 3,
    messages: [
      { id: "m1", sender: "lead", text: "Any plots available near Devanahalli?", timestamp: daysAgo(0) },
      { id: "m2", sender: "ai", text: "Yes, Emerald Greens Plots offers 2,400 sq.ft. residential plots in a gated layout near Devanahalli, starting at ₹68 Lakh.", timestamp: daysAgo(0) },
      { id: "m3", sender: "lead", text: "Can I visit this weekend?", timestamp: daysAgo(0) },
    ],
  },
  {
    id: "conv-6",
    leadId: "lead-6",
    unread: 0,
    messages: [
      { id: "m1", sender: "lead", text: "Is Riverstone Enclave ready to move in?", timestamp: daysAgo(2) },
      { id: "m2", sender: "ai", text: "Riverstone Enclave is currently under construction with possession expected in the next 8 months.", timestamp: daysAgo(2) },
    ],
  },
  {
    id: "conv-7",
    leadId: "lead-9",
    unread: 0,
    messages: [
      { id: "m1", sender: "lead", text: "Looking for a sea-facing apartment in Mumbai.", timestamp: daysAgo(3) },
      { id: "m2", sender: "ai", text: "Sea Pearl Residences in Andheri West offers sea-view 3 BHK units at ₹2.9 Cr with concierge service.", timestamp: daysAgo(3) },
      { id: "m3", sender: "lead", text: "That's a bit over my budget, anything cheaper?", timestamp: daysAgo(3) },
    ],
  },
  {
    id: "conv-8",
    leadId: "lead-16",
    unread: 0,
    messages: [
      { id: "m1", sender: "lead", text: "What amenities does Cedar Court Homes have?", timestamp: daysAgo(4) },
      { id: "m2", sender: "ai", text: "Cedar Court Homes in Kondapur includes a gym, dedicated parking, rainwater harvesting, and round-the-clock security.", timestamp: daysAgo(4) },
    ],
  },
];

export const aiReplyBank = [
  "Thanks for sharing that — let me check the latest availability and get back to you with matching options.",
  "Great question! I'll pull up the details and share pricing, floor plans, and possession timelines shortly.",
  "I can schedule a site visit for you. What day works best this week?",
  "Noted. I've flagged this to your assigned sales executive for a follow-up call.",
  "Here are a couple of similar properties within your budget that you might like as well.",
  "I've updated your requirements. Would you like brochures sent to your email or WhatsApp?",
];
