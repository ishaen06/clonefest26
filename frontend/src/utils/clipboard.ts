/**
 * Secure Clipboard Manager with Auto-Wipe capability
 */

let clipboardWipeTimeout: ReturnType<typeof setTimeout> | null = null;

export async function copySecureToClipboard(
  text: string,
  autoClearSeconds = 30,
  onAutoClear?: () => void
): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);

    if (clipboardWipeTimeout) {
      clearTimeout(clipboardWipeTimeout);
      clipboardWipeTimeout = null;
    }

    if (autoClearSeconds > 0) {
      clipboardWipeTimeout = setTimeout(async () => {
        try {
          // Read current clipboard to check if it still matches before wiping
          const current = await navigator.clipboard.readText();
          if (current === text) {
            await navigator.clipboard.writeText('');
            if (onAutoClear) onAutoClear();
          }
        } catch {
          // In case read permission is blocked, overwrite with empty
          try {
            await navigator.clipboard.writeText('');
            if (onAutoClear) onAutoClear();
          } catch {}
        }
      }, autoClearSeconds * 1000);
    }

    return true;
  } catch (err) {
    console.error('Clipboard copy failed:', err);
    return false;
  }
}
