import { profile } from "../projectdata";
import { Fps } from "../shared/Telemetry";
import "./PhoneBar.css";

// The phone's persistent bar (Figma 21:1175): CV and Email always in reach, and the FPS readout.
// Shown only where the status strip is hidden (PhoneBar.css). With no CV file it asks for one in Reach out.
export function PhoneBar({ onRequestCv }) {
  return (
    <nav className="phonebar surface-ink" aria-label="CV and email">
      {profile.cv ? (
        <a className="phonebar-btn phonebar-cv" href={profile.cv} download="">
          ↓ CV · PDF
        </a>
      ) : (
        <a
          className="phonebar-btn phonebar-cv"
          href="#reach-out"
          onClick={(e) => {
            e.preventDefault();
            onRequestCv?.();
          }}
        >
          ↓ CV · PDF
        </a>
      )}
      <a className="phonebar-btn phonebar-mail" href={`mailto:${profile.email}`}>
        Email me
      </a>
      <Fps className="phonebar-fps u-micro" />
    </nav>
  );
}
