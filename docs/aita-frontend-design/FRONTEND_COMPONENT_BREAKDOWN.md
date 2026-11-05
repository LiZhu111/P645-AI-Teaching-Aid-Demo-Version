# Frontend Component Breakdown

## Overview

The Aita frontend will be divided into reusable React components. The components will handle the presentation and interaction required by the learner, while communication with the application's backend/MCP services will provide material, voice and AI functionality.

## Component Hierarchy

```text
AitaApp
│
├── AppHeader
│   ├── AitaLogo
│   └── Navigation
│
├── HomePage
│   ├── WelcomePanel
│   ├── ContinueLearningCard
│   └── UnitList
│       └── UnitCard
│
├── UnitPage
│   ├── UnitHeader
│   ├── ProgressIndicator
│   │
│   ├── MaterialViewer
│   │   ├── TextViewer
│   │   └── ImageViewer
│   │
│   ├── PlaybackControls
│   │   ├── PlayButton
│   │   ├── PauseButton
│   │   ├── StopButton
│   │   └── PlaybackProgress
│   │
│   └── AskAitaButton
│
├── QuestionPanel
│   ├── MicrophoneButton
│   ├── SpeechInput
│   ├── QuestionPreview
│   └── SubmitQuestionButton
│
├── AnswerPanel
│   ├── AitaResponse
│   ├── AudioControls
│   ├── SourceMaterial
│   ├── ExplainAnotherWayButton
│   └── ContinueButton
│
└── ProgressPage
    ├── UnitProgress
    ├── SectionProgress
    ├── CompletedSections
    └── ContinueLearningButton
```

## Component Responsibilities

| Component                 | Responsibility                                               |
| ------------------------- | ------------------------------------------------------------ |
| `AitaApp`                 | Main application container and application routing           |
| `AppHeader`               | Displays the Aita branding and navigation                    |
| `AitaLogo`                | Displays the Aita logo/brand                                 |
| `Navigation`              | Provides navigation between major areas of the application   |
| `HomePage`                | Displays the main landing page                               |
| `WelcomePanel`            | Provides a simple introduction to the learner                |
| `ContinueLearningCard`    | Shows the learner's current learning position                |
| `UnitList`                | Displays available course units                              |
| `UnitCard`                | Displays an individual unit that can be selected             |
| `UnitPage`                | Main learning interface                                      |
| `UnitHeader`              | Displays the current unit and section                        |
| `ProgressIndicator`       | Shows current progress through the material                  |
| `MaterialViewer`          | Displays the current learning material                       |
| `TextViewer`              | Displays text-based course content                           |
| `ImageViewer`             | Displays images or slide content                             |
| `PlaybackControls`        | Controls the read-aloud functionality                        |
| `PlayButton`              | Starts reading the current material aloud                    |
| `PauseButton`             | Pauses the current narration                                 |
| `StopButton`              | Stops narration                                              |
| `PlaybackProgress`        | Displays narration progress                                  |
| `AskAitaButton`           | Opens the question interface                                 |
| `QuestionPanel`           | Handles the learner's spoken question                        |
| `MicrophoneButton`        | Starts and stops voice recording                             |
| `SpeechInput`             | Handles the learner's spoken input                           |
| `QuestionPreview`         | Displays the transcribed question                            |
| `SubmitQuestionButton`    | Sends the question for processing                            |
| `AnswerPanel`             | Displays Aita's response                                     |
| `AitaResponse`            | Displays the generated explanation                           |
| `AudioControls`           | Allows the learner to listen to the explanation              |
| `SourceMaterial`          | Displays relevant course material associated with the answer |
| `ExplainAnotherWayButton` | Requests a different explanation                             |
| `ContinueButton`          | Returns the learner to the learning material                 |
| `ProgressPage`            | Displays the learner's progress                              |
| `UnitProgress`            | Displays overall unit progress                               |
| `SectionProgress`         | Displays progress through individual sections                |
| `CompletedSections`       | Shows completed sections                                     |
| `ContinueLearningButton`  | Returns the learner to their current learning position       |

## Frontend Responsibilities

The frontend is responsible for:

* Displaying course material.
* Providing navigation between units and sections.
* Providing read-aloud controls.
* Providing spoken-question controls.
* Displaying the learner's transcribed question.
* Displaying Aita's response.
* Allowing the learner to request an alternative explanation.
* Providing audio controls for Aita's response.
* Displaying learning progress.
* Allowing the learner to continue from their current position.

## Backend / MCP Interaction

The frontend will communicate with the MCP server to access Aita's functionality.

```text
┌──────────────────────────────────┐
│      React / Next.js Frontend    │
│                                  │
│  Material UI                     │
│  Read-aloud controls             │
│  Voice input                     │
│  Question UI                     │
│  Answer UI                       │
│  Progress UI                     │
└────────────────┬─────────────────┘
                 │
                 ▼
┌──────────────────────────────────┐
│            MCP Server            │
│                                  │
│  Fetch material                  │
│  Search material                 │
│  Read a passage                  │
│  Process spoken question         │
│  Explain a concept               │
└────────────────┬─────────────────┘
                 │
                 ▼
┌──────────────────────────────────┐
│             AI Pool              │
└──────────────────────────────────┘
```

## Component Interaction Flow

```text
HomePage
   │
   ▼
UnitPage
   │
   ├──── MaterialViewer
   │          │
   │          └── PlaybackControls
   │
   └──── AskAitaButton
              │
              ▼
        QuestionPanel
              │
              ▼
        AnswerPanel
              │
        ┌─────┴───────────┐
        ▼                 ▼
  AudioControls    ExplainAnotherWay
        │                 │
        └────────┬────────┘
                 ▼
            UnitPage
                 │
                 ▼
          ProgressPage
```

## Design Principle

The components are separated according to their responsibilities so that individual parts of the interface can be developed, tested and modified independently.

The frontend provides the learner interaction, while the MCP server provides the capabilities required by Aita.
