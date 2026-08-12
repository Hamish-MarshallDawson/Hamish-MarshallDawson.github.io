import Header from "./Header";

export default function Footer() {
  return (
    <footer className="siteFooter">
      <span className="section-eyebrow">That's the lot</span>
      <h2 className="section-title">Get in touch.</h2>
      <Header />
      <p className="siteFooter-base">
        © {new Date().getFullYear()} Hamish Marshall Dawson · Built with React,
        deployed on GitHub Pages
      </p>
    </footer>
  );
}
