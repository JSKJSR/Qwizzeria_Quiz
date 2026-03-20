import { GuideSection, GuideStep, GuideTip } from '../GuideBase';
import {
  BuzzerRoomVisual,
  ParticipantsVisual,
  BuzzerHostFlowVisual,
  BuzzerButtonVisual,
  BuzzerRankVisual,
  BuzzerTournamentVisual,
  InputAnswerVisual,
  InputRevealVisual
} from '../GuideVisuals';

export default function BuzzerModeSection() {
  return (
    <GuideSection title="Buzzer Mode" icon={'🔔'}>
      <GuideStep
        number={1}
        title="Enable Buzzer (Host)"
        description="When setting up a Host Quiz or Tournament, check 'Enable Buzzer' before starting. A unique room code is generated automatically."
        visual={<BuzzerRoomVisual />}
      />
      <GuideStep
        number={2}
        title="Players Join"
        description="Share the room code or join link with participants. Players must be logged in — go to /buzz/ROOMCODE to join. A green dot next to the room code confirms the connection is live."
        visual={<ParticipantsVisual />}
      />
      <GuideStep
        number={3}
        title="Choose Buzzer or Collect Answers"
        description="Select a question from the grid, then choose your mode: 'Buzzer' for speed-based buzzing, or 'Collect Answers' for text input. The overlay shows how many participants are connected — if zero, you'll see a warning."
        visual={<BuzzerHostFlowVisual />}
      />
      <GuideStep
        number={4}
        title="Buzz In!"
        description="Tap the buzzer as fast as you can! Your phone vibrates on press. Buzzes under 100ms are rejected (no bots allowed). The system measures your reaction time precisely."
        visual={<BuzzerButtonVisual />}
      />
      <GuideStep
        number={5}
        title="Ranked Results & Award"
        description="The host sees all buzzes ranked by speed. If two players buzz within 50ms of each other, it's flagged as a tie and the host decides. Click 'Award' to give the point, then 'Next Round' to continue."
        visual={<BuzzerRankVisual />}
      />
      <GuideStep
        number={6}
        title="Tournament Buzzer"
        description="In tournament mode, only the two players in the current match can buzz. Everyone else watches as a spectator until their match comes up."
        visual={<BuzzerTournamentVisual />}
      />
      <GuideTip>
        The buzzer uses real-time broadcasting for near-instant response. Each player's buzz time is measured from when they received the question — no unfair advantage from network speed!
      </GuideTip>
      <GuideTip>
        Host flow per round: Open Buzzer &rarr; Lock &rarr; Award &rarr; Next Round. That's it — no manual reset needed between rounds!
      </GuideTip>
      <GuideTip>
        Players see a connection dot in the header: green = connected, amber = connecting, red = disconnected. If the room is closed, participants are notified automatically.
      </GuideTip>

      <div className="guide__subsection-divider" />
      <h3 className="guide__subsection-title">Input Mode</h3>
      <p className="guide__subsection-desc">
        Instead of buzzing in, participants can type and submit text answers. Great for open-ended questions!
      </p>

      <GuideStep
        number={1}
        title="Collect Answers"
        description="Select 'Collect Answers' from the mode selector. The timer auto-starts and participants see a text field with a live countdown on their device. Colors change from green to yellow to red as time runs out."
        visual={<InputAnswerVisual />}
      />
      <GuideStep
        number={2}
        title="Auto-Open Responses"
        description="When the timer expires, answers are automatically locked and the responses modal opens — no manual clicking needed. Answers are hidden by default — click 'Reveal All' to show them game-show style!"
        visual={<InputRevealVisual />}
      />
      <GuideTip>
        You can use buzzer and input on the same question — award a buzzer point, then click &ldquo;Collect Answers&rdquo; to gather written responses too.
      </GuideTip>
      <GuideTip>
        Participants can browse and edit answers to any previous question using the Q1, Q2, Q3 tabs. Editing is disabled only when you lock or end the quiz.
      </GuideTip>
      <GuideTip>
        Use &ldquo;Clear All&rdquo; in the buzzer overlay to reset all accumulated responses and start fresh.
      </GuideTip>
    </GuideSection>
  );
}
