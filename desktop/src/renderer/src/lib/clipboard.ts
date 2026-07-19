/** Copy text to the system clipboard (works in Electron renderer). */
export async function copyToClipboard(text: string): Promise<boolean> {
  const trimmed = text.trim();
  if (!trimmed) return false;

  if (window.landed?.copyText) {
    try {
      const ok = await window.landed.copyText(trimmed);
      if (ok) return true;
    } catch {
      // Fall through to web APIs.
    }
  }

  try {
    await navigator.clipboard.writeText(trimmed);
    return true;
  } catch {
    // Fall through to execCommand.
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = trimmed;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}
