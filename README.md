# Blueprint project backend

## TODOs

- Add request logging

## Configuration

TODO


## DB

```
npm run typecheck
npm run db:generate -- --name=init
```

```
npm run db:destroy:local
npm run db:migrate:local
npm run db:seed:local
```

## Notes on reqs

- Clinicians can manually choose and assign assessments to patients
- Allows a patient to take a diagnostic screener (a special assessment)
- Scores the patient's response to the screener and automatically assigns assessments

### Endpoints:

#### Assessments

Description: Return requested assessment (in exercise, this is the screener)
Input: Assessment ID

Output:
```
{
  "id": "abcd-123",
  "name": "BPDS",
  "disorder": "Cross-Cutting",
  "content": {
    "sections": [
      {
        "type": "standard",
        "title": "During the past TWO (2) WEEKS, how much (or how often) have you been bothered by the following problems?",
        "answers": [
          {
            "title": "Not at all",
            "value": 0
          },
          {
            "title": "Rare, less than a day or two",
            "value": 1
          },
          {
            "title": "Several days",
            "value": 2
          },
          {
            "title": "More than half the days",
            "value": 3
          },
          {
            "title": "Nearly every day",
            "value": 4
          }
        ],
        "questions": [
          {
            "question_id": "question_a",
            "title": "Little interest or pleasure in doing things?"
          },
          {
            "question_id": "question_b",
            "title": "Feeling down, depressed, or hopeless?"
          },
          {
            "question_id": "question_c",
            "title": "Sleeping less than usual, but still have a lot of energy?"
          },
          {
            "question_id": "question_d",
            "title": "Starting lots more projects than usual or doing more risky things than usual?"
          },
          {
            "question_id": "question_e",
            "title": "Feeling nervous, anxious, frightened, worried, or on edge?"
          },
          {
            "question_id": "question_f",
            "title": "Feeling panic or being frightened?"
          },
          {
            "question_id": "question_g",
            "title": "Avoiding situations that make you feel anxious?"
          },
          {
            "question_id": "question_h",
            "title": "Drinking at least 4 drinks of any kind of alcohol in a single day?"
          }
        ]
      }
    ],
    "display_name": "BDS"
  },
  "full_name": "Blueprint Diagnostic Screener"
}
```


#### Patient assessment answers

Description: Accept a patient's answers to the screener as JSON. Then, score the answers and return the appropriate assessments. "You should store the answer data in the same format as the input..."

Input:
```
{
  "answers": [
    {
      "value": 1,
      "question_id": "question_a"
    },
    {
      "value": 0,
      "question_id": "question_b"
    },
    {
      "value": 2,
      "question_id": "question_c"
    },
    {
      "value": 3,
      "question_id": "question_d"
    },
    {
      "value": 1,
      "question_id": "question_e"
    },
    {
      "value": 0,
      "question_id": "question_f"
    },
    {
      "value": 1,
      "question_id": "question_g"
    },
    {
      "value": 0,
      "question_id": "question_h"
    }
  ]
}
```

Internal data:
```
[
  {
    "question_id": "question_a",
    "domain": "depression"
  },
  {
    "question_id": "question_b",
    "domain": "depression"
  },
  {
    "question_id": "question_c",
    "domain": "mania"
  },
  {
    "question_id": "question_d",
    "domain": "mania"
  },
  {
    "question_id": "question_e",
    "domain": "anxiety"
  },
  {
    "question_id": "question_f",
    "domain": "anxiety"
  },
  {
    "question_id": "question_g",
    "domain": "anxiety"
  },
   {
    "question_id": "question_h",
    "domain": "substance_use"
  },
]

Domain        | Total Score | Level-2 Assessment
Depression    | >= 2        | PHQ-9
Mania         | >= 2        | ASRM
Anxiety       | >= 2        | PHQ-9
Substance Use | >= 1        | ASSIST
```

Output:
```
{
  "results": ["ASRM", "PHQ-9"]
}
```
## Project reqs

1. Instructions for running the code locally (if not hosted)
2. Description of the problem and solution
3. Reasoning behind your technical choices
4. Describe how you would deploy this as a true production app on the platform of your choice:
    1. How would ensure the application is highly available and performs well?
    2. How would you secure it?
    3. What would you add to make it easier to troubleshoot problems while it is running live?
5. Trade-offs you might have made, anything you left out, or what you might do differently if you were to spend additional time on the project
6. Link to other code you're particularly proud of
7. Link to your resume or public profile
