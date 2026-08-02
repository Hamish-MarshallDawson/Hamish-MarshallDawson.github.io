// Images live in /public/projects so a missing file degrades to the gradient
// behind it instead of breaking the build. The site serves the resized copies
// in optimized/; the full-resolution originals sit alongside them untouched.
const img = (file) => `${process.env.PUBLIC_URL}/projects/optimized/${file}`;

// The carousel is the main work section. Order is deliberate: dissertation and
// the HRI study first, then current builds, then coursework.
export const carouselProjects = [
  {
    id: "dissertation",
    repo: "Language-Commands-for-a-Robotic-arm-using-Object-Recognition-",
    name: "Language based control for Robotic Arm Object Swapping",
    category: "Dissertation · 89% Final Grade",
    description:
      "A robotic arm that takes a spoken instruction and carries it out. OpenCV handles perception, a visual-action model drives manipulation, and an LLM with speech recognition sits on top. The whole pipeline runs locally, under 4GB of VRAM.",
    tags: ["VLA", "LLM", "ASR", "Model training"],
    image: img("dissertation.png"),
    accent: "linear-gradient(135deg, #e09891 0%, #8a5f8f 100%)",
  },
  {
    id: "hri",
    name: "Trust in Teleoperation Robotics Study",
    category: "HRI research · Summer 2025",
    description:
      "Research internship measuring how input latency changes an operator's trust in a teleoperated robot. I built the Linux simulation environment, ran the study, and presented at the EPSRC Executive Showcase, which helped secure the next phase of funding.",
    tags: ["ROS1/2", "User experience", "Experimental design", "Research"],
    image: img("hri.jpg"),
    accent: "linear-gradient(135deg, #5b7cc4 0%, #3c3f7a 100%)",
  },
  {
    id: "tensoroom",
    repo: "TensorRoom",
    name: "TensoRoom",
    category: "In progress",
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
    image: img("tensoroom.png"),
    accent: "linear-gradient(135deg, #749c75 0%, #2f6f6f 100%)",
  },
  {
    id: "bus",
    repo: "Lothian-Api-Bus-Display",
    name: "Lothian Bus Display",
    category: "Open source",
    description:
      "Live Edinburgh bus times on an e-ink panel, driven by a Raspberry Pi 5. Written in C++ and tuned so the rendering stays smooth on low-power hardware. It hangs on my wall and tells me when to leave.",
    tags: ["C++", "Raspberry Pi", "E-ink", "REST APIs"],
    image: img("bus.jpg"),
    accent: "linear-gradient(135deg, #c9884f 0%, #7a4b3a 100%)",
  },
  {
    id: "iteration-inc",
    repo: "iteration-inc",
    name: "Iteration Inc",
    category: "Team lead · 2024–2025",
    description:
      "A serverless smart care-home platform. I led the team and owned authentication, device settings, and the energy-saving recommendations, with accessibility driving most of the interface decisions.",
    url: "https://iteration-inc.vercel.app/",
    tags: ["Serverless", "Authentication", "Accessibility", "Full-stack"],
    image: img("iterationinc.png"),
    accent: "linear-gradient(135deg, #4f9c9c 0%, #2f5f7a 100%)",
  },
  {
    id: "minecraft-agent",
    name: "Minecraft Companion Agent",
    category: "Conversational agents coursework",
    description:
      "A group-built in-game helper for Minecraft that runs entirely on the local machine. It watches what the player is doing, answers questions, and warns them about danger before it reaches them — no cloud calls anywhere in the loop.",
    url: "https://github.com/CordlessGnu/F21caGames2",
    tags: ["LLM", "VLM", "Whisper", "Local models", "TTS"],
    image: img("minecraft.png"),
    accent: "linear-gradient(135deg, #6a9c5b 0%, #35603f 100%)",
  },
  {
    id: "bonin-loot",
    name: "Bonin' Loot",
    category: "Games programming coursework",
    description:
      "A game built for the Games Programming coursework, playable in the browser on itch.io.",
    url: "https://hamishmad.itch.io/bonin-loot",
    tags: ["C#", "Unity"],
    image: img("BoninLoot.png"),
    accent: "linear-gradient(135deg, #b0577f 0%, #5c3470 100%)",
  },
];

export const experience = [
  {
    role: "AI and Machine Learning Engineer Intern",
    org: "STMicroelectronics",
    period: "May 2026 – December 2026",
    location: "Edinburgh",
    points: [
      "Built a VLM-based fault detection pipeline from scratch, clustering and naming unknown faults and sorting known ones into existing classifications — adapting current research into a working agentic system.",
      "Established a standardised testing methodology for a pipeline that had none, validated with Bayesian optimisation and structured train/test splitting.",
      "Ran two weekly progress updates and a wider team review, explaining LoRA, context windows, VRAM constraints, quantisation and RAG to engineers outside the AI team.",
      "Co-presented GitHub Copilot's strengths, weaknesses and best practices, including AGENT.md and SKILLS.md, to speed up adoption across non-software teams.",
    ],
  },
  {
    role: "Research Intern — Human-Robot Interaction",
    org: "Heriot-Watt University",
    period: "Summer 2025",
    location: "Trust in Teleoperation Robotics",
    points: [
      "Quantified how input latency affects teleoperated system performance across multiple participants, shaping the project's next research direction.",
      "Engineered a Linux-based simulation environment to test reliability under variable conditions before real-world deployment.",
      "Presented findings at the EPSRC Executive Showcase, contributing to funding for the next phase.",
    ],
  },
];

export const personal = [
  {
    title: "...at the gym",
    meta: "5x a week",
    description:
      "Five sessions a week since I started university, and the habit has never really broken. Most of the people I know now I met through it. The confidence it built ended up mattering more outside the gym than in it — these days I get more out of helping friends hit their goals than my own.",
    image: img("GymLife.jpg"),
  },
  {
    title: "...building PCs",
    meta: "5+ builds",
    description:
      "Five-plus builds over the last few years, the most recent one my own and finally finished. Picking the parts is half the fun; the other half is what happens after. Right now that means falling back into Destiny 2 harder than I'd like to admit.",
    image: img("NewPc.jpg"),
  },
  {
    title: "...taking photos and videos",
    meta: "10+ Years of experience",
    description:
      "Recently picked up a Sony A7C II and have barely put it down since. Mostly Edinburgh — the city itself, and the people I end up wandering around it with.",
    image: img("EdinTown.jpg"),
  },
];

export const extracurricular = [
  {
    role: "Student Representative",
    org: "Heriot-Watt University",
    period: "Sept 2023 – present",
    description:
      "Won Class Rep of the Month and Class Rep of the Year. Redesigning how course feedback reaches academic staff and set up new channels so problems get raised while there is still time to fix them.",
    image: img("ClassRepoftheyear.jpg"),
  },
  {
    role: "Branding and Media Manager",
    org: "Heriot-Watt Racing — Formula Student",
    period: "Sept 2023 – Sept 2025",
    description:
      "Two years in a multi-disciplinary engineering team, translating what the car could actually do into something sponsors and the public understood. Built external partnerships to grow visibility and funding.",
    image: img("hw-racing.jpg"),
  },
];
