import { motion } from "framer-motion";
import { experience, vaultProjects } from "../projectdata";
import { Marquee } from "../shared/Marquee";
import { MaskedWords } from "../shared/SectionHeader";
import { Wipe } from "../shared/Wipe";

const statement = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.15 } },
};

// The super-type statement between the lobby and the vault. White type on
// ink runs straight across a signal-blue block that is narrower than the
// line, so the words overhang the colour on both sides.
export function Manifesto() {
  return (
    <section className="manifesto surface-ink" aria-label="Summary">
      <div className="section-inner">
        <p className="pill manifesto-kicker">Robotics · perception · local AI</p>

        <div className="manifesto-statement">
          <Wipe className="manifesto-block" from="left" duration={0.9} aria-hidden="true" />
          <motion.p
            className="manifesto-type"
            variants={statement}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.4 }}
          >
            <MaskedWords text="Models on hardware that shouldn't fit them." />
          </motion.p>
        </div>

        <div className="manifesto-cols">
          <div className="manifesto-col">
            <p className="manifesto-col-key u-micro">(i) Infil</p>
            <p className="manifesto-copy">
              Infil: {vaultProjects.length} files in the vault. Robotic arms that take spoken orders, trust studies on
              teleoperated robots, and full local pipelines under 4GB of VRAM.
            </p>
          </div>
          <div className="manifesto-col">
            <p className="manifesto-col-key u-micro">(ii) Exfil</p>
            <p className="manifesto-copy">
              Exfil: {experience.length} work logs, then Reach out at the bottom of the terminal. Past it is an
              actual person.
            </p>
          </div>
        </div>
      </div>

      <Marquee items={["Robotics", "Perception", "Local AI"]} repeat={4} className="manifesto-marquee" />
    </section>
  );
}
