import React, { useEffect } from "react";
import "./App.css";
import Header from "./components/Header";
import { Carousel } from "./components/carousel";

function Title() {
  useEffect(() => {
    const favicon = document.querySelector("link[rel~='icon']");

    if (favicon) {
      favicon.href = "/src/assets/favicon.ico"; // Ensure this path is correct relative to the public directory
    }
    document.title = "Hamish Marshall Dawson";
  }, []);

  return null; // Ensure it returns something
}

function App() {
  return (
    <div className="page">
      <div className="mainBody">
        <div className="headerSection">
          <Title />
          <div className="textColourAnimation">
            <h1>Hamish</h1>
            <h2>Marshall Dawson</h2>
          </div>
          <Header />
        </div>
        <Carousel />
      </div>
    </div>
  );
}

export default App;
