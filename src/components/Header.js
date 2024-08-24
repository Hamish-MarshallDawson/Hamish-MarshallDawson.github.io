import { ReactComponent as GithubLogo } from "../assests/Github.svg";
import { ReactComponent as MailLogo } from "../assests/mail.svg";
import { ReactComponent as LinkedinLogo } from "../assests/Linkedin.svg";

export default function Header() {
  return (
    <div className="svgLinks">
      <GithubLogo className="github-icon" />
      <MailLogo className="github-icon" />
      <LinkedinLogo className="github-icon" />
    </div>
  );
}
