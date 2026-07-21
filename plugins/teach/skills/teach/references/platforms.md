# Platform recording guidance

Teach uses one consent and lifecycle contract with host-specific capture:

- Linux: GNOME Wayland Screencast through a persistent user-session D-Bus sender.
- macOS: Apple screen capture; macOS may request Screen & System Audio Recording permission.
- Windows 11: FFmpeg `gdigrab`; FFmpeg and ffprobe must be on `PATH`.

If `recorder.supported` is false, show its exact label and detail and do not call
`teach_start`. Do not suggest relaunching Codex with guessed display variables.
After the dependency or permission is repaired, open Teach again so the probe
runs before a fresh authorization.
