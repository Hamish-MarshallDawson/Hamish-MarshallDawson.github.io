import { useState } from "react";
import { projectList } from "./projectdata";
import ProjectCard from "./ProjectCard";

export default function ProjectShowcase() {
  const [index, setIndex] = useState(0);
  const [showMore, setShowMore] = useState(false);
  const hasNext = index < projectList.length - 1;
  const hasBack = index > 0;

  function handleNextClick() {
    if (hasNext) {
      setIndex(index + 1);
    } else {
      setIndex(0);
    }
  }

  function handleBackClick() {
    if (hasBack) {
      setIndex(index - 1);
    } else {
      setIndex(projectList.length - 1);
    }
  }

  function handleMoreClick() {
    setShowMore(!showMore);
  }

  let project = projectList[index];
  return (
    <>
      <h2>
        <i>{project.name}</i>
      </h2>

      <h3>
        ({index + 1} of {projectList.length})
      </h3>

      <div className="projectImg">
        <ProjectCard project={project} />
      </div>

      <div className="button-containter">
        <button onClick={handleBackClick}>
          <div className="left">
            <i className="arrow"></i>
          </div>
        </button>

        <button onClick={handleMoreClick}>
          {showMore ? "Hide" : "Show"} Description
        </button>

        <button onClick={handleNextClick}>
          <div className="right">
            <i className="arrow"></i>
          </div>
        </button>

        {showMore && <p>{project.description}</p>}
      </div>
    </>
  );
}
