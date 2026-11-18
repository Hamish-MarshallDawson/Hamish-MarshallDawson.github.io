import { profile } from "../projectdata";
import { Fps } from "../shared/Telemetry";
import "./PhoneBar.css";

// The phone's persistent bar (Figma 21:1175): CV and Email always in reach, and the FPS readout.
// Shown only where the status strip is hidden (PhoneBar.css).
export function PhoneBar() {
  return (
    <nav className="phonebar surface-ink" aria-label="CV and email">
      <a className="phonebar-btn phonebar-cv" href={profile.cv} download="">
        ↓ CV · PDF
      </a>
      <a className="phonebar-btn phonebar-mail" href={`mailto:${profile.email}`}>
        Email me
      </a>
      <Fps className="phonebar-fps u-micro" />
    </nav>
  );
}
