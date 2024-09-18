import discordLogo from "./projectsImages/discordLogo.jpg";
import quizImage from "./projectsImages/Quiz.jpg";
import textEditorImage from "./projectsImages/textEditor.jpg";
import ticTacToeImage from "./projectsImages/tic-tac-toe.jpg";
import toDoAppImage from "./projectsImages/ToDoApp.jpg";
import typingSpeedImage from "./projectsImages/TypingSpeed.jpg";
import chatAppImage from "./projectsImages/chatapp.jpg";

export const projectList = [
  {
    name: "Discord Bot",
    description:
      "A discord bot that has a few commands and works by using js and discord.js",
    githubLink: "https://github.com/Hamish-MarshallDawson/DiscordBot",
    img: discordLogo,
    alt: "Discord Logo",
  },
  {
    name: "Quiz App",
    description:
      "A dynamic Quiz game created with react js that has mutiple game states.",
    githubLink: "https://github.com/Hamish-MarshallDawson/react-quiz-app",
    img: quizImage,
    alt: "A Multi choice quiz with pencil",
  },
  {
    name: "Text Editor",
    description:
      "A simple gui text editor that uses python. It gives the user the ability to create a new text file, save as, save or open a new file.",
    githubLink: "https://github.com/Hamish-MarshallDawson/PythonTextEditor",
    img: textEditorImage,
    alt: "A sub menu for a text editor with a few save options",
  },
  {
    name: "Tic Tac Toe",
    description:
      "A simple Tic tac toe game created in react js that allows two players to play the game.",
    githubLink: "https://github.com/Hamish-MarshallDawson/Tic-tac-toe-react",
    img: ticTacToeImage,
    alt: "A game of tic tac toe",
  },
  {
    name: "To Do List",
    description:
      "A dynamic To do list app created with React js allowing the user to add any amount of tasks, change the order of them and then remove tasks after completion.",
    githubLink: "https://github.com/Hamish-MarshallDawson/react-to-do-list",
    img: toDoAppImage,
    alt: "A to do list on pen and paper",
  },
  {
    name: "Words per minute calculator",
    description:
      "A program that calculates your words per minute and allows the user to select mutiple difficulties.",
    githubLink: "https://github.com/Hamish-MarshallDawson/WordsPerMinute",
    img: typingSpeedImage,
    alt: "Someone typing on a laptop",
  },
  {
    name: "Real time chat app",
    description:
      "Built using React and Node js, when hosted can allow two users to enter the same chat room and send messages to each other.",
    githubLink: "https://github.com/Hamish-MarshallDawson/RealtimeChatApp",
    img: chatAppImage,
    alt: "A ui interface of a conversation on a phone",
  },
];
