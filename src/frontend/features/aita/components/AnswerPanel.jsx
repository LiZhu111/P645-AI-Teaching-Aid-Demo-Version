import Link from "next/link";
import { AudioToggleButton } from "@/components/AudioToggleButton";
import { ActionStatus } from "@/components/ActionStatus";
import { SectionHeader } from "@/components/SectionHeader";
import { appCopy } from "@/config/app-copy";

export function AnswerPanel({ answer, audioStatus, isSpeaking, onToggleAudio, showAudioControl = true }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <SectionHeader
        eyebrow={appCopy.answerPanel.eyebrow}
        title={appCopy.answerPanel.title}
        trailing={<span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-500">{answer.status}</span>}
      />

      {showAudioControl ? <AudioToggleButton
        activeLabel={appCopy.readerActions.stop}
        idleLabel={appCopy.answerPanel.readButton}
        isActive={isSpeaking}
        onToggle={onToggleAudio}
      /> : null}
      {showAudioControl ? <ActionStatus message={audioStatus.message} tone={audioStatus.tone} /> : null}

      <div className="mt-4 leading-7 text-slate-700">
        <p>{answer.body}</p>
        {answer.sourceLinks?.length ? (
          <nav aria-label="Answer sources" className="mt-3 grid gap-2 rounded-lg bg-blue-50 p-3">
            <strong>{appCopy.answerPanel.sourceLabel}:</strong>
            {answer.sourceLinks.map(source => <Link key={source.id} href={source.href} className="text-sm text-blue-900 underline">{source.title}</Link>)}
          </nav>
        ) : answer.source ? (
          <div className="mt-3 border-l-4 border-blue-500 bg-blue-50 p-3 text-sm text-blue-900">
            <strong>{appCopy.answerPanel.sourceLabel}:</strong> {answer.source}
          </div>
        ) : null}
      </div>
    </div>
  );
}
