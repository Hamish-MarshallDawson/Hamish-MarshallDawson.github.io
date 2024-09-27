import { ReactComponent as GithubLogo } from "../assests/Github.svg";
import { ReactComponent as MailLogo } from "../assests/mail.svg";
import { ReactComponent as LinkedinLogo } from "../assests/Linkedin.svg";

export default function Header() {
  return (
    <div className="svgLinks">
      <a
        href="https://github.com/Hamish-MarshallDawson"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="GitHub"
      >
        <GithubLogo className="github-icon" />
      </a>

      <a href="mailto:hamishmarshalldawson@gmail.com" aria-label="Email">
        <MailLogo className="github-icon" />
      </a>
      <a
        href="https://www.linkedin.com/in/hamish-marshall-dawson/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="LinkedIn"
      >
        <LinkedinLogo className="github-icon" />
      </a>
    </div>
  );
}
