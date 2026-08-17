# PR evidence attachments

## Choose evidence that proves the change

- UI or visual bug: use before and after screenshots captured with the same data, viewport, theme, and zoom.
- Interaction or motion: use a short recording that shows starting state, action, and result without dead time.
- Responsive change: show only the affected representative viewports and label each one.
- Non-visual change: prefer exact test output, logs, metrics, traces, or rendered API results over decorative screenshots.
- Performance claim: include measured before/after values, command, dataset, and environment; a recording alone is not evidence.

Do not fabricate a before state after the fix. State when before evidence was unavailable.

## Capture safely

1. Reproduce the reviewed scenario on the final branch revision.
2. Use stable seed data and remove unrelated windows, notifications, tabs, and browser chrome where possible.
3. Check every frame for tokens, personal data, customer data, private hostnames, internal URLs, and unrelated content.
4. Use descriptive filenames such as `checkout-before.png`, `checkout-after.png`, and `checkout-flow.mp4`.
5. Add a one-line scenario and environment label to the PR. Images need meaningful alt text; recordings need a short text summary of what happens.

## Upload to GitHub

1. Create the PR as a draft with its textual body first.
2. Open the PR description editor or a PR comment in GitHub.
3. Drag and drop the file, choose it with the attachment control, or paste an image from the clipboard.
4. Wait for GitHub to finish uploading and insert its generated anonymized URL.
5. Preserve the generated video markup. For images, replace generic alt text with a meaningful description.
6. Save, reopen the PR, and verify the media renders for the intended audience.

A local path such as `C:\screenshots\after.png` or `/tmp/after.png` is not remotely accessible. `gh pr create --body-file` and connector PR creation publish Markdown text, not local binary attachments. If no available tool can upload user attachments, report the exact local file and remaining manual upload step; do not say the evidence was attached.

Do not commit media into the source tree solely as an upload workaround unless the repository requires versioned evidence.

## Current GitHub attachment constraints

GitHub's attachment documentation currently lists:

- images: `.png`, `.gif`, `.jpg`, `.jpeg`, `.svg`;
- video: `.mp4`, `.mov`, `.webm`; H.264 is recommended for browser compatibility;
- maximum 10 MB for images and GIFs;
- maximum 10 MB for video on free plans or 100 MB on paid plans;
- maximum 25 MB for other supported files.

Recheck the official documentation if an upload fails or these limits matter: https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/attaching-files

Attachments in public repositories are accessible without authentication. Private and internal repository attachments require repository access, but still must not contain secrets or unnecessary personal data.
