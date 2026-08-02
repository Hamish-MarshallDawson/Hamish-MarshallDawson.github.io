import discordLogo from "./projectsImages/discordLogo.jpg";
import quizImage from "./projectsImages/Quiz.jpg";
import textEditorImage from "./projectsImages/textEditor.jpg";
import ticTacToeImage from "./projectsImages/tic-tac-toe.jpg";
import toDoAppImage from "./projectsImages/ToDoApp.jpg";
import typingSpeedImage from "./projectsImages/TypingSpeed.jpg";
import chatAppImage from "./projectsImages/chatapp.jpg";

// Placeholder images reused for new professional entries (replace with
// curated screenshots when available)
const dissertationImg = textEditorImage;
const hriImg = quizImage;
const busTrackerImg = chatAppImage;

// The carousel shows a curated set rather than every public repo. Each entry is
// matched against the GitHub API by `repo`; live stats are merged in when the
// repo is public. TensorRoom is private, so it renders from the values here.
export const carouselProjects = [
  {
    repo: "Language-Commands-for-a-Robotic-arm-using-Object-Recognition-",
    name: "Language Commands for a Robotic Arm",
    category: "Dissertation",
    description:
      "Speech-controlled robotic arm translating language commands into actions with a VLA model, Whisper, and a local LLM under 4GB of VRAM.",
    accent: "linear-gradient(135deg, #e09891 0%, #8a5f8f 100%)",
  },
  {
    repo: "TensorRoom",
    name: "TensorRoom",
    category: "In progress",
    description:
      "Local AI workspace bringing diffusion, segmentation, and a RAG/LLM pipeline together behind a single interface.",
    url: "https://github.com/Hamish-MarshallDawson/TensorRoom",
    language: "Python",
    accent: "linear-gradient(135deg, #749c75 0%, #2f6f6f 100%)",
  },
  {
    repo: "Lothian-Api-Bus-Display",
    name: "Lothian Bus Display",
    category: "Hardware",
    description:
      "Live Edinburgh bus times on an e-ink display driven by a Raspberry Pi 5, built around the Lothian Buses API.",
    accent: "linear-gradient(135deg, #c9884f 0%, #7a4b3a 100%)",
  },
  {
    repo: "iteration-inc",
    name: "Iteration Inc",
    category: "Team project",
    description:
      "Group software engineering project delivered collaboratively across a full development cycle.",
    accent: "linear-gradient(135deg, #5b7cc4 0%, #3c3f7a 100%)",
  },
];

export const projectSections = [
  {
    label: "Featured research",
    title: "AI systems built around human interaction, speech, and local inference",
    description:
      "These projects show the shift from general web apps into research-driven work across robotics, perception, and constrained on-device AI deployment.",
  },
  {
    label: "Industrial placement",
    title: "Applied AI work at STMicroelectronics",
    description:
      "A short summary of the placement sits alongside the featured work so recruiters can immediately see your industry exposure and technical focus.",
  },
];

export const projectList = [
  {
    name: "Dissertation: Visual-Language Action (VLA) + Whisper",
    shortDescription:
      "Speech-controlled robotic arm using a Visual Language Action model, Whisper, and a local LLM under a strict VRAM budget.",
    description:
      "A dissertation project focused on building a speech-controlled robotic arm that could translate language commands into actions using a Visual Language Action model, OpenAI Whisper for speech recognition, and a locally run LLM. The full training dataset for the VLA system was gathered and prepared by me, and the final system ran on less than 4GB of VRAM. The work was showcased at HRI 2026 in the National Robotarium.",
    highlights: [
      "Local speech-to-action pipeline",
      "Custom training dataset collected and prepared by me",
      "Ran under 4GB VRAM",
      "Showcased at HRI 2026",
    ],
    outcomes: [
      "Demonstrated end-to-end embodied AI on constrained hardware",
      "Used local models to avoid cloud dependence",
      "Presented at an academic event environment",
    ],
    githubLink: "",
    img: dissertationImg,
    alt: "Robotic arm demonstration",
    featured: true,
    category: "Dissertation",
    timeline: "2026",
    stack: ["VLA", "Whisper", "LLM", "local inference", "robotics"],
  },
  {
    name: "HRI Study: Delay Impact on Trust in Teleoperation",
    shortDescription:
      "Human-robot interaction study examining how teleoperation delay affected operator trust.",
    description:
      "A human-robot interaction study into the impact of delays on trust in teleoperation. I had to learn and develop in ROS1 to support the experimental setup, then led the experimental process, managed data collection, and helped produce presentation and paper material that was submitted to multiple events. The project also led to presenting the work at several events.",
    highlights: [
      "Learned and worked in ROS1",
      "Led the experimental process",
      "Presented the work at multiple events",
      "Paper and submissions prepared for several venues",
    ],
    outcomes: [
      "Built a research workflow around teleoperation trust",
      "Balanced experimentation, write-up, and presentation work",
      "Strengthened robotics and HRI communication skills",
    ],
    githubLink: "",
    img: hriImg,
    alt: "Teleoperation / HRI study visual",
    featured: true,
    category: "HRI Study",
    timeline: "2025-2026",
    stack: ["ROS1", "teleoperation", "HRI", "experimentation", "research"],
  },
  {
    name: "Raspberry Pi Bus Tracker (In progress)",
    shortDescription:
      "A wall-mounted Raspberry Pi bus tracker with a touchscreen interface and local transit data integration.",
    description:
      "An in-progress hardware and interface project exploring the design of a Raspberry Pi-based bus tracker for a wall-mounted display. I researched the physical components, developed the touchscreen interface, and integrated the Edinburgh Lothian Buses API so it can show local stop and service information in a practical domestic form factor.",
    highlights: [
      "Hardware and UI research",
      "Touchscreen interface for Raspberry Pi",
      "Edinburgh Lothian Buses API integration",
      "Designed for a wall-mounted display",
    ],
    outcomes: [
      "Combines embedded hardware thinking with product UI design",
      "Shows practical API integration for a real-world use case",
    ],
    githubLink: "",
    img: busTrackerImg,
    alt: "Raspberry Pi touchscreen UI",
    featured: true,
    category: "In progress",
    timeline: "2026",
    stack: ["Raspberry Pi", "touchscreen UI", "API integration", "hardware"],
  },
  {
    name: "Discord Bot",
    shortDescription: "A basic Discord bot built with JavaScript and Discord.js.",
    description:
      "A small Discord bot built with JavaScript and Discord.js, kept as an earlier project in the archive section.",
    githubLink: "https://github.com/Hamish-MarshallDawson/DiscordBot",
    img: discordLogo,
    alt: "Discord Logo",
    featured: false,
    category: "Archive",
  },
  {
    name: "Quiz App",
    shortDescription: "A React quiz app with multiple game states.",
    description:
      "A React quiz app with multiple game states, included as an older project rather than a featured case study.",
    githubLink: "https://github.com/Hamish-MarshallDawson/react-quiz-app",
    img: quizImage,
    alt: "A Multi choice quiz with pencil",
    featured: false,
    category: "Archive",
  },
  {
    name: "Text Editor",
    shortDescription: "A simple Python GUI text editor.",
    description:
      "A Python GUI text editor with basic file operations such as create, open, save, and save as.",
    githubLink: "https://github.com/Hamish-MarshallDawson/PythonTextEditor",
    img: textEditorImage,
    alt: "A sub menu for a text editor with a few save options",
    featured: false,
    category: "Archive",
  },
  {
    name: "Tic Tac Toe",
    shortDescription: "A simple two-player Tic Tac Toe game in React.",
    description:
      "A two-player Tic Tac Toe game built in React, retained as an archive project.",
    githubLink: "https://github.com/Hamish-MarshallDawson/Tic-tac-toe-react",
    img: ticTacToeImage,
    alt: "A game of tic tac toe",
    featured: false,
    category: "Archive",
  },
  {
    name: "To Do List",
    shortDescription: "A React to-do list with task ordering and removal.",
    description:
      "A React to-do list application that supports adding tasks, reordering them, and removing them when complete.",
    githubLink: "https://github.com/Hamish-MarshallDawson/react-to-do-list",
    img: toDoAppImage,
    alt: "A to do list on pen and paper",
    featured: false,
    category: "Archive",
  },
  {
    name: "Words per minute calculator",
    shortDescription: "A typing speed app with difficulty selection.",
    description:
      "A typing speed calculator with multiple difficulty options and WPM scoring.",
    githubLink: "https://github.com/Hamish-MarshallDawson/WordsPerMinute",
    img: typingSpeedImage,
    alt: "Someone typing on a laptop",
    featured: false,
    category: "Archive",
  },
  {
    name: "Real time chat app",
    shortDescription: "A real-time chat app built with React and Node.",
    description:
      "A real-time chat application built with React and Node.js where two users can join the same room and exchange messages.",
    githubLink: "https://github.com/Hamish-MarshallDawson/RealtimeChatApp",
    img: chatAppImage,
    alt: "A ui interface of a conversation on a phone",
    featured: false,
    category: "Archive",
  },
];
