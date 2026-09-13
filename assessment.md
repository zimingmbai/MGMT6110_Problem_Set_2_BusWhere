## Decide what “good” means, then mark yourself against it

### Front-End
**Usability on a Phone** - Partly Met
- App works on a phone with minimalist layout, so users can get to what they need
- Names are not truncated, hence users do not have to guess their bus stops
- However, the entry point is via bus stops. Hence, it might not be intuitive for someone that only has the bus service number in mind.
- To Test: A user can open the app and see the minimalist layout and information

**Bus Stops and Routes are Accurate** - Partly Met
- The list of bus stops are accurate and can be checked against official websites
- A user opening the app will see that previous bus stops are greyed out, which also validates that they are at the right stop waiting for the bus
- However, some bus services are loop services, and the accuracy of loop services has yet to be checked

**Bus Services are Accurate** - Met
- The timings need to be accurate, or with little variation.
- This is communicated to the user via a tooltip.
- Also, services that are not running will be reflected in the app too
- To Test: Bus 269A from Bus Stop 54009, runs on weekday evenings. A user can verify this by searching in the app, and no timings will be available outside the operating period.

### Back-End
**Service Status** - Partly Met
- A user should ideally have someway to know that the service status of the app is up and running, or there's disruption.
- Currently, they can test this by going to /api/health. However, the information here should be translated more clearly in the app.

**No Exposed Credentials** - Met
- Going into the GitHub Repository, the API key should not be searchable

**Stored Data matches with Real Data** - Met
- The bus stop and bus services data are stored data, instead of API calls.
- Nonetheless, clicking on them still leads to the correct Routes and timings being displayed.
- A user can verify this by tapping through the screen. And storing the data improves efficiency, instead of sending an API call for every click.

## Assess the collaboration, not the tool

### 
**Q1 — Where did the agent make me faster, and by how much**
- The Front-End Prompt built a workable prototype in less than an hour, and I could focus on working on the Back-End right after.
- This saves time as backend was the more challenging aspect, either due to unfamiliarity or external APIs
- Also, asking it to build an api/health was helpful as that saves time from troubleshooting errors by reading through the code

**Q2 — Where did it cost me time, and whose fault was that?**
- The Front-End and Back-End was built with separate prompts. Front-End asked for simulated data. Back-End asked for real data from API.
- This led to a mismatch in both sources - real data was available but it cannot be matched to bus stops because those are simulated data.
- It requires time to figure this out, and eventually take note of this possible scenario when working with APIs
- This feels like an additional step that we have to account for when building. Combining front-end and back-end prompts could be too huge a task, and the output might be more prone to errors.

**Q3 — Did it ever hand me something that looked right and was not?**
- The bus stop data, e.g. bus stop ID and service numbers, were simulated initially and they looked real
- After connecting the API, these bus stop ID actually mapped to real bus stops (although they are 2 separate things)
- This gave the illusion that the app is working well, as the bus timings are populated
- But the bus stops are actually still simulated and the app was not serving its intended purpose

**Q4 — What did I have to know in order to supervise it?**
- To pick out the mismatch, I would have to know about the subject.
- In this case, there would be a bus stop and bus number that I am familiar with. And that helps me cross check the data.
- Someone who build this without the awareness would think that the app is working as expected

**Q5 — Which decisions did I keep, and should I have kept more or fewer?**
- Decisions that I kept
  - Reframing the user question from "show me timings at every stop" to "how long is my ride from A to D"
    - This led to a reduction in API calls - now I don't have to do API calls for every bus stop, instead these bus stops (which should not change frequently) can be stored data. And I just have to call on the timings for selected stops
  - Grouping the bus stops by Area
    - This improved usability - a user does not have to scroll through all the bus stops in SG. If they do not know the bus stop number, they can choose the area that they are located to narrow things down

**Q6 — What does this mean for a team of thirty?**
- Every dataset that was mentioned should be put to a source and verified.
  - It should not be "this looks right", it should be "here is where I got the data from"
  - This will help to tackle the problem in Q3
- Diagnostic Content (e.g. the bus is not in service now) should be based on pre-set rules determined by the team
  - An agent cannot craft the sentence as it does not know how a human interprete this and whether there will be misunderstanding
