# Blueprint project reqs

This doc contains responses to the requested information in the [Blueprint exercise prompt](https://github.com/blueprinthq/coding-exercise).


## Problem description

We work with clinicians who assign their patients standardized clinical assessments.

We need to allow patients to complete these assessments in digital form, creating a persistent record of the data.

This server provides the backend for such an app. It exposes a tailored API that applications can call to store and retrieve assessment data. It also supports automations based on events like a patient submitting an assessment.

A couple items either stated or implied by the prompt:
- Clinicians can manually choose and assign assessments to patients
- A patient may be assigned a special diagnostic screener assessment
- A patient assessment submission may automatically trigger the assignment of other assessments


## Problem solution

Although the prompt is limited in scope, I found it really interesting and was having fun working on it. So, I ended up expanded it to some of the implied aspects. For example, having users, etc.

At a high level, this server is relatively simple. It:

1. Is a node.js app
2. Has a SQL DB to store data persistently
3. Exposes a set of REST APIs
4. Has a light rules engine for automations

The SQL DB contains the structure needed to support things like:

1. Admins
    1. Creating assessments
    2. Configuring automations
2. Care providers
    1. Being assigned or taking on patients
    2. Viewing their case load
    3. Assigning assessments to patients for completion
3. Patients
    1. Viewing their care providers
    2. Viewing assigned assessments
    3. Completing and submitting assigned assessments


## Design choices

Here're some technical design choices and reasoning:

- **SQLite**: Quick to start and relatively easy to swap out for alternative SQL DBs later. I don't have a strong reason for not using no-SQL. I had to make a decision, so went with something familiar and my understanding is that Blueprint uses Postgres.
- **Drizzle**: This is a great module that provides a DB interface that stays close to the DB. ORMs are often heavier than needed and can create a lot of ways to shoot ourselves in our feet. Drizzle supports other SQL DBs, so it should help make it easier to wap SQLite for e.g. Postgres if ever desired.
- **Node.js**: It does the job of running a server well, has a vast ecosystem, is well supported by all the major cloud providers, etc. I also personally enjoy working with JS/TS, making it a natural choice for me.
- **REST**: Quick and simple. Given the nature of the data, I could definitely see GraphQL being useful down the line. But, at this stage it feels like it'd be more overhead than value.

The DB is structured in a way that's meant to be flexible in the functionality it allows for. Key structural elements are:

- Users
- Provider-patient relationships
- Assessments
    - Sections
    - Questions
    - Answer options
- Assessment assignments
- Automation rules

I included a light rules engine to make automations flexible. It should be relatively easy to add new types of automations and triggering events.

If I were to spend additional time, I'd work on items in [TODO.md](./TODO.md). I think a good next step would be deployment because it doesn't feel like there much point of this app if it only runs locally.

There's a lot that needs to be addressed to reach an acceptable deployed state. These are the first 3 things I'd work on:

1. Deploy the app, making it accessible via the open internet
2. Address security basics like accessing via https, proper auth, etc.
3. Automate deployment


## Production

I chose not to spend time on production because I didn't think it would provide much useful signal. I could show that I could get an app deployed, but that'd take away from time that could be spent focused on creatiung a solution for the described scenario.

If we _were_ to build a production app out of this, and reach sufficient scale, here's some stuff I'd evalute doing:

1. Add more unit tests and test coverage reports
2. Add pre-commit hooks to run linting and tests
3. Automate build, test, and deploy
4. Add a logging solution
5. Capture performance metrics (standard, like VM activity, as well custom, like request latency)
6. Set up alerting
7. Develop processes for production investigation, debugging, and resolution (and refine supporting tooling)
    1. Develop restrospective processes for outages and major issues
8. Set up an on-call rotation
9. Establish channels for customers to easily report issues
10. Set up bug tracking
11. Get external security and compliance review
    1. Do internal training, as needed
12. Develop engineering standards
    1. Design review? Code review? Etc.

All of these would require evaluation of benefit, risk, and time requirement, then prioritization. Different choices are appropriate at different stages of a company's life and a product's life.


## Personal links

- Profiles:
    - [LinkedIn](https://www.linkedin.com/in/verespej/)
    - [X](https://x.com/HVerespej)
- Other code:
    - Other code worth seeing is in private repos
    - Feel free to request access and send me your github username
