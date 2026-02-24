FEATURE: reveal all questions at the end of quiz before end quiz.
Feature: We want a feature that when a quiz is hosted, there is a read only url generated which only shows the questions and nothing else, there will be a provision to have a QR code attched with this URL
Feature: in tournament mode, allow each bracket to choose a quiz pack,
- Qwizzeria logo as watermark.
- Admin cannot see users panel
Document all modules 

Fix: ensure all the counts of questions is correct in quiz packs
Questions migration: 

## Fix: In tournament mode, host is unable to award points from the dashboard.
## Feature: Limit the grid on a host quiz to 100 questions, a quiz pack can have 200+ questions
  Summary Table

    ┌───────────────────┬─────────────┬─────────────────────────────────────────────────┐
    │                   │  Standard   │             Tournament (per match)              │
    ├───────────────────┼─────────────┼─────────────────────────────────────────────────┤
    │ Hard limit        │ None        │ questionsPerMatch (user input, max = pack size) │
    ├───────────────────┼─────────────┼─────────────────────────────────────────────────┤
    │ Displayed at once │ Entire pack │ Only that match's allocated questions           │
    ├───────────────────┼─────────────┼─────────────────────────────────────────────────┤
    │ Team limit        │ 2–8 players │ 2–16 teams                                      │
    ├───────────────────┼─────────────┼─────────────────────────────────────────────────┤
    │ Question reuse    │ N/A         │ Auto-reshuffles if pool runs out                │
    └───────────────────┴─────────────┴─────────────────────────────────────────────────┘##