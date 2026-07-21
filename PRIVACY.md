# Privacy policy

Last updated: July 21, 2026.

Teach is an open-source, self-hosted Codex plugin. It does not run an analytics
service, sell personal data, or operate a Teach cloud account.

## Data Teach processes

Teach creates an explicitly authorized screen recording, sampled image frames,
session metadata, model-generated process labels, and generated skill files.
The default recorder captures the screen and pointer. Teach does not capture
raw keystrokes or clipboard contents. Microphone capture is not enabled in the
current release.

## Where data goes

Recordings and session files stay in the user's local Teach data directory.
When the default analyzer runs, bounded sampled frames and the teaching prompt
are processed through the user's configured Codex installation and OpenAI
account. That processing is governed by the user's OpenAI agreement, workspace
settings, and applicable OpenAI privacy terms. Teach does not send recordings
or frames to GitHub, Devpost, the developer, or a separate Teach service.

## Retention and deletion

Local artifacts remain until the user deletes the corresponding session data.
Generated skills remain in the user's skill directory until removed. Because
Teach has no developer-operated cloud storage, deletion is performed on the
user's computer.

## User responsibilities

Users must avoid recording secrets or sensitive personal data and must obtain
any consent required to record other people or their information. Teach must
not be used for covert, continuous, workplace-surveillance, or unlawful
recording.

## Contact

Questions and privacy reports can be opened through
`https://github.com/Zacxxx/teach/issues`. Security vulnerabilities should be
reported privately through GitHub security advisories.

