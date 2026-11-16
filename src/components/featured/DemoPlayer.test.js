import { controlLabels, HOLD_MS } from "./DemoPlayer";

// The card's button and the round control both read these, so they cannot disagree.
test("the labels follow the phase: play, pause, resume and replay", () => {
  expect(controlLabels("idle", false, "LocalMind")).toEqual({ text: "Play demo", aria: "Play the LocalMind demo", glyph: "play" });
  expect(controlLabels("playing", false, "LocalMind")).toEqual({ text: "Pause demo", aria: "Pause the LocalMind demo", glyph: "pause" });
  expect(controlLabels("paused", false, "LocalMind")).toEqual({ text: "Play demo", aria: "Play the LocalMind demo", glyph: "play" });
  expect(controlLabels("ended", false, "LocalMind")).toEqual({ text: "Replay demo", aria: "Replay the LocalMind demo", glyph: "replay" });
});

test("with FX off, the control steps through scenes, then returns to the picture", () => {
  expect(controlLabels("idle", true, "TensorRoom").text).toBe("Play demo");
  expect(controlLabels("playing", true, "TensorRoom")).toEqual({
    text: "Next scene",
    aria: "Next scene of the TensorRoom demo",
    glyph: "next",
  });
  expect(controlLabels("ended", true, "TensorRoom").text).toBe("Play demo");
});

test("the last scene is held for two seconds", () => {
  expect(HOLD_MS).toBe(2000);
});
