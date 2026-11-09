// Images live in /public/projects so a missing file degrades to the panel
// behind it instead of breaking the build. The site serves the resized copies
// in optimized/; the full-resolution originals sit alongside them untouched.
const img = (file) => `${process.env.PUBLIC_URL}/projects/optimized/${file}`;

export const profile = {
  name: "Hamish Marshall Dawson",
  role: "AI & Software Engineer",
  age: 22,
  degree: "MEng Software Engineering · Final year",
  institution: "Heriot-Watt University",
  location: "Edinburgh, UK",
  // Edinburgh city centre, printed on the hero's side rail.
  coords: "55.9533°N 3.1883°W",
  research: "AI trust × input latency",
  researchContext: "Teleoperated robotics",
  researchNote: "Accepted for publication at British HCI 2026.",
  bio: "Final-year MEng student at Heriot-Watt, currently building AI pipelines at STMicroelectronics. A bit of robotics, perception, and getting a bunch of models to run on hardware that shouldn't fit them.",
  email: "hamishmarshalldawson@gmail.com",
  githubUser: "Hamish-MarshallDawson",
  github: "https://github.com/Hamish-MarshallDawson",
  linkedin: "https://www.linkedin.com/in/hamish-marshall-dawson/",
  // The hero portrait. The camera original is /public/image_2a10f9.jpg; the
  // site serves a 1600px copy from /public/optimized/ (30 MB → ~240 KB).
  // If the file is missing the hero draws a generated wireframe instead.
  coreImage: `${process.env.PUBLIC_URL}/optimized/image_2a10f9.jpg`,
  coreAlt: "Hamish in a rust corduroy jacket, sitting on the steps under the National Robotarium sign",
  // Point this at a PDF in /public (e.g. `${process.env.PUBLIC_URL}/cv.pdf`)
  // to make the CV controls download it. While it's null they open the Red
  // Wall with a CV request instead, so there is never a dead link.
  cv: null,
};

// Categories filter the vault; each is also a route (#vault/robotics). They
// swap the plate under the grid; the grid itself is the same for all of them.
// `name` is the short form used on cards and phones, `label` the full one.
export const categories = [
  {
    id: "research",
    name: "Research",
    label: "Research & papers",
    blurb: "High-level AI research, academic write-ups and the studies behind them.",
  },
  {
    id: "robotics",
    name: "Robotics",
    label: "Robotics & hardware",
    blurb: "Teleoperated systems, manipulators and the hardware they run on.",
  },
  {
    id: "performance",
    name: "Performance",
    label: "Performance & latency",
    blurb: "Latency research, and making things run fast on small hardware.",
  },
  {
    id: "ml",
    name: "ML & web",
    label: "ML pipelines & web",
    blurb: "Model pipelines, local agents and the web systems wired around them.",
  },
];

// Order is deliberate: Poseidon leads, then the dissertation and the HRI study,
// then current builds, then coursework. The first category listed is the
// project's primary. `fit: "contain"` is for logos/illustrations that shouldn't
// be cropped; `focus` is an object-position so crops keep the subject in frame.
// A project with a `schematic` instead of an `image` gets a drawn diagram as its plate.
export const vaultProjects = [
  {
    id: "poseidon",
    repo: "Poseidon",
    name: "Poseidon",
    category: "HackTheBurgh · Team lead · Nov 2026",
    description:
      "Live ship tracking that flags ships going quiet while other ships in the same area keep reporting. It merges AISStream's worldwide feed with Digitraffic's Finnish one, so a ship heard twice is stored once, and gives an analyst a short list of candidates, a risk order for each ship with its reasons, a replay and a shared team workspace. A flag is a prompt to review, not an accusation. A route model trained on Danish Maritime Authority AIS estimates up to 24 hours ahead with 80% and 95% circles, and the go-dark ranking is weak and labelled so. Built at HackTheBurgh by four people, each directing a coding agent in one repository; I was team lead.",
    url: "https://github.com/Hamish-MarshallDawson/Poseidon",
    tags: ["React", "MapLibre", "Python", "TimescaleDB", "LightGBM", "Coding agents"],
    categories: ["ml"],
    featured: {
      pitch: "Watches live ship tracking and flags ships that go quiet while others in the same area keep reporting. A flag is a prompt to review, not an accusation.",
      facts: [
        "Team lead of four, each directing a coding agent in one repo",
        "One evening replayed: 2,326 gaps, 654 candidates, 1,097 coverage gaps",
        "Go-dark ranking is weak and labelled so: AUC 0.59 at 1 h, 0.63 at 6 h",
      ],
      demo: "poseidon",
    },
    image: img("poseidon.jpg"),
    alt: "The Poseidon logo beside a tilted dark map of shipping around Denmark and the Baltic",
  },
  {
    id: "dissertation",
    repo: "Language-Commands-for-a-Robotic-arm-using-Object-Recognition-",
    name: "Language based control for Robotic Arm Object Swapping",
    category: "Dissertation · 89/100",
    description:
      "A robotic arm that takes a spoken instruction and carries it out, multi-step commands included. OpenCV handles perception, a visual-action model drives manipulation, and an LLM with speech recognition sits on top. The whole pipeline runs locally, under 4GB of VRAM.",
    tags: ["VLA", "LLM", "ASR", "OpenCV", "Model training"],
    categories: ["research", "robotics", "ml"],
    image: img("dissertation.png"),
    alt: "Overhead camera view of the arm's workspace, each detected object boxed and labelled with its target coordinates",
  },
  {
    id: "hri",
    name: "Trust in Teleoperation Robotics Study",
    category: "HRI research · British HCI 2026",
    description:
      "Research internship on how input latency changes an operator's trust in a teleoperated robot. I designed and ran a 12-participant study, built the Linux and ROS simulation environment used to test a TIAGo dual-arm robot under controlled delay, and presented at the EPSRC Executive Showcase. The paper has been accepted at British HCI 2026 and the work secured continuation funding.",
    tags: ["ROS1/2", "User study", "Experimental design", "Publication"],
    categories: ["robotics", "research", "performance"],
    image: img("hri.jpg"),
    alt: "A TIAGo robot swinging its arm over a taped-out table with Lego towers",
  },
  {
    id: "localmind",
    repo: "LocalMind",
    name: "LocalMind",
    category: "Personal · 2026 – ongoing",
    description:
      "A private vision-language assistant that lives on my own PC and answers from my phone. An always-on gateway on my Tailscale network wakes the GPU workstation with Wake-on-LAN when I message it, then lets it switch itself off again. It's a tool-using agent: RAG over my own documents, web search, voice in and out, and it can tailor a LaTeX CV to a job advert and compile it. Models, documents and chats stay on the machine.",
    url: "https://github.com/Hamish-MarshallDawson/LocalMind",
    tags: ["VLM", "Tool-using agent", "RAG", "Voice", "Tailscale", "Wake-on-LAN"],
    categories: ["ml", "performance"],
    featured: {
      pitch: "A private assistant on my own PC that I can message from my phone. It wakes the GPU when I need it, searches my own documents and tailors a LaTeX CV to a job advert.",
      facts: [
        "Qwen3-VL 8B on a 16 GB GPU, with context sized from free VRAM",
        "Knowledge base sections: shared CV material, private employer folders",
        "The PC switches itself off after ten idle minutes",
      ],
      demo: "localmind",
    },
    image: img("localmind.svg"),
    alt: "LocalMind mark: an LM monogram on a square plate",
    fit: "contain",
  },
  {
    id: "tensoroom",
    repo: "TensorRoom",
    name: "TensoRoom",
    category: "Collaborative · 2026 – ongoing",
    description:
      "Redesign a real room by describing it. Diffusion, segmentation, and language models wired into one pipeline that edits the space you point it at, in real time.",
    url: "https://github.com/Hamish-MarshallDawson/TensorRoom",
    tags: [
      "Local models",
      "Segmentation",
      "RAG",
      "LLM",
      "Image diffusion",
      "LoRA",
    ],
    categories: ["ml"],
    featured: {
      pitch: "Photograph a room, name the pieces you want to change and see them redrawn, with everything else left exactly as it was. It all runs on a local GPU.",
      facts: [
        "Words in the request are matched to objects in the photo, each with a precise mask",
        "Anyone shown in a photo is refused before anything is stored",
        "Built to be used from a phone on the same Wi-Fi network",
      ],
      demo: "tensoroom",
    },
    image: img("tensoroom.png"),
    alt: "TensoRoom logo, a wireframe cube",
    fit: "contain",
  },
  {
    id: "gyminit",
    name: "Gyminit",
    category: "Personal · 2026",
    description:
      "A free, ad-free gym tracker I built for a small group of friends. It installs on a phone like an app and logs strength and cardio quickly, even with no signal. Your data lives on the phone; signing in with an emailed code adds an optional cloud backup. It was also a practice in multi-agent orchestration: a team of AI coding agents built it.",
    url: "https://gyminit.hamishmdawson.workers.dev",
    tags: ["React", "TypeScript", "PWA", "Offline-first", "Supabase", "Cloudflare Workers"],
    categories: ["performance"],
    featured: {
      pitch: "A free, ad-free gym tracker for my friends that installs on a phone and logs a workout even with no signal. Signed out, nothing leaves the device.",
      facts: [
        "Data lives on the phone; sign in with an emailed code to back it up",
        "A practice in multi-agent orchestration for a traditional serverless web app",
        "260+ unit tests, plus end-to-end checks at phone sizes",
      ],
      demo: "gyminit",
    },
    image: img("gyminit.png"),
    alt: "Gyminit app icon",
    fit: "contain",
  },
  {
    id: "code-for-good",
    name: "50+ Network impact platform",
    category: "Code for Good · JPMorganChase · Oct 2026",
    description:
      "A feedback and impact platform for the West Lothian 50+ Network, built in under 24 hours from brief to demo. Our team of five had never met before the hackathon, and I was lead front-end developer. We built it to the charity's own brief.",
    url: "https://github.com/glasgow26/Team-2",
    charity: { name: "West Lothian 50+ Network", url: "https://westlothian50plusnetwork.co.uk/" },
    tags: ["Next.js 16", "React 19", "TypeScript", "PostgreSQL + Drizzle", "OpenRouter AI"],
    categories: ["ml"],
    featured: {
      pitch: "A feedback and impact platform for a charity that supports people aged 50 and over. Members answer a short survey online, on paper or in a recorded conversation.",
      facts: [
        "Built in under 24 hours, brief to demo",
        "Lead front-end developer in a team of five strangers",
        "Built for West Lothian 50+ Network, to the charity's own brief",
      ],
      demo: "codeforgood",
    },
    image: img("codeforgood.jpg"),
    alt: "West Lothian 50+ Network logo",
    fit: "contain",
  },
  {
    id: "bus",
    repo: "Lothian-Api-Bus-Display",
    name: "Lothian Bus Display",
    category: "Open source · C++ · Completed 2026",
    description:
      "A bus board for Edinburgh: live Lothian departures on a 3.5-inch touchscreen, from a Raspberry Pi 5 running C++17. I replaced the vendor's paint library with my own graphics layer: a canvas over an RGB565 frame buffer, anti-aliased text from fonts baked at build time, rounded shapes and alpha blending. Departures, timetables and live bus positions come from the Lothian open data API. Tap a departure to follow the bus on an OpenStreetMap map, with its lateness worked out from where it is against the timetable. A snapshot mode renders any screen to PNG from test data, so the screens were built and tested without the hardware.",
    url: "https://github.com/Hamish-MarshallDawson/Lothian-Api-Bus-Display",
    tags: ["C++17", "Raspberry Pi 5", "SPI display", "Novus API", "OpenStreetMap", "Embedded"],
    categories: ["performance", "robotics"],
    featured: {
      pitch: "Live Edinburgh bus times on a 3.5-inch touchscreen, run by my own C++ on a Raspberry Pi 5. Tap a bus to follow it on a map, or tap a route to hide it.",
      facts: [
        "C++17 with my own graphics layer: anti-aliased text and fonts baked at build time",
        "Into or out of city, worked out from the operator's own timetables",
        "Researched and chose the Pi 5 and 3.5\" touch LCD myself, then wrote C++ to fit them",
      ],
      demo: "bus",
    },
    // A snapshot-mode render from city-centre test data, not a photo: the old photo showed a stop near home.
    // The served copy is that 320x480 screen at 1:1 in a black bezel on a 1280x720 white plate, so a
    // cover crop keeps the device whole in both the 16:9 and 4:3 boxes (source in assets-src/projects).
    image: img("bus-board.png"),
    alt: "The bus board: live departures from Princes Street, into city",
  },
  {
    id: "iteration-inc",
    repo: "iteration-inc",
    name: "Iteration Inc",
    category: "Team lead · 2024–2025",
    description:
      "A deployed serverless smart care-home platform. I led a team of 8 engineers through build and release, and owned authentication, device settings and the energy-saving recommendations, with accessible design for older users as the priority. Marked at 76%.",
    url: "https://iteration-inc.vercel.app/",
    tags: ["Serverless", "Authentication", "Accessibility", "Full-stack"],
    categories: ["ml"],
    image: img("iterationinc.png"),
    alt: "Iteration Inc sign-in screen with the platform's logo",
  },
  {
    id: "minecraft-agent",
    name: "Minecraft Companion Agent",
    category: "Conversational agents coursework",
    description:
      "A group-built in-game helper for Minecraft that runs entirely on the local machine. It watches what the player is doing, answers questions, and warns them about danger before it reaches them — no cloud calls anywhere in the loop. My part was the low-latency text-to-speech that lets it talk back in real time.",
    url: "https://github.com/CordlessGnu/F21caGames2",
    tags: ["LLM", "VLM", "Whisper", "Local models", "TTS"],
    categories: ["ml", "performance"],
    image: img("minecraft.png"),
    alt: "Minecraft grass block",
    fit: "contain",
  },
  {
    id: "bonin-loot",
    name: "Bonin' Loot",
    category: "Games programming coursework",
    description:
      "A game built in C# and Unity for the Games Programming coursework: fully random levels, hundreds of item combinations and three boss fights. Published on itch.io and playable in the browser.",
    url: "https://hamishmad.itch.io/bonin-loot",
    tags: ["C#", "Unity", "Procedural generation"],
    categories: ["performance"],
    image: img("BoninLoot.png"),
    alt: "Bonin' Loot title art: a crowned skeleton on a treasure chest surrounded by coins and gold",
  },
];

// `starts`/`ends` (YYYY-MM) let the site work out whether a role is still
// active and how far through it is, so the hero's "current post" readout and
// the contract progress bar don't need editing as time passes.
export const experience = [
  {
    role: "AI and Machine Learning Engineer Intern",
    org: "STMicroelectronics",
    mark: "st.svg",
    period: "May 2026 – December 2026",
    starts: "2026-05",
    ends: "2026-12",
    location: "Edinburgh",
    points: [
      "Delivered a vision-language-model fault detection pipeline that reached 98% accuracy across 25 fault classes, up from 23% at the start of the placement — turning current research into a working agentic system that names unseen faults and routes known ones into existing classifications.",
      "Made a previously unmeasurable AI pipeline testable, with every result reproducible, by building fixed train/test splits and Bayesian-optimised parameter selection into the evaluation before tuning the model.",
      "Took GitHub Copilot beyond the software teams — 8 senior engineers from other disciplines adopted it — by co-delivering a session on its strengths, failure cases and the AGENTS.md and SKILLS.md conventions.",
      "Explained LoRA, context windows, VRAM limits, quantisation and RAG in practical terms so non-specialist colleagues could make informed decisions on generative AI, which led to invitations to run wider team reviews.",
    ],
  },
  {
    role: "Research Intern — Human-Robot Interaction",
    org: "Heriot-Watt University",
    mark: "robotarium.png",
    period: "Summer 2025",
    location: "Trust in Teleoperation Robotics",
    points: [
      "Designed and ran a 12-participant study on how input latency affects trust in a teleoperated robot; the research has been accepted for publication at British HCI 2026.",
      "De-risked real-world deployment of a TIAGo dual-arm robot by engineering a Linux and ROS simulation environment for controlled delay testing, validated across variable latency and network conditions.",
      "Presented the findings at the EPSRC Executive Showcase, which secured continuation funding for further placements.",
    ],
  },
];

// Hackathons, newest first. Not dated contracts: they are not in `experience`,
// so they never count as an active role. `mark` is a file in public/projects/marks.
export const hackathons = [
  {
    id: "hacktheburgh-xiii",
    event: "HackTheBurgh XIII",
    org: "University of Edinburgh CompSoc",
    where: "Edinburgh",
    when: "Sat 7 – Sun 8 Nov 2026",
    hours: 24,
    status: "attended",
    mark: "hacktheburgh.svg",
    points: [
      "Poseidon: live ship tracking that flags ships going quiet while other ships in the same area keep reporting, so an analyst gets a short list to check. A flag is a prompt to review, not an accusation.",
      "I led a team of four, each of us directing a coding agent in one repository. A pinned GitHub issue was the agents' message board, where each claimed its folders so no two edited the same files at once.",
      "Two live AIS feeds merged so a ship heard twice is stored once, every ship drawn on one GPU layer, and a replay of the stored history at up to 300× speed.",
      "Replayed over one evening's log of 1.65 million messages, the gap detector found 2,326 silences across 24,615 ships: 654 looked deliberate and 1,097 were coverage gaps.",
      "We trained route and go-dark models and published the results, weak ones included: the go-dark ranking scored an AUC of 0.59 at 1 hour and 0.63 at 6.",
    ],
    links: [
      { label: "See the project", url: "#vault", internal: true },
      { label: "hacktheburgh.com", url: "https://hacktheburgh.com/" },
      { label: "Repo", url: "https://github.com/Hamish-MarshallDawson/Poseidon" },
    ],
  },
  {
    id: "code-for-good",
    event: "Code for Good",
    org: "JPMorganChase",
    where: "Glasgow",
    when: "Fri 23 – Sat 24 Oct 2026",
    hours: 24,
    noSleep: true,
    status: "attended",
    mark: "jpmc.png",
    points: [
      "A working feedback and impact platform for West Lothian 50+ Network, a charity that has to show its funders that walking groups and coffee mornings make older members less lonely. Shipped in 24 hours and deployed on AWS.",
      "I led the front end and the overnight build to the 9am deadline: eleven parallel coding agents working against Figma and Playwright, each with a scoped brief, and nothing merged until lint, type checks, tests and a person had passed it.",
      "Privacy by design: names and phone numbers encrypted in a separate database from anything members told us, and no figure shown that rests on fewer than five people.",
      "180 TypeScript modules and 46 test suites later, the technical judges singled out the engineering and our JPMC supervisors called it one of the most polished products they had seen. We did not win.",
      "A team of five who met that morning. I stayed up for the whole thing, powered through, and had a great time.",
    ],
    links: [
      { label: "See the project", url: "#vault", internal: true },
      { label: "Visit charity", url: "https://westlothian50plusnetwork.co.uk/" },
      { label: "Repo", url: "https://github.com/glasgow26/Team-2" },
    ],
  },
];

// "Where I've studied", inside the work log. Same shape as `experience`, so
// `starts`/`ends` drive the same live progress bar (the degree fills as
// the months pass; a finished school shows complete).
export const education = [
  {
    qualification: "MEng Software Engineering",
    org: "Heriot-Watt University",
    mark: "heriot-watt.svg",
    period: "Sept 2022 – Jun 2027",
    starts: "2022-09",
    ends: "2027-06",
    location: "Edinburgh",
    points: [
      "On track for First Class Honours.",
      "University Prize winner — the highest grade across all courses in my year.",
      "Dissertation, 89/100: an end-to-end robotic arm that swaps objects on spoken command, joining OpenCV perception, a visual-action model, an LLM and speech recognition into one perception-to-control pipeline.",
      "Coursework highlights: low-latency text-to-speech for real-time use in Minecraft, a predictive crop-planting model from soil data, and particle swarm optimisation with neural networks.",
    ],
  },
  {
    qualification: "Secondary school",
    org: "Alford Academy",
    mark: "alford-bull.png",
    period: "2016 – 2022",
    location: "Alford, Aberdeenshire",
    points: [
      "Head Prefect.",
      "Head of Charity Work.",
      "Head of Student Council.",
      "Four years volunteering at Garioch Judo on Campus.",
    ],
  },
];

// Quick-scan facts from the CV for the hero's ruled strip. Every page load
// shows a different five (see pickHighlights), so keep each one true and
// short enough for a fifth of the row.
export const highlights = [
  { key: "Degree", value: "On track for a First" },
  { key: "University Prize", value: "Top grade in my year" },
  { key: "Publication", value: "British HCI 2026" },
  { key: "Dissertation", value: "89/100" },
  { key: "Code for Good", value: "JPMorganChase · Oct 2026" },
  { key: "Fault detection", value: "98% across 25 classes" },
  { key: "Accuracy lift", value: "23% → 98%" },
  { key: "Copilot rollout", value: "8 senior engineers" },
  { key: "User study", value: "12 participants" },
  { key: "EPSRC showcase", value: "Funding continued" },
  { key: "Racing team", value: "15+ partnerships" },
  { key: "Team lead", value: "8 engineers shipped" },
  { key: "Local pipeline", value: "Under 4GB of VRAM" },
  { key: "Class rep", value: "Rep of the Year" },
  { key: "LocalMind", value: "Wakes on request" },
  { key: "Judo", value: "Brown belt" },
  { key: "Alford Academy", value: "Head Prefect" },
  { key: "Garioch Judo", value: "4 years volunteering" },
  { key: "Photography", value: "10+ years" },
  { key: "PC builds", value: "5+ and counting" },
];

// A fresh random `count` of the highlights (Fisher–Yates on a copy).
export function pickHighlights(count = 5, pool = highlights) {
  const deck = [...pool];
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck.slice(0, count);
}

// The toolkit ledger under the work log.
export const toolkit = [
  { key: "Languages", items: ["Python", "C++", "C", "C#", "Java", "SQL", "JavaScript"] },
  {
    key: "AI / ML",
    items: [
      "PyTorch",
      "scikit-learn",
      "Pandas",
      "Hugging Face",
      "OpenCV",
      "Ollama",
      "Unsloth",
      "LoRA",
      "RAG",
      "Quantisation",
      "Bayesian optimisation",
    ],
  },
  {
    key: "Systems & tools",
    items: ["Linux", "Git", "Docker", "PostgreSQL", "ROS1/ROS2", "Proxmox", "Tailscale", "Vercel", "Unity"],
  },
  {
    key: "Agents & workflow",
    items: ["Claude Code", "Codex", "Herdr", "Multi-agent orchestration", "MCP servers", "Playwright", "Obsidian"],
  },
];

export const personal = [
  {
    title: "...at the gym",
    meta: "5x a week",
    description:
      "Five sessions a week since I started university, and the habit has never really broken. Most of the people I know now I met through it. The confidence it built ended up mattering more outside the gym than in it — these days I get more out of helping friends hit their goals than my own.",
    image: img("GymLife.jpg"),
    alt: "Gym mirror photo, taken on a Sony camera",
    focus: "50% 22%",
  },
  {
    title: "...building PCs",
    meta: "5+ builds",
    description:
      "Five-plus builds over the last few years, the most recent one my own and finally finished. Picking the parts is half the fun; the other half is what happens after. Right now that means falling back into Destiny 2 harder than I'd like to admit.",
    image: img("NewPc.jpg"),
    alt: "Custom-built PC with blue-lit fans behind a glass side panel",
    focus: "50% 48%",
  },
  {
    title: "...taking photos and videos",
    meta: "10+ Years of experience",
    description:
      "Recently picked up a Sony A7C II and have barely put it down since. Mostly Edinburgh — the city itself, and the people I end up wandering around it with.",
    image: img("EdinTown.jpg"),
    alt: "Edinburgh Old Town tenements and spires under a bright sky",
  },
];

export const extracurricular = [
  {
    role: "Student Representative",
    org: "School of Mathematical & Computer Sciences",
    period: "Sept 2023 – present",
    badge: "Class Rep of the Year",
    description:
      "Rebuilt how course feedback reaches academic staff, turning recurring complaints into agreed changes and improving course delivery across the school. Recognised with Class Rep of the Month and Class Rep of the Year.",
    image: img("ClassRepoftheyear.jpg"),
    alt: "On stage at the student awards holding the Class Rep of the Year trophy",
    focus: "50% 28%",
  },
  {
    role: "Branding and Media Manager",
    org: "Heriot-Watt Racing — Formula Student",
    period: "Sept 2023 – present",
    badge: "15+ partnerships",
    description:
      "Two seasons translating what a multi-disciplinary engineering team's car could actually do into something sponsors would back — over 15 external partnerships secured. Now strengthening the software department's continuity with a restructured recruitment pipeline and documented handovers for outgoing students.",
    image: img("hw-racing.jpg"),
    alt: "With Heriot-Watt Racing teammates beside the Formula Student car in the pit lane",
    focus: "50% 24%",
  },
];

const monthStart = (ym) => {
  const [year, month] = ym.split("-").map(Number);
  return new Date(year, month - 1, 1);
};
const monthEnd = (ym) => {
  const [year, month] = ym.split("-").map(Number);
  return new Date(year, month, 1);
};

// A role is active until the end of its `ends` month.
export function isActiveRole(job, now = new Date()) {
  return Boolean(job.ends) && now < monthEnd(job.ends);
}

// Whole-percent progress through an active role, or null without dates.
export function roleProgress(job, now = new Date()) {
  if (!job.starts || !job.ends) return null;
  const start = monthStart(job.starts).getTime();
  const end = monthEnd(job.ends).getTime();
  return Math.round(Math.min(1, Math.max(0, (now.getTime() - start) / (end - start))) * 100);
}
