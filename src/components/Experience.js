import React from "react";

export default function Experience() {
  return (
    <section className="pageCarouselPage">
      <h2>Experience</h2>
      <div className="experience-item">
        <h3>STMicroelectronics — AI Placement (2026)</h3>
        <ul>
          <li>Placement: 2.5 months (ongoing)</li>
          <li>
            Contributed to a Local AI pipeline for fault detection: VLM with
            LoRA experiments, CLIP embedding clustering, constrained VRAM
            testing and VLM/prompt experimentation.
          </li>
          <li>Tools: Python, PyTorch, model fine-tuning (LoRA), CLIP, VLMs.</li>
        </ul>
      </div>
      <p>
        Brief summary only — contact me for a full case study or see the
        downloadable resume.
      </p>
    </section>
  );
}
