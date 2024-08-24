import "./App.css";
import Header from "./components/Header";
import ProjectShowcase from "./components/projects";

function App() {
  return (
    <div className="page">
      <div className="mainBody">
        <div className="headerSection">
          <h1>Hamish</h1>
          <h2>Marshall Dawson</h2>
          <Header />
        </div>

        <ProjectShowcase />

        <p>
          I am an independent, reliable, hardworking, team player, who has
          undertaken a range of leadership roles. Presently studying Computing
          Science (Artficial Intelligence) at Heriot Watt University, I have
          secured a number of awards and qualificatons including the Duke of
          Edinburgh Gold Award, RLSS Qualificaton (Life Guarding course), Deputy
          Head and Head of Student Council at Alford Academy, and over four
          years as a volunteer assistant judo coach. These experiences have
          further enhanced my confidence and communicaton skills when engaging
          with the public and improved my ability to work efficiently and
          effectvely within a team. I take directon well and can work
          independently with confidence.
        </p>
      </div>
    </div>
  );
}

export default App;
