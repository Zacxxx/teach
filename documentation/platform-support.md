# Platform support

Teach 0.3 ships the local MCP backend and a consent-bound screen recorder for
Linux, macOS, and Windows 11. The session format, analysis, review, and generated
skills are identical on every host.

## Support matrix

| Host | Packaged runtime | Capture adapter | Local prerequisites | Verification |
| --- | --- | --- | --- | --- |
| Linux x64 / arm64 | Standalone Bun executable | GNOME Shell Screencast over the user D-Bus | GNOME Wayland, `gdbus`, `gjs`, FFmpeg | Live x64 capture on the development host; x64/arm64 package-format checks; Linux CI lifecycle |
| macOS Intel / Apple silicon | Standalone Bun executable | Apple `/usr/sbin/screencapture` video capture | FFmpeg; Screen & System Audio Recording permission when macOS asks | Intel/arm64 package-format checks and macOS CI lifecycle; live permission/capture checklist below |
| Windows 11 x64 | Standalone Bun executable behind a small native launcher | FFmpeg `gdigrab` desktop capture with pointer | An FFmpeg build exposing `gdigrab` and `ffprobe` on `PATH` | PE package-format checks and Windows CI lifecycle; live desktop-capture checklist below |

The CI lifecycle is deterministic and does not capture a CI runner desktop. A
release should not claim a new native adapter is live-verified until its manual
checklist has also been completed on physical hardware.

## What is recorded

Every native adapter records the screen and pointer after a separate explicit
Ready action. The Teach panel remains visibly in the recording state and offers
an **End recording** control. The authorization expires after ten minutes if it
is not used. Microphone, clipboard, and raw-keystroke capture remain disabled;
adding any of them requires a separate permission, storage, redaction, and
analysis design.

## Install prerequisites

1. Install current Codex Desktop or Codex CLI.
2. Install `ffmpeg` and `ffprobe` and ensure both resolve on `PATH`.
3. On Linux, use a GNOME Wayland session with `gdbus` and `gjs`.
4. On macOS, approve Codex/Teach under **System Settings → Privacy & Security →
   Screen & System Audio Recording** when prompted.
5. On Windows, confirm `ffmpeg -hide_banner -devices` lists `gdigrab`.

Teach probes these dependencies before enabling the Ready button and reports a
specific repair instead of starting a recording that cannot be finalized.

## Release checklist

Run this on each target after installing the plugin from the release candidate:

1. Open a fresh Codex task and invoke `@teach`.
2. Skip metadata, click Ready, and confirm the OS permission surface appears if
   required.
3. Record at least ten seconds while moving the pointer and changing two visible
   application states.
4. Stop from the embedded button.
5. Confirm the session reaches `processing`, `ffprobe` accepts the recording,
   and at least two sampled frames exist.
6. Analyze with the fixture and with the configured Codex model.
7. Review and publish the skill, then invoke it from a new task.
8. Interrupt one recording and confirm the session becomes retryable without a
   stale `active-recording.json` lock.

On macOS, repeat once with permission denied to check the error guidance, then
grant permission and retry. On Windows, repeat once after temporarily removing
FFmpeg from `PATH` to confirm the Ready button is disabled. On Linux, repeat
after restarting Codex to prove user-session D-Bus discovery does not depend on
exported graphical variables.

## Storage locations

| Host | Default session root |
| --- | --- |
| Linux | `$XDG_DATA_HOME/teach` or `~/.local/share/teach` |
| macOS | `~/Library/Application Support/Teach` |
| Windows | `%LOCALAPPDATA%\Teach` |

`TEACH_HOME` overrides all three. Generated skills default to
`~/.agents/skills` unless `TEACH_SKILLS_HOME` is set.

## Implementation references

- [Apple: control access to screen and system audio recording](https://support.apple.com/guide/mac-help/control-access-to-screen-and-system-audio-recording-mchld6aa7d23/mac)
- [FFmpeg: Windows `gdigrab` input device](https://ffmpeg.org/ffmpeg-devices.html#gdigrab)
- [Bun: cross-compiled standalone executable targets](https://bun.sh/docs/bundler/executables#cross-compile-to-other-platforms)
