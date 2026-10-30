# Math It! / Hand-drawn wireframes

Rebuilt to match the supplied reference: slightly irregular black outlines, white backgrounds, handwritten labels, crossed illustration placeholders and outlined controls. These are structural sketches of the existing website.

- Open `index.html` for the click-through prototype.
- Nine desktop screens cover setup, casebook, clue activity, movement guide, hint, retry, success, data activity and the profile dialog.
- Four mobile sketches cover welcome, casebook, clue activity and data activity.
- Editable vector SVGs and standalone HTML previews are in `sketches/`.
- Proposal section: one A4 page with four simplified screens at `../../output/pdf/Math-It-Wireframe-Proposal.pdf`.
- Insert-ready figure: `../../output/wireframes/Math-It-Wireframe-Proposal.png`; editable version: the SVG with the same name.
- The eleven-page full screen reference is at `../../output/pdf/Math-It-Wireframe-Reference.pdf`; it is a working reference, not the proposal section.
- PNG exports are in `../../output/wireframes/screens/`.

The screen navigation and main outlined actions link between example screens. Form inputs, clue movement and chart tools are schematic placeholders, rather than a second playable implementation. The website itself supplies the complete working functionality.

Regenerate the compact proposal with `python docs/wireframe/build_proposal_page.py`. Regenerate full screens with `python docs/wireframe/build_sketches.py`, then `node docs/wireframe/capture_sketches.mjs`. PDF rendering should be visually checked after changes.

The sketch font uses Comic Sans MS when available, with a cursive fallback. Handwriting is embedded in the PDF. Layout, labels and paths remain editable in the SVGs. The sketches use the supplied image only as a visual reference; its example banking content is not part of Math It!.
