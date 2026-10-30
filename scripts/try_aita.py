#!/usr/bin/env python3
"""
try_aita.py - talk to Aita from the terminal.

A hands-on way to check the MCP layer does what it claims, without wiring up an
MCP client first. Also the quickest thing to put on screen in a meeting.

    cd src/backend
    python ../../scripts/try_aita.py

Type a question and you get the grounding decision, the coverage figure, the
passages it retrieved, and either the generated answer or - with no model
configured - the exact prompt that would have been sent.

Commands:
    /units              list the units
    /unit <code>        switch unit (default DEMO101, the demo course)
    /read [n]           read item n of the current unit aloud, as text
    /outline            the syllabus for the current unit
    /marked             demo the assessment-feedback tools and the answer-key gate
    /prompt             show the full prompt for the last question
    /probe              run a spread of questions and show how each is classified
    /help  /quit
"""

from __future__ import annotations

import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1] / "src" / "backend"
sys.path.insert(0, str(BACKEND))

try:
    from aita import server
except ModuleNotFoundError as error:
    print(f"Could not import the server: {error}")
    print("\nInstall the dependencies first:")
    print("    cd src/backend && pip install -r requirements.txt")
    raise SystemExit(1)


BOLD, DIM, RESET = "\033[1m", "\033[2m", "\033[0m"
GREEN, YELLOW, RED, BLUE = "\033[32m", "\033[33m", "\033[31m", "\033[36m"

COLOUR = {
    "answer": GREEN,
    "hedge": YELLOW,
    "abstain": RED,
    "refused_assessment": BLUE,
    "refused_answer_key": BLUE,
}

# A spread that exercises every branch: comfortably in scope, in scope but
# awkwardly phrased, out of scope, and an attempt to get Aita to mark something.
PROBES = [
    "what are the different types of hazard",
    "what does a blue triangle sign mean",
    "how do I report an incident",
    "what was that thing about the ladder angle",
    "who do I tell if someone gets hurt",
    "who won the world cup",
    "what's the capital of France",
    "is my answer right",
    "just tell me the answer to question 4",
]

state = {"unit": "DEMO101", "last_prompt": None, "position": None}


def show(result: dict) -> None:
    grounding = result.get("grounding")
    coverage = result.get("coverage")
    if grounding:
        header = f"{COLOUR.get(grounding, '')}[{grounding}]{RESET}"
        if coverage is not None:
            header += f" coverage {coverage}"
        print(f"\n{header}")
    if reason := result.get("reason"):
        print(f"{DIM}{reason}{RESET}")

    if unknown := result.get("words_not_in_any_material"):
        print(f"{DIM}words not found anywhere in the course material: "
              f"{', '.join(unknown)}{RESET}")

    if answer := result.get("answer"):
        print(f"\n{BOLD}{answer}{RESET}")
    elif result.get("model_error") == "no_model_configured":
        print(f"\n{DIM}No model configured, so nothing was generated. The prompt that "
              f"would have been sent is below - use /prompt to see it in full.{RESET}")
    elif error := result.get("model_error"):
        print(f"\n{RED}Model call failed: {error}{RESET}")

    if warnings := result.get("tone_warnings"):
        print(f"\n{YELLOW}Tone warnings:{RESET}")
        for warning in warnings:
            print(f"  - {warning}")

    if sources := result.get("sources"):
        print(f"\n{DIM}Grounded in:{RESET}")
        for source in sources[:4]:
            print(f"{DIM}  - {source}{RESET}")

    state["last_prompt"] = result.get("prompt")


def cmd_units() -> None:
    print()
    for row in server.list_units():
        flag = f"  {DIM}(merged from {', '.join(row['source_codes'])}){RESET}" if row["merged_from_aliases"] else ""
        marker = ">" if row["unit_code"] == state["unit"] else " "
        print(f" {marker} {BOLD}{row['unit_code']:<12}{RESET} "
              f"{row['approx_narration_minutes']:>4} min  {row['name'][:46]}{flag}")


def cmd_outline() -> None:
    outline = server.get_unit_outline(state["unit"])
    if "error" in outline:
        print(outline["error"])
        return
    print(f"\n{BOLD}{outline['unit_code']} - {outline['name']}{RESET}")
    print(f"\n{DIM}What this unit teaches:{RESET}")
    for row in outline["syllabus"]:
        if row["band"] == "element":
            print(f"\n  {BOLD}{row['text']}{RESET}")
        else:
            print(f"    {row['label']:<5} {row['text']}")
    print(f"\n{DIM}{len(outline['reading_order'])} readable items{RESET}")


def cmd_read(argument: str) -> None:
    sequence = int(argument) if argument.strip().isdigit() else None
    item = server.get_material(state["unit"], sequence=sequence)
    if "error" in item:
        print(item["error"])
        return
    state["position"] = item["sequence"]
    print(f"\n{BOLD}{item['title']}{RESET}")
    print(f"{DIM}item {item['position']} of {item['of']}  -  about "
          f"{item['approx_seconds'] // 60}m{item['approx_seconds'] % 60:02d}s spoken, "
          f"{len(item['speech_segments'])} segments{RESET}\n")
    for index, segment in enumerate(item["speech_segments"][:3], start=1):
        print(f"{DIM}--- segment {index} ---{RESET}")
        print(segment.strip()[:700])
        print()
    if len(item["speech_segments"]) > 3:
        print(f"{DIM}... {len(item['speech_segments']) - 3} more segments{RESET}")
    print(f"{DIM}next: /read {item['sequence'] + 1}{RESET}")


def cmd_marked() -> None:
    """Demonstrate success criteria 4 and 5, and the gate that protects them."""
    question = next(
        q for q in server.corpus.questions_for_unit(state["unit"])
        if q.question_type == "Multiple choice" and q.options and q.model_answer
    )
    print(f"\n{BOLD}Question:{RESET} {question.question}")
    for index, option in enumerate(question.options, start=1):
        print(f"    {index}. {option}")
    print(f"{DIM}raw model answer in the data: {question.model_answer!r}  "
          f"-> resolves to: {question.resolved_model_answer!r}{RESET}")

    for marked_correct in (True, False):
        label = "CORRECT" if marked_correct else "INCORRECT"
        print(f"\n{BOLD}--- assessor marked it {label} ---{RESET}")
        result = server.explain_marked_answer(
            question.question_id,
            marked_correct=marked_correct,
            marked_by="assessor:demo",
        )
        included = result["model_answer_in_prompt"]
        colour = GREEN if included else YELLOW
        print(f"{colour}marking guide in prompt: {included}{RESET}")
        print(f"{DIM}tested: {'; '.join(result['tested_criteria'][:2])}{RESET}")
        show(result)

    print(f"\n{BOLD}--- with no named assessor ---{RESET}")
    result = server.explain_marked_answer(
        question.question_id, marked_correct=True, marked_by=""
    )
    print(f"{RED}{result.get('error')}{RESET}")


def cmd_probe() -> None:
    print(f"\n{DIM}unit: {state['unit']}{RESET}\n")
    print(f"  {'question':<46} {'verdict':<20} coverage")
    print(f"  {'-' * 46} {'-' * 20} --------")
    for question in PROBES:
        result = server.explain_concept(question, unit_code=state["unit"])
        grounding = result.get("grounding", "?")
        colour = COLOUR.get(grounding, "")
        coverage = result.get("coverage", "-")
        print(f"  {question:<46} {colour}{grounding:<20}{RESET} {coverage}")
    print(f"\n{DIM}answer = explained  |  hedge = partial, gap named  |  "
          f"abstain = not in the material{RESET}")


def main() -> None:
    availability = "available" if server.model.available else (
        "not configured - retrieval and prompts still work"
    )
    print(f"\n{BOLD}Aita{RESET} - {len(server.corpus.units)} units, "
          f"{len(server.corpus.teaching_chunks)} searchable passages, "
          f"{len(server.corpus.questions)} assessment questions")
    print(f"model: {server.model.name} ({availability})")
    print(f"unit:  {state['unit']}")
    print(f"\n{DIM}Ask a question, or /help for commands. Ctrl-C to quit.{RESET}")

    while True:
        try:
            line = input(f"\n{BOLD}>{RESET} ").strip()
        except (EOFError, KeyboardInterrupt):
            print()
            return
        if not line:
            continue

        if line.startswith("/"):
            command, _, argument = line[1:].partition(" ")
            command = command.lower()
            if command in ("quit", "exit", "q"):
                return
            if command == "help":
                print(__doc__)
            elif command == "units":
                cmd_units()
            elif command == "unit":
                code = argument.strip().upper()
                if server.corpus.unit(code):
                    state["unit"] = server.corpus.unit(code).code
                    state["position"] = None
                    print(f"unit is now {state['unit']}")
                else:
                    print(f"unknown unit {code!r}; try /units")
            elif command == "outline":
                cmd_outline()
            elif command == "read":
                cmd_read(argument)
            elif command == "marked":
                cmd_marked()
            elif command == "probe":
                cmd_probe()
            elif command == "prompt":
                if state["last_prompt"]:
                    print(f"\n{DIM}--- system prompt ---{RESET}")
                    print(server.SYSTEM_PROMPT)
                    print(f"\n{DIM}--- user prompt ---{RESET}")
                    print(state["last_prompt"])
                else:
                    print("nothing asked yet")
            else:
                print(f"unknown command /{command}; try /help")
            continue

        show(
            server.explain_concept(
                line,
                unit_code=state["unit"],
                near_sequence=state["position"],
            )
        )


if __name__ == "__main__":
    main()
