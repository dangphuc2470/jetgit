export function applyPanelFontSize(fontSize: number | undefined | null): void {
  if (typeof document === "undefined") {
    return;
  }
  const root = document.documentElement;
  if (typeof fontSize === "number" && fontSize > 0) {
    const px = `${fontSize}px`;
    root.style.setProperty("--jetgit-font-size", px);
    root.style.fontSize = px;
    if (document.body) {
      document.body.style.fontSize = px;
    }
  } else {
    root.style.removeProperty("--jetgit-font-size");
    root.style.fontSize = "";
    if (document.body) {
      document.body.style.fontSize = "";
    }
  }
}
