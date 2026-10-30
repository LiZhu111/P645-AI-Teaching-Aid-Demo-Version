import { useEffect, useRef } from "react";
import { VoiceInputButton } from "@/components/VoiceInputButton";
import { FeedbackPanel } from "./FeedbackPanel";
import { AnswerPanel } from "./AnswerPanel";

export function LearningDialoguePanel({
  answer,
  answerAudioStatus,
  answerIsSpeaking,
  answerLoading,
  answerVisible,
  conversation,
  feedbackProps,
  feedbackVisible,
  isListening,
  onAsk,
  onQuestionChange,
  onToggleAnswerAudio,
  onVoiceQuestion,
  question
}) {
  const threadRef = useRef(null);
  const stickToBottom = useRef(true);
  useEffect(() => {
    if (stickToBottom.current && threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [answerLoading, answerVisible, conversation.length]);

  return (
    <section aria-label="Aita learning conversation" className="flex h-[min(58vh,620px)] min-h-[340px] max-h-[calc(100vh-92px)] w-full resize-y flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:h-[min(68vh,720px)] lg:min-h-[460px]">
      <div aria-live="polite" aria-relevant="additions text" className="flex flex-1 flex-col gap-3 overflow-y-auto bg-slate-50/70 px-4 py-5 sm:px-7" onScroll={(event) => { const thread = event.currentTarget; stickToBottom.current = thread.scrollHeight - thread.scrollTop - thread.clientHeight < 40; }} ref={threadRef} role="log">
        {conversation.map((message, index) => {
          const isLatestAnswer = message.role === "assistant" && index === conversation.length - 1 && answerVisible;
          if (isLatestAnswer) {
            return <div className="ml-11 max-w-3xl" key={`${index}-${message.text}`}><AnswerPanel answer={answer} audioStatus={answerAudioStatus} isSpeaking={answerIsSpeaking} onToggleAudio={onToggleAnswerAudio} showAudioControl={false} /></div>;
          }
          return message.role === "user" ? (
            <div className="flex justify-end" key={`${index}-${message.text}`}><div className="max-w-3xl rounded-2xl rounded-tr-sm bg-blue-600 px-4 py-3 text-sm leading-6 text-white">{message.text}</div></div>
          ) : (
            <div className="flex items-start gap-3" key={`${index}-${message.text}`}><span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full bg-emerald-700 text-sm font-black text-white">A</span><div className="max-w-3xl rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 shadow-sm">{message.text}</div></div>
          );
        })}
        {answerLoading ? <div className="flex items-start gap-3"><span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full bg-emerald-700 text-sm font-black text-white">A</span><p className="rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">Looking that up in your course material...</p></div> : null}
      </div>

      <div className="border-t border-slate-200 bg-white p-3 sm:p-5">
        {feedbackVisible ? <div className="mb-4 max-h-72 overflow-y-auto border-b border-slate-200 pb-4"><FeedbackPanel {...feedbackProps} onVoiceInput={null} showAudioControl={false} showAssessmentControls={false} /></div> : null}
        <form className="flex items-end gap-2 rounded-xl border border-slate-300 bg-white p-2 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100" onSubmit={(event) => { event.preventDefault(); onAsk(question); }}>
          <VoiceInputButton activeLabel="Stop" compact idleLabel="Speak" isListening={isListening} onClick={onVoiceQuestion} />
          <label className="sr-only" htmlFor="learning-dialogue-question">Talk to Aita</label>
          <textarea className="max-h-32 min-h-11 min-w-0 flex-1 resize-y border-0 bg-transparent px-2 py-3 text-sm leading-5 outline-none placeholder:text-slate-500 focus:ring-0" id="learning-dialogue-question" onChange={(event) => onQuestionChange(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} placeholder="Ask Aita, or tell it what you'd like to do..." rows={1} value={question} />
          <button aria-label="Send message" className="grid size-10 shrink-0 place-items-center rounded-lg bg-blue-600 text-xl font-bold text-white hover:bg-blue-700" type="submit">↑</button>
        </form>
      </div>
    </section>
  );
}
