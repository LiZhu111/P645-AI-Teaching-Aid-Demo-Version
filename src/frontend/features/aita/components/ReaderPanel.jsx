import { useEffect, useRef } from "react";
import { AudioToggleButton } from "@/components/AudioToggleButton";
import { ActionStatus } from "@/components/ActionStatus";
import { appCopy } from "@/config/app-copy";

export function ReaderPanel({
  audioStatus,
  guidedMessage,
  guidedReading,
  isSpeaking,
  material,
  nextTitle,
  onContinue,
  onToggleAudio,
  onToggleGuidedReading,
  speechSegment = 0,
  speechOffset = 0,
  scrollable = false,
  showHeading = true,
  showControls = true,
  placementClassName = ""
}) {
  const articleRef = useRef(null);
  useEffect(() => {
    if (!scrollable || !articleRef.current) return;
    const sentences = [...articleRef.current.querySelectorAll("[data-speech-start]")];
    const activeSentence = sentences.reduce((active, sentence) => Number(sentence.dataset.speechStart) <= speechOffset ? sentence : active, sentences[0]);
    if (activeSentence) {
      const container = articleRef.current;
      const targetTop = container.scrollTop + activeSentence.getBoundingClientRect().top - container.getBoundingClientRect().top - container.clientHeight * 0.38;
      container.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
    }
  }, [scrollable, speechOffset, material.id]);

  return (
    <section id="reader" className={`${showControls ? "min-h-[calc(100vh-90px)] rounded-lg border border-slate-200 bg-white p-5 sm:p-6" : "min-h-0 p-0"} ${placementClassName}`}>
      {showHeading ? <div className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="mb-2 text-xs font-extrabold uppercase text-slate-500">{material.criterion}</p>
          <h2 className={`${scrollable ? "text-xl sm:text-2xl" : "text-3xl"} font-bold leading-tight`}>{material.title}</h2>
        </div>
        {showControls ? <AudioToggleButton
          activeLabel={appCopy.readerActions.stop}
          idleLabel={appCopy.readerActions.read}
          isActive={isSpeaking}
          onToggle={onToggleAudio}
        /> : null}
      </div> : null}
      {showControls ? <ActionStatus message={audioStatus.message} tone={audioStatus.tone} /> : null}
      {showControls && speechSegment > 0 ? <p className="mt-2 text-sm text-slate-500">Resume position saved at paragraph {speechSegment + 1}.</p> : null}

      {showControls ? <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <input checked={guidedReading} className="mt-1" onChange={(event) => onToggleGuidedReading(event.target.checked)} type="checkbox" />
        <span>
          <span className="block text-sm font-bold text-slate-800">Guided reading</span>
          <span className="mt-1 block text-sm leading-5 text-slate-600">After a topic, Aita gives a short recap and listens for a few seconds. If you say nothing, it moves to the next topic.</span>
        </span>
      </label> : null}
      {showControls && guidedMessage ? <p className="mt-3 text-sm text-slate-600" role="status">{guidedMessage}</p> : null}
      {showControls && nextTitle && onContinue ? (
        <button className="mt-4 min-h-10 rounded-lg border border-blue-600 px-4 text-sm font-bold text-blue-700 hover:bg-blue-50" onClick={onContinue} type="button">
          Continue to {nextTitle} <span aria-hidden="true" className="ml-1">→</span>
        </button>
      ) : null}

      <article ref={articleRef} className={`${showHeading ? "mt-5" : ""} max-w-3xl text-[17px] leading-7 text-slate-700 ${scrollable ? "h-full min-h-0 overflow-y-auto overscroll-contain pr-3" : ""}`}>
        {material.text.map((paragraph, index) => {
          const paragraphStart = material.text.slice(0, index).reduce((total, item) => total + item.length + 1, 0);
          const sentenceEnds = [...paragraph.matchAll(/[.!?]+(?:["'”’»)]*)\s+/gu)].map((match) => match.index + match[0].length);
          const sentenceStarts = [0, ...sentenceEnds];
          const sentenceRanges = sentenceStarts.map((start, rangeIndex) => ({ start, end: sentenceStarts[rangeIndex + 1] ?? paragraph.length })).filter(({ start, end }) => start < end);
          return <p className="mb-4 last:mb-0" key={`${material.id}-${index}`}>
            {sentenceRanges.length ? sentenceRanges.map(({ start, end }) => <span data-speech-start={paragraphStart + start} key={`${material.id}-${index}-${start}`}>{paragraph.slice(start, end)}</span>) : <span data-speech-start={paragraphStart}>{paragraph}</span>}
          </p>;
        })}
      </article>
    </section>
  );
}
