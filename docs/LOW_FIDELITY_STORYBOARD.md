# Low-Fidelity Frontend Storyboard / Mockup

## Overview

The low-fidelity storyboard represents the main user journey with Aita. It focuses on the interaction between the learner and the frontend rather than visual styling or detailed UI design.

Aita is designed as a talking study companion that allows learners to listen to course material, ask spoken questions, and receive explanations based on the provided course material.

## Main User Flow

```text
┌─────────────────────┐
│   1. Home Screen    │
│                     │
│  Continue Learning  │
│  Browse Units       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  2. Select Unit     │
│                     │
│  Choose a unit      │
│  to study           │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 3. Learning Screen  │
│                     │
│  View material      │
│                     │
│ [ Read Aloud ]      │
│ [ Ask Aita ]        │
└──────┬────────┬─────┘
       │        │
       │        ▼
       │  ┌──────────────────┐
       │  │ 4. Ask Aita      │
       │  │                  │
       │  │ Speak question   │
       │  │                  │
       │  └────────┬─────────┘
       │           │
       │           ▼
       │  ┌──────────────────┐
       │  │ 5. Aita Answers  │
       │  │                  │
       │  │ Explanation      │
       │  │ [ Play ]         │
       │  │ [ Explain        │
       │  │   Another Way ]  │
       │  └────────┬─────────┘
       │           │
       └───────────┴──────────────┐
                                  ▼
                         ┌─────────────────┐
                         │ 6. Continue     │
                         │    Learning     │
                         └────────┬────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │ 7. Progress     │
                         │    Screen       │
                         └─────────────────┘
```

## Storyboard Screens

### 1. Home Screen

The learner starts at the home screen. They can continue their previous learning session or browse the available course units.

```text
┌─────────────────────────────────┐
│              AITA               │
│   Your talking study companion  │
│                                 │
│  Continue Learning              │
│  ┌───────────────────────────┐  │
│  │ Apply WHS Requirements    │  │
│  │ Progress: 70%             │  │
│  │                           │  │
│  │       [ Continue ]        │  │
│  └───────────────────────────┘  │
│                                 │
│         [ Browse Units ]        │
└─────────────────────────────────┘
```

**User action:** Select `Continue` or browse the available units.

---

### 2. Select Unit

The learner selects a course unit to study.

```text
┌─────────────────────────────────┐
│          Select a Unit          │
│                                 │
│  [ Basic Estimation ]           │
│                                 │
│  [ Construction Materials ]     │
│                                 │
│  [ Tools and Equipment ]        │
│                                 │
│  [ WHS Requirements ]           │
│                                 │
│  [ Plan and Organise Work ]     │
└─────────────────────────────────┘
```

**User action:** Select a unit.

---

### 3. Learning Screen

The learner views the current course material and can have the material read aloud or ask Aita a question.

```text
┌─────────────────────────────────┐
│ ← Back       WHS Requirements   │
├─────────────────────────────────┤
│                                 │
│ Identifying Hazards             │
│                                 │
│ ┌─────────────────────────────┐ │
│ │                             │ │
│ │      Course Material        │ │
│ │                             │ │
│ │  Hazard identification      │ │
│ │  involves identifying...    │ │
│ │                             │ │
│ │          [ Image ]          │ │
│ └─────────────────────────────┘ │
│                                 │
│         [ Read Aloud ]          │
│                                 │
│          [ Ask Aita ]           │
│                                 │
│      [ Previous ] [ Next ]      │
└─────────────────────────────────┘
```

**User action:** Read, listen, or ask Aita a question.

---

### 4. Ask Aita

The learner asks Aita a spoken question about the material.

```text
┌─────────────────────────────────┐
│            Ask Aita             │
│                                 │
│   What would you like to ask?   │
│                                 │
│                                 │
│                                 │
│       [ Hold to Speak ]         │
│                                 │
│  Your question:                 │
│  ┌───────────────────────────┐  │
│  │ What was that thing about │  │
│  │ ladder angle?             │  │
│  └───────────────────────────┘  │
│                                 │
│          [ Ask Aita ]           │
└─────────────────────────────────┘
```

**User action:** Speak their question and submit it.

---

### 5. Aita Answers

Aita provides an explanation based on the course material.

```text
┌─────────────────────────────────┐
│              Aita               │
│                                 │
│  You asked:                     │
│  "What was that thing about     │
│   ladder angle?"                │
│                                 │
│  ┌─────────────────────────────┐│
│  │ Aita's Explanation          ││
│  │                             ││
│  │ The ladder angle is         ││
│  │ important because...        ││
│  └─────────────────────────────┘│
│                                 │
│            [ Play ]             │
│                                 │
│     [ Explain Another Way ]     │
│                                 │
│       [ Continue Learning ]     │
└─────────────────────────────────┘
```

**User action:** Listen to the explanation, request another explanation, or continue learning.

---

### 6. Continue Learning

The learner returns to their course material and continues from their current position.

```text
┌─────────────────────────────────┐
│          Continue Learning      │
│                                 │
│  Current Topic                  │
│  Identifying Hazards            │
│                                 │
│  Progress: 70%                  │
│                                 │
│         [ Continue ]            │
└─────────────────────────────────┘
```

**User action:** Continue studying.

---

### 7. Progress Screen

The learner can view their own progress through the course material.

```text
┌─────────────────────────────────┐
│          My Progress            │
│                                 │
│  CPCCWHS2001                    │
│  Apply WHS Requirements         │
│                                 │
│  Overall Progress: 75%          │
│                                 │
│                                 │
│  ✓ Introduction                 │
│  ✓ Site Hazards                 │
│  ✓ Hazard Identification        │
│  → Safety Procedures            │
│  ○ Final Section                │
│                                 │
│          [ Continue ]           │
└─────────────────────────────────┘
```

**User action:** Review progress and continue learning.

## Overall Interaction

The storyboard demonstrates the following primary interaction:

**Select a unit → View material → Listen to material → Ask Aita → Receive explanation → Continue learning → View progress**
