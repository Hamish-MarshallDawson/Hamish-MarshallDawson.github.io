import { Fragment } from "react";
import { motion } from "framer-motion";

const heading = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055 } },
};

const word = {
  hidden: { y: "110%" },
  show: { y: "0%", transition: { duration: 0.62, ease: [0.16, 1, 0.3, 1] } },
};

// Splits a string into clipped words that rise into place. Spaces stay as
// real text nodes between the masks, so the heading's accessible name is
// exactly the original string.
export function MaskedWords({ text }) {
  const words = text.split(" ");
  return words.map((w, i) => (
    <Fragment key={`${w}-${i}`}>
      <span className="mask">
        <motion.span variants={word}>{w}</motion.span>
      </span>
      {i < words.length - 1 ? " " : null}
    </Fragment>
  ));
}

// The shared section header: a spreadsheet row of metadata cells (the index
// cell is the only filled one) over a display-size title.
export function SectionHeader({ index, kicker, title, titleId, aside = [], wide = false, titleClass = "", children }) {
  return (
    <header className="sh">
      <div className="cells u-micro">
        <span className="cell cell--fill">({index})</span>
        <span className="cell">{kicker}</span>
        {aside.map((item, i) => (
          <span key={i} className="cell cell--push">
            {item}
          </span>
        ))}
      </div>
      <motion.h2
        id={titleId}
        className={`sh-title u-display${wide ? " sh-title--wide" : ""}${titleClass ? ` ${titleClass}` : ""}`}
        variants={heading}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
      >
        <MaskedWords text={title} />
      </motion.h2>
      {children && <p className="sh-copy">{children}</p>}
    </header>
  );
}
