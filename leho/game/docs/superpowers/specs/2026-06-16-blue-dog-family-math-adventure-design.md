# Blue Dog Family Math Adventure Design

## Goal

Transform the current static math game in `/Users/ip/dev/code/blog/leho/game` from a dinosaur and vehicle adventure into a polished family-cartoon math adventure with a Bluey-like warm household mood, exaggerated child-friendly sound effects, rigorous math-story semantics, and voice-first play for children who cannot read yet.

The implementation must keep the project root as `/Users/ip/dev/code/blog/leho/game`.

## Copyright Boundary

The app may evoke the feeling of a blue dog family cartoon: warm family play, blue and orange dog siblings, rounded home environments, pretend-play energy, bright Australian-suburban colors, and gentle humor.

The app must not bundle official Bluey images, screenshots, audio, names, exact character drawings, copied dialogue, or traced assets unless the user later supplies local assets they have the right to use. The default implementation will use original HTML/CSS/SVG-style characters and scenes.

If the user later adds private local assets for family use, the app may expose a small asset hook, such as `assets/private/`, to display those files without fetching remote content. The generated default code should still work without those assets.

## Current State

The current app is a single-page static web game:

- `index.html` owns UI, game state, question generation, Web Speech narration, Web Audio effects, and animation.
- `adventure.js` owns theme metadata for vehicle adventures.
- `garage.js` owns vehicle and dinosaur catalog, coins, ownership, equipment, and related voice text.
- `logic/question-mix.js` owns question type selection and stats aggregation.

Existing durable behavior should be preserved:

- Two players: `lele` and `haohao`.
- Five-question rounds.
- Score, stars, coins, leaderboard, medals, garage inventory, and localStorage persistence.
- Settings for displaying equations and speaking equations.
- Existing basic keyboard and numpad input.

## Product Direction

The game becomes an animated "math episode" rather than a vehicle chase.

The main loop:

1. Child chooses a player.
2. A short narrated cartoon intro starts the episode.
3. Each question appears inside a household pretend-play scene.
4. The story and question are read aloud.
5. The child enters the answer through the existing numpad.
6. Correct answers advance the episode with a big visual and sound moment.
7. Wrong answers give spoken hints without shaming or scaring the child.
8. The final correct answer triggers a bigger episode finale.
9. Result, rewards, and next actions are read aloud.

## Visual Design

Use original blue and orange dog-family characters:

- Player one: blue dog child, maps to `lele`.
- Player two: orange dog child, maps to `haohao`.
- Supporting family silhouettes may appear as generic parents or sibling shapes, but should not copy official Bluey characters.

Scenes:

- Living room: blocks, cushions, toy basket.
- Backyard: balloons, picnic blanket, garden hose, stepping stones.
- Park: slide, trees, scooter, sandpit toys.
- Kitchen: cookies, plates, cups, lunchbox.
- Bedroom: stars, pillows, books, night light.

Animation quality requirements:

- Characters have at least idle breathing, blinking, ear bounce, and small body bob.
- Correct answer produces a staged sequence: anticipation, squash/stretch, jump or slide, item burst, score/coin movement.
- Consecutive correct answers increase animation intensity.
- Final answer uses a larger scene-wide celebration.
- Reduced motion media query must still keep the game usable with minimal animation.

Layout requirements:

- Keep the math workspace central and easy to scan.
- Do not rely on reading text to understand the next action.
- Avoid clutter that competes with the answer input and numpad.
- Mobile portrait and small landscape must remain playable.

## Sound Design

All sounds use Web Audio so no external audio files are required.

Sound requirements:

- Start: playful xylophone pickup.
- Button tap: soft toy click.
- Correct: upward xylophone arpeggio plus boing.
- Correct streak: add whoosh, sparkle, and short cartoon "pop-pop" accents.
- Wrong: gentle slide whistle or soft wobble, never harsh.
- Hint: subtle chime before spoken hint.
- Final: layered xylophone, whoosh, confetti pops, and low soft thump.
- Garage unlock/equip: toy-box reveal sound.

Audio must respect the existing mute button. Muting must stop speech and suppress generated sound effects.

## Voice-First Requirements

Because the child may not read, every important state change needs speech.

Speech must cover:

- Home intro.
- Player selection prompt.
- Player selected.
- Episode intro.
- Every question story.
- Every question prompt.
- Equation reading when enabled.
- Correct answer feedback.
- Wrong answer feedback.
- Hints.
- Final score and reward.
- Leaderboard status.
- Garage open, afford, not afford, unlock, equip, and in-use states.
- Settings navigation enough for an adult to understand.

Speech requirements:

- No required action may be text-only.
- Speech queue must avoid cutting off the current question.
- "Read question" must replay the whole current story and question.
- If equation display is disabled, speech still reads the story and question.
- If equation speech is disabled, speech still reads the story and question.

## Math Semantics

Math questions are strict educational content and must not contain semantic mismatches.

Question templates must be structured by operation and scenario:

- Addition: combine two quantities of the same object category and ask total.
- Subtraction: start with a quantity, remove or use some quantity, ask remaining.
- Missing addend: total and one addend are known, ask the missing addend.
- Missing minuend: removed quantity and remaining quantity are known, ask original quantity.
- Missing subtrahend: original and remaining are known, ask removed quantity.
- Compare: two quantities of the same category, ask difference.
- Two-step: sequence must match the arithmetic exactly, such as add then remove or remove then add.

Template data should include:

- Scene id.
- Object noun.
- Unit or measure word.
- Action phrase.
- Story text.
- Question text.
- Equation parts.
- Spoken equation.
- Answer.
- Type.

Semantic safeguards:

- Never mix unrelated units in one arithmetic expression.
- Never ask "total" after a subtraction-only story.
- Never ask "remaining" after an addition-only story.
- Compare questions must compare the same noun and unit.
- Missing-number stories must name the unknown clearly.
- Generated answers must be non-negative integers.
- For each generated question, a validator verifies `answer`, story mode, question intent, and equation parts before use.

## Data And Architecture

The implementation should reduce risk by separating content data from rendering:

- Add a math story factory or module near `logic/question-mix.js` for structured templates and validation.
- Keep `QuestionMix` as the question type selector and stats helper.
- Replace the inline dinosaur/vehicle story arrays with structured family-cartoon templates.
- Adapt `adventure.js` or add a new episode theme layer for home scenes.
- Preserve `Garage` API shape where practical so coins, ownership, and medals still work.

Recommended modules:

- `logic/story-templates.js`: structured story templates and validation.
- `logic/story-templates.test.js`: generator and semantic validation tests.
- `cartoon.js` or a section in `index.html`: scene metadata, dog character render helpers, and episode progression.

If a lightweight static setup is preferred, tests may run with Node using CommonJS exports, matching the current style in `garage.js` and `adventure.js`.

## Acceptance Criteria

The feature is complete only when all of these are true:

- The first screen is visibly a blue/orange dog-family cartoon math game, not a dinosaur game.
- The quiz scene shows animated household cartoon scenes.
- Correct answers trigger polished staged animation and exaggerated sound.
- Wrong answers trigger gentle sound and spoken hints.
- Every required child-facing action has speech.
- No generated question has invalid arithmetic or mismatched story semantics.
- Existing score, coins, leaderboard, medals, and garage flows still work.
- The app is playable on mobile portrait and landscape.
- Reduced-motion users can still complete a round.
- Automated tests cover the story generator semantic rules.
- Browser verification confirms the page loads and a round can start.

## Non-Goals

- Do not build a video player or prerendered cartoon episode.
- Do not fetch remote assets at runtime.
- Do not require a framework or build step unless clearly necessary.
- Do not remove the existing game economy unless it blocks the redesign.
- Do not introduce official copyrighted assets by default.
