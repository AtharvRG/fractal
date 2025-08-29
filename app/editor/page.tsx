"use client"; // The editor is a fully client-side experience

import { EditorLayout } from "../../components/editor/editor-layout";
import { jetbrains_mono } from "../fonts";

export default function EditorPage() {
  // Apply the JetBrains Mono font to the editor page specifically
  return (
    <div className={jetbrains_mono.variable}>
  <EditorLayout />
    </div>
  );
}