# prompts.md - BusWhere
**Student:** Lim Zi Ming · **Course:** MGMT 6110 · **Problem Set 2**

**User sentence:** SG Bus Commuters opens this screen to find the arrival timings of their bus, and knows it worked when they see the next buses timings.

**Live link:** [https://mgmt-6110-problem-set-2-bus-where-5.vercel.app/](https://mgmt-6110-problem-set-2-bus-where-5.vercel.app/)

---

## Prompt 1 - Front-End Master Prompt
```
ROLE: You are a senior front-end developer building a React web app.

GOAL: Build the front end of BusWhere, a web product for everyday bus commuters in Singapore. Their job on this product is "I'm at stop A and I need to get to stop D. How long is that ride, and when do I get there?" Screens:
- FIND MY STOP: One search field at the top that filters as the user types, matching on bus stop code, road name, or landmark. Below it, a list of matching stops; each row shows the stop code, the landmark/stop name, the road name, and the service numbers that stop there as small tappable chips. Before the user types, a one-line hint saying they can search by code, road, or landmark. It worked when typing "Ang Mo Kio" or a five-digit code brings up the right handful of stops, and the services are visible without a second tap.
- RIDE PANEL: Tapping a service chip slides a panel in from the right, over the list. The searched stop becomes the boarding stop, and the panel shows that service's full route in order, in the direction that serves the boarding stop. The boarding stop is highlighted, the panel opens scrolled to it, and it carries the next arrival times for that service. Stops before it are dimmed and not tappable. Every stop after it is tappable and sets the destination; tapping another one moves the destination. With both ends set, the stops between them read as one continuous joined segment, and a bar pinned to the bottom of the panel shows three things side by side: minutes until the bus reaches the boarding stop, ride length in minutes, and the clock time they arrive. Before a destination is picked, that bar prompts them to tap where they're going.
The ride length is not always a firm number and the bar must show which kind it is. When it comes from live arrival times, print it plainly - "26 min ride", "arrive 9:14am". When there are no live times and it had to be worked out from distance, print it softened - "~25 min ride", "arrive around 9:13am" — in the muted text colour. Next to the ride length, always, sits a small info control. Tapping it reveals one short line: for a live number, that it comes from current bus times and traffic can move it; for a worked-out number, that there are no live times for this service right now so the duration is estimated from distance. Tapping anywhere else dismisses it. Tap, not hover - this is a phone.
A close control returns to the list with the search untouched. On a phone the panel covers the full width; on a wider screen it sits on the right and the stop list stays visible. It worked when someone at their stop taps their destination, reads "bus in 4 min · 26 min ride · arrive 9:14am" without doing arithmetic, and can tell at a glance whether that middle number is solid or a guess.
Look: minimalist. Generous white space, one accent colour, no illustrations, no drop shadows, the three numbers in the result bar are the loudest thing on screen.

OUTPUT: A running app. Keep every invented value in ONE data file of its own — at least 40 bus stops and at least 6 services, where each service's route runs through at least 12 of those stops, and most stops sit on more than one service. Every service runs out and back between two different endpoints; no loop services. Every stop on a route carries two things: its arrival times for that service, and how far it sits from the start of the route. At least two services must have empty arrival times all the way along, so the estimated state actually gets built and can be seen. Do NOT store ride durations anywhere. Compute them: subtract one stop's arrival time from another's when both have times, and when they don't, subtract the two distances and divide by an assumed average bus speed kept as a single named value at the top of the data file. One component per screen or section. Move between screens without reloading the page. Readable on a phone at arm's length. When you are done, list the files you created and what each one holds.

GUARDRAILS: Screens and invented data only. Do NOT call the Gemini API or any other model. Do NOT call any outside service or fetch from any URL. No database, no login, no user accounts, no analytics. No map. No features I did not list. No real company's name, logo, or trademark — no bus operator branding. Singapore-style stop codes, road names and landmarks are fine; all timings are invented. Nothing confidential.

CONTEXT: Individual Problem Set 1 for MGMT 6110 Human-AI Collaboration at SMU. Built in Google AI Studio, shared as a link, and opened on a phone by classmates in Week 3. I am not a programmer: when you make a choice I did not specify, say so in one line rather than burying it.
```
**What came back:** A running app, 8 files, preview loaded. 
- It assumed average urban bus speed to 18 km/h and the fallback scheduled wait time to 7 minutes when a service has no live tracking data.

**What I changed next and why:** Push to Git for toolchain setup

---

## Prompt 2 - Push to Git
```
git push [PAT]@https://github.com/zimingmbai/MGMT6110_Problem_Set_2_BusWhere.git
```
**What came back:** Code is committed and pushed

**What I changed next and why:** Start building the back-end

---

## Prompt 3 - Back-End Master Prompt
```
ROLE: You are a senior full-stack developer working in my existing project. Do not rewrite what is already there; add to it.

GOAL: My screen currently shows the bus arrival times in the ride panel — both the "bus in 4 min" figure and "the per-stop times" as a hard-coded value. Replace it with real data from LTA DataMall's Bus Arrival API, fetched through a serverless function of my own.
api/arrivals.js—calls https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival, returns only the fields my screen needs, and nothing else.
i.e. takes a bus stop code as a query parameter, get the service number, the estimated arrival time of each of the next three buses, and each of those buses' reported position
api/health.js—reports whether the credential is configured (keyConfigured) and whether the upstream answered, including the HTTP status it returned. It must never print the credential or any part of it.
On the screen, replace the hard-coded value with the live one, and decide what the user sees in each of these four cases: the data is loading, the data is empty, the upstream refused, and the upstream is unreachable. I want four different sentences, not one spinner.
When the upstream answers but has no arrivals, this is NOT an error - it means no buses are running on that service right now. Fall through to the existing distance-based estimate and show the ride length in its softened form, exactly as the screen already does.
When the upstream refuses, and when it is unreachable, say which of the two happened in one short sentence, then fall through to that same estimate. The screen must stay usable in all three of these cases.

OUTPUT: Both functions at api/ in the PROJECT ROOT, siblings of package.json, never inside src/. If this project has a server entry file, register the same two routes there too, because that is the shape the preview can answer. If it has no server file, skip that and tell me so rather than inventing one.
Make sure package.json contains "type": "module".
The screen calls this function once per bus stop, not once per ride — a ride needs the boarding stop and the destination stop, so that is two separate calls.
BEFORE the fetch, if the credential is missing or empty, return 503 with a message naming the variable, and do not call the upstream at all. A missing variable is sent as the word "undefined" and looks exactly like a wrong credential, so stop it early.
AFTER the fetch, check response.ok before reading the body. A refusal often has an empty body, so calling .json() on it throws and my function dies with a 500 instead of telling me what happened. On a non-2xx reply, return the upstream status and a one-line reason in your own JSON.
Cache the response for 20 seconds with Cache-Control: s-maxage=20, stale-while-revalidate=40, matching how often the source actually changes.
In the footer, credit the source in the exact form the provider's licence asks for.

GUARDRAILS: Never write the credential into any file, comment or README. Never create a variable whose name starts with VITE_. Never call the upstream from browser code; every call happens inside api/. Never print the credential, or any part of it, in a response or a log. No new npm packages. No database, no login. Leave every screen I already have working exactly as it is.

CONTEXT: Deployed on Vercel from GitHub. The credential lives only in a Vercel environment variable named LTA_ACCOUNT_KEY. A real response from the endpoint, called by hand just now, looks like this:
HTTP/1.1 200 OK
Content-Type: application/json;charset=UTF-8
Content-Language: en-US
X-Frame-Options: deny
X-XSS-Protection: 1; mode=block
X-Content-Type-Options: nosniff
Content-Security-Policy: default-src 'none'; script-src 'self'; connect-src 'self';img-src 'self'; style-src 'self'
Content-Length: 11846
Expires: Sun, 13 Sep 2026 02:47:27 GMT
Cache-Control: max-age=0, no-cache, no-store
Pragma: no-cache
Date: Sun, 13 Sep 2026 02:47:27 GMT
Connection: keep-alive
Alt-Svc: h3=":443"; ma=93600
Strict-Transport-Security: max-age=31536000 ; includeSubDomains
Akamai-GRN: 0.6d174b17.1789267647.12835514
```
**What came back:** Edited 9 Files. Implemented the live LTA DataMall Bus Arrival API integration and updated the ride panel
- Serverless Functions (/api/)
- Live Commute Data & Four Distinct State Sentences
- Source Licensing Attribution

**What I changed next and why:** Push to Git to test the results

---

## Prompt 4 - Push to Git
```
git push [PAT]@https://github.com/zimingmbai/MGMT6110_Problem_Set_2_BusWhere.git
```
**What came back:** Code is pushed to GitHub

**What I changed next and why:**
- Bus Stops are still simulated data - the API is getting arrival times based on these simulated bus stops number. Hence, only half the app is accurate
- An API call to get all the data for Bus Stops and Bus Services can be quite a huge task (i.e. every visit to the app will require such a call)
- Hence, we will use a Prompt to create a script that downloads these data and store in Github 

---

## Prompt 5 - Create Script to get Bus Stop and Bus Services Data
```
ROLE: You are a senior full-stack developer working in my existing project. Do not rewrite what is already there; add one temporary file and change how the screens get their data.

GOAL: src/data/busData.ts invents which services serve which stop and what order the stops come in. Everything in it is plausible but fictional, so when live arrival data arrives it never matches and the screen silently falls back to estimates. Replace it with LTA's real data — every bus stop and every service.
Add api/build-data.js, a temporary function I call from my browser and delete afterwards. It takes a ?set= parameter with two possible values:
set=stops pages through LTA's Bus Stops endpoint and returns every stop: code, name, road, latitude, longitude, and the list of services serving it. Derive that service list from Bus Routes, not from arrivals — arrivals only reports services currently running and would miss everything at night.
set=routes pages through Bus Routes and returns, for every service, each direction with its stops in sequence and each stop's distance from the start of that route. Keep only those fields; discard everything else LTA sends.
Both use the $skip parameter, 500 records at a time, until a page returns empty. Send the Content-Disposition: attachment header with filenames stops.json and routes.json, so my browser saves them rather than displaying them.
src/data/busData.ts keeps only AVERAGE_BUS_SPEED_KMH and ASSUMED_SCHEDULED_HEADWAY_MIN at their current values, plus the TypeScript types. The invented arrays go.
The screens fetch instead of importing. FindMyStop loads /stops.json once on mount and searches it in memory. RidePanel loads /routes.json and reads the one service it needs. Both get the same four states the arrival fetch already has — loading, empty, refused, unreachable.

OUTPUT: api/build-data.js at the project root, a sibling of the two functions already there. Read api/arrivals.js and follow its credential handling and error handling exactly rather than inventing a second style.
Bus Routes is tens of thousands of records and Vercel's function timeout is short, so fetch pages in parallel batches of about ten rather than one after another. If set=routes still risks timing out, also accept ?part=1 and ?part=2 so I can pull it in halves, and tell me if I need to use that.
Do NOT import these JSON files anywhere in src/ — they must be fetched at runtime. An import compiles the whole dataset into the browser bundle, which is the thing this change exists to avoid.
Tell me, in order: what to click, where the files land, where to put them in the repo, and what to delete when I'm done.

GUARDRAILS: Never print the credential. Never call LTA from browser code. No new npm packages. Do not touch api/arrivals.js or api/health.js. Do not invent any stop, service, or timing that LTA did not return — if a service comes back with fewer stops than expected, write what LTA gave and note it. Leave every screen working exactly as it is.

CONTEXT: Deployed on Vercel from GitHub. I am not a programmer and have no terminal — everything happens in a browser. When you make a choice I did not specify, say so in one line. A real response from the Bus Stops endpoint, called by hand just now, looks like this:

HTTP/1.1 200 OK
Content-Type: application/json;charset=UTF-8
Content-Language: en-US
X-Frame-Options: deny
X-XSS-Protection: 1; mode=block
X-Content-Type-Options: nosniff
Content-Security-Policy: default-src 'none'; script-src 'self'; connect-src 'self';img-src 'self'; style-src 'self'
Content-Length: 11846
Expires: Sun, 13 Sep 2026 02:47:27 GMT
Cache-Control: max-age=0, no-cache, no-store
Pragma: no-cache
Date: Sun, 13 Sep 2026 02:47:27 GMT
Connection: keep-alive
Alt-Svc: h3=":443"; ma=93600
Strict-Transport-Security: max-age=31536000 ; includeSubDomains
Akamai-GRN: 0.6d174b17.1789267647.12835514
```
**What came back:** 
- Created api/build-data.js: Reusable serverless function matching api/arrivals.js, paging LTA endpoints to download Routes and Stops data

**What I changed next and why:**
- The function works but it triggers concurrent requests to LTA, resulting in a timeout
- Hence, a follow up prompt is used to fetch the data one after another instead, never in parallel

---

## Prompt 5 - Fixing Timeout Issue on build-data.js
```
ROLE: You are a senior full-stack developer working in my existing project. Strictly work on what is mentioned, do not touch other files.

api/build-data.js is returning HTTP 500 from LTA. Fix three things and add one diagnostic.
Fetch pages strictly one after another, never in parallel — DataMall returns 500 under concurrent load. Add a short pause, around 200ms, between requests. If this makes the function exceed Vercel's timeout, use the ?part= parameter to split the work rather than reintroducing concurrency.

Check the endpoint paths. Bus Stops and Bus Routes are at /ltaodataservice/BusStops and /ltaodataservice/BusRoutes with no version prefix. Only the arrival endpoint is versioned — do not carry /v3/ across from api/arrivals.js.
Build the $skip parameter by string concatenation so the dollar sign is not percent-encoded.
When the upstream fails, include the full response body and the exact URL that was called, with the credential removed, in the JSON you return to me. Right now I get a status code and nothing else, so I cannot see what LTA objected to.

GUARDRAILS: Never print the credential. Never call LTA from browser code. No new npm packages. Do not touch api/arrivals.js or api/health.js. Do not invent any stop, service, or timing that LTA did not return — if a service comes back with fewer stops than expected, write what LTA gave and note it. Leave every screen working exactly as it is.

CONTEXT: Deployed on Vercel from GitHub. I am not a programmer and have no terminal — everything happens in a browser. When you make a choice I did not specify, say so in one line. A real response from the Bus Stops endpoint, called by hand just now, looks like this:
HTTP/1.1 200 OK
Content-Type: application/json;charset=UTF-8
Content-Language: en-US
X-Frame-Options: deny
X-XSS-Protection: 1; mode=block
X-Content-Type-Options: nosniff
Content-Security-Policy: default-src 'none'; script-src 'self'; connect-src 'self';img-src 'self'; style-src 'self'
Content-Length: 11846
Expires: Sun, 13 Sep 2026 02:47:27 GMT
Cache-Control: max-age=0, no-cache, no-store
Pragma: no-cache
Date: Sun, 13 Sep 2026 02:47:27 GMT
Connection: keep-alive
Alt-Svc: h3=":443"; ma=93600
Strict-Transport-Security: max-age=31536000 ; includeSubDomains
Akamai-GRN: 0.6d174b17.1789267647.12835514
```
**What came back:**
- Strictly Sequential Paging with 200ms Pause
- Diagnostic Error Response

**What I changed next and why:**
- Manual Steps
  - Download stops.json and routes.json
  - Replace the Files in main/public
  - Delete build-data.js (Because anyone who guesses the URL can send calls to LTA and utilises my quota)
- Improve Usability Slightly
  - Currently it shows whole list of bus stops, and some names are truncated

---

## Prompt 6 - Improve Usability
```
ROLE: You are a senior front-end developer working in my existing project. Do not rewrite what is already there; change one screen and add one small data file.

GOAL: My FIND MY STOP screen puts the stop name and the service chips on the same line, so stops with many services push the name until it truncates. And with real LTA data it now lists thousands of stops, which is unusable before the user types anything. Fix both.

Rebuild each stop row as three stacked lines instead of one: the stop code and full name on the first, the road name on the second, the service chips on the third. The name is never truncated. The chips wrap onto as many lines as they need. Keep the existing chip styling and keep them tappable exactly as they are now.
Add src/data/areas.ts mapping each two-digit bus stop code prefix to a human-readable area label. Generate it by reading public/stops.json in this repo: group every stop by the first two characters of its code, look at the road names and stop names in each group, and write a label from what is actually there. Do not use any knowledge of Singapore geography outside this file. Where a prefix covers more than one recognisable area, use both names separated by a slash. List for me afterwards any prefix you were unsure about, so I can correct it.
When the search field is empty, show the area list instead of the stop list: each area as a tappable row with its label and how many stops it holds. Tapping one shows the stops in that area with a way back. Typing anything searches across all stops as it does today, ignoring the area selection.

OUTPUT: Change src/components/FindMyStop.tsx and add src/data/areas.ts. Nothing else.
Sort areas by label. Sort stops within an area by code.
Keep the four fetch states already handling stops.json exactly as they are.
Readable on a phone at arm's length — this is the main thing it has to survive.
Tell me in one line anything you decided that I did not specify.

GUARDRAILS: Do not touch api/arrivals.js, api/health.js, RidePanel.tsx, or busData.ts. Do not change how stops.json or the route files are fetched. Do not invent any stop, area, road or service that is not in stops.json. No new npm packages. No map. Keep the LTA attribution in the footer.

CONTEXT: Real LTA DataMall data, deployed on Vercel from GitHub. I am not a programmer — when you make a choice I did not specify, say so in one line rather than burying it.
```
**What came back:**
- Categorise Bus Stops into Singapore Areas
- Each Bus Stop has 3 rows - Bus Stop ID/Name, Street Name, Services

**What I changed next and why:**
- Added a Prompt for Data Source Attribution

---

## Prompt 7 - Attribute Data Source
```
Under the header BusWhere, add the following subtext to attribute the data source

Contains information from LTA DataMall datasets from the Land Transport Authority of Singapore (LTA), which is made available under the terms of the Singapore Open Data Licence version 1.0.

Links
- "LTA DataMall" - https://datamall.lta.gov.sg/content/datamall/en.html
- "Singapore Open Data Licence version 1.0" - https://datamall.lta.gov.sg/content/datamall/en/SingaporeOpenDataLicence.html
```
**What came back:**
- Subtext added below BusWhere title

**What I changed next and why:**
- Keep as it is for now. Workable prototype, with room for improvement in user experience.

---

---
## Arbiter Exchange
### Found by both, rated differently

### 1. Unable to Search by Bus Service Number
### Prompt
```
# ROLE

You are a neutral arbiter between two usability reviewers who rated the same problem differently. You do not know which of them built the product. Do not try to work it out.

# CONTEXT

The product is an AI-augmented web app. It is for regular public bus users to find out their buses arrival timings, as well as how long their bus trip will take.

Both reviewers inspected it against Nielsen's ten usability heuristics and rated the problem on this severity scale:

- 0 I don't agree that this is a usability problem at all.
- 1 Cosmetic problem only. Need not be fixed unless extra time is available.
- 2 Minor usability problem. Fixing this should be given low priority.
- 3 Major usability problem. Important to fix, so should be given high priority.
- 4 Usability catastrophe. Imperative to fix before the product can be released.

A rating rests on four factors:

- how often the problem happens
- what it costs when it does
- whether the person can learn around it
- whether it damages the product's standing out of proportion

# REVIEWER A

**Where:** [https://mgmt-6110-problem-set-2-bus-where-5.vercel.app/](https://mgmt-6110-problem-set-2-bus-where-5.vercel.app/) - Homepage

- **What I did, what I saw:**
  - The app requires a user to know their bus stop first, before being able to choose their bus service number to check ETA
  - An entry point directly based on bus number, would be useful
- **Which heuristic:** 7 - Flexibility and Efficiency of Use
- **Screen or system:** Screen
- **Severity, and why:** 2
  - This can be potentially an add-on feature for users
- **The repair:** There can be an option to check bus timings using 2 entry points. i.e. Bus Stop or Bus Service Number

# REVIEWER B

- **Where:** [https://mgmt-6110-problem-s...](https://disq.us/url?url=https%3A%2F%2Fmgmt-6110-problem-set-2-bus-where-5.vercel.app%2F%3AXQRM2bnXc4y8PgYfw_OH-OKToj8&cuid=7870739 "https://mgmt-6110-problem-set-2-bus-where-5.vercel.app/"), on the search page.
- **What I did, what I saw:** I tried to search a bus service e.g. bus 50, and the results return 282 bus stops.
- **Which heuristic:** 6, Recognition Rather than Recall.
- **Screen or system:** Screen. A user has to recall the bus stop name, bus stop code or street name.
- **Severity, and why:** 3. A frequent rider of a particular bus service would recognize the bus service number more than bus stop name or bus stop code.
- **The repair:** Allow user to search by bus service number.

# EVIDENCE NEITHER REVIEWER CONTROLS

- Reviewers who raised this problem independently, counting A and B: 2 out of 4 Reviewers
- Severities that reviewers other than A and B gave this problem: NONE

# GOAL

Judge the evidence, not the reviewers.

1. Say whether A and B describe the same problem. If they do not, say so and stop.
2. For each of the four factors, say what the evidence shows and what it cannot show.
3. Give the severity the evidence supports, and name the factor that decided it.
4. Name the one observation that would change your rating, and say how it could be collected quickly.

# GUARDRAILS

Do not split the difference between A and B unless the evidence puts the rating there. If the evidence is too thin to decide, say so plainly instead of inventing a reason. Do not ask which reviewer built the product.
```

### Response
```
Yes. **A and B are describing the same underlying problem:** the app does not provide an effective **bus-service-number-first path** to arrival information. A frames it as lack of flexibility; B frames it as excessive recall. Those are different heuristic interpretations of the same interaction problem.

## 1. Four severity factors

| Factor | What the evidence shows | What it cannot show |
|---|---|---|
| **Frequency** | **2 of 4 reviewers independently noticed the issue**, so it is not an isolated observation. B also encountered it directly when searching for bus 50. | This does not establish how often real users encounter it. We do not know what proportion of users begin with a bus number rather than a bus stop. |
| **Cost when it happens** | Users who know the bus service but not the stop cannot go directly to the ETA they want. B's example produced **282 bus-stop results**, suggesting potentially substantial search effort. | There is no evidence of actual task failure, time lost, abandonment, or users being unable to obtain the information eventually. |
| **Can users learn around it?** | There appears to be a workaround: identify/search for the relevant bus stop first and then select the service. | We do not know whether ordinary users can do this easily, whether they already know their stop names/codes, or whether they need another app/source to find them. |
| **Damage to product standing** | No evidence supplied. | We cannot infer that this problem materially reduces trust, perceived quality, or willingness to use the product. |

## 2. Supported severity

**Severity: 2 — Minor usability problem.**

The deciding factor is **cost when the problem occurs**.

There is enough evidence to establish genuine friction, so a 0 or 1 is difficult to justify. However, the current evidence does **not** show task failure, severe delay, abandonment, or absence of a workable alternative. That makes a **3 — Major problem** insufficiently supported.

The fact that 2 of 4 reviewers found it independently strengthens confidence that the problem exists, but it does not by itself establish major severity.

## 3. Observation most likely to change the rating

The key observation would be:

**Can representative users who know their bus number but do not know their bus-stop name/code successfully obtain the correct ETA, and how much difficulty does this cause?**

A quick way to collect it would be a short usability test with several regular bus users. Give them a task starting from a known service number but without supplying the stop name/code, and record **task success, time, and whether they need an external source**.

If a substantial proportion cannot complete the task or must leave the app to determine the stop, that would provide evidence for raising the severity to **3**.
```

---
### 2. Unable to Bookmark Bus Stop and Bus Service
### Prompt
```
ROLE: You are a neutral arbiter between two usability reviewers who rated the same problem differently. You do not know which of them built the product. Do not try to work it out.

CONTEXT: The product is an AI-augmented web app. It is for regular public bus users to find out their buses arrival timings, as well as how long their bus trip will take.

Both reviewers inspected it against Nielsen's ten usability heuristics and rated the problem on this severity scale:

- 0 I don't agree that this is a usability problem at all.
- 1 Cosmetic problem only. Need not be fixed unless extra time is available.
- 2 Minor usability problem. Fixing this should be given low priority.
- 3 Major usability problem. Important to fix, so should be given high priority.
- 4 Usability catastrophe. Imperative to fix before the product can be released.

A rating rests on four factors:

- how often the problem happens
- what it costs when it does
- whether the person can learn around it
- whether it damages the product's standing out of proportion

REVIEWER A:

Where: https://mgmt-6110-problem-set-2-bus-where-5.vercel.app/ - Homepage

- What I did, what I saw:
  - For regular users, there is no way to save their bus stop or bus service
  - Hence, they will need to go through multiple taps of the same flow everyday
- Which heuristic: 7 - Flexibility and Efficiency of Use
- Screen or system: Screen
- Severity, and why: 3
  - An elongated and repeated flow to achieve the a straightforward outcome can build up frustration for a user, leading to churn.
- The repair: Include an option for the user to save their frequently used bus stops or bus services. This can even be a dashboard of their selected bus timings.

REVIEWER B:

- **Where**: The search results stop card ("77039 Pasir Ris Int/Mall") and the bus route panel that opens when a service is tapped (e.g. "39B To Pasir Ris Int/Mall")
- **What I did, what I saw**: I searched for my stop by typing its code, 77039, and got "1 stop found": Pasir Ris Int/Mall, with its bus services (39, 39B, 53, 53A, 81, 89, 89A, 109, 518, 518A). I tapped 39B to see its route. Neither the stop card nor the route panel has a star, save, or "add to favourites" option, and the home screen has no recent stops, only the 89-area list. So the next time I want to check the same stop, I have to type the five-digit code again or scroll through the areas to find it. For a commuter who checks the same stop and bus twice a day, every visit repeats the same steps.
- **Which heuristic**: 7. Flexibility and Efficiency of Use
- **Screen or system**: Screen. It can fix this on its own with what it already has: the stop code, stop name and service numbers are already on the page, so the screen can save favourite stops and services in the browser and show them first on the home screen. The system is only needed if favourites should sync across devices, which would require user accounts.
- **Severity, and why**: 2 (minor). Just additional layer. It doesn't stop anyone from getting bus information, but it affects every regular user on every visit, and regular commuters are the app's main audience.
- **The repair**: A returning user reaches their usual stop and bus in one tap. Stops and services can be starred, recent searches appear automatically, and both show at the top of the home screen above the Areas list.

EVIDENCE NEITHER REVIEWER CONTROLS:

- Reviewers who raised this problem independently, counting A and B: 4 out of 4 Reviewers
- Severities that reviewers other than A and B gave this problem: 1 and 3

GOAL: Judge the evidence, not the reviewers.

1. Say whether A and B describe the same problem. If they do not, say so and stop.
2. For each of the four factors, say what the evidence shows and what it cannot show.
3. Give the severity the evidence supports, and name the factor that decided it.
4. Name the one observation that would change your rating, and say how it could be collected quickly.

GUARDRAILS: Do not split the difference between A and B unless the evidence puts the rating there. If the evidence is too thin to decide, say so plainly instead of inventing a reason. Do not ask which reviewer built the product.
```

### Response
```
Yes. **A and B are describing the same underlying usability problem**: returning users cannot save or quickly re-access frequently used stops/services, forcing them to repeat the search/navigation flow. B gives more specific observations, but the problem and heuristic are the same.

| Severity factor | What the evidence shows | What it cannot show |
|---|---|---|
| **How often it happens** | Strong evidence that the issue is readily encountered: **4/4 reviewers independently identified it**. For someone repeatedly checking the same stop/service, the extra interaction recurs whenever they return. | It does not establish how many actual users repeatedly check the same stops, nor how many times per day they do so. The "twice a day" scenario is plausible but not measured evidence. |
| **What it costs when it happens** | The user must repeat search/navigation steps instead of immediately reaching a familiar stop or service. | There is no evidence of task failure, incorrect information, substantial delays, or users being unable to obtain arrival/trip information. The actual additional time and effort have not been measured. |
| **Whether the person can learn around it** | Users can still accomplish the task by remembering a stop code, searching again, or navigating through Areas. Familiarity may make the repeated flow easier. | Learning does **not remove the repeated interaction**. There is no evidence showing whether experienced users find the workaround negligible or persistently frustrating. |
| **Whether it disproportionately damages the product's standing** | All four reviewers noticing it suggests the omission is conspicuous in an app intended for repeat bus use. | There is no evidence supporting A's claim that it causes **churn**, or showing damage to trust, perceived quality, recommendations, retention, etc. |

### Supported severity: **2 — Minor usability problem**

The evidence supports **2**, rather than simply averaging A's 3 and B's 2.

The **deciding factor is the cost when the problem occurs**. The problem can happen repeatedly and is clearly relevant to regular users, which makes it more than merely cosmetic. But the evidence currently shows **additional effort rather than serious task disruption**: users can still obtain the bus information successfully, and there is no measured evidence of substantial delay, abandonment, or downstream consequences.

The unanimous **4/4 detection strengthens confidence that the problem is real**, but agreement that a problem exists does not by itself establish severity 3. The other reviewers' ratings of **1 and 3** also show that its impact is not yet empirically settled.

### One observation that would change the rating

**Observe whether the repeated flow creates substantial real-world cost for returning users—for example, frequent abandonment or a meaningful delay when they need to check a familiar bus quickly.**

A quick way to collect this would be a short repeated-use test with regular commuters: have them retrieve the same familiar stop/service several times, measure completion time and abandonment/frustration, and ask immediately afterward whether the repeated search materially interfered with the task.

If users consistently lose meaningful time, abandon the task, or experience serious difficulty because they cannot save their usual stop/service, I would move the rating to **3**.
```

---

### 3. Long Areas List Scrolling
### Prompt
```
ROLE: You are a neutral arbiter between two usability reviewers who rated the same problem differently. You do not know which of them built the product. Do not try to work it out.

## CONTEXT

The product is an AI-augmented web app. It is for regular public bus users to find out their buses arrival timings, as well as how long their bus trip will take.

Both reviewers inspected it against Nielsen's ten usability heuristics and rated the problem on this severity scale:

- **0** — I don't agree that this is a usability problem at all.
- **1** — Cosmetic problem only. Need not be fixed unless extra time is available.
- **2** — Minor usability problem. Fixing this should be given low priority.
- **3** — Major usability problem. Important to fix, so should be given high priority.
- **4** — Usability catastrophe. Imperative to fix before the product can be released.

A rating rests on four factors:

- how often the problem happens
- what it costs when it does
- whether the person can learn around it
- whether it damages the product's standing out of proportion

## REVIEWER A

**Where:**  
https://mgmt-6110-problem-set-2-bus-where-5.vercel.app/ — Homepage

**What I did, what I saw:**

- The Homepage has a list of area categories.
- This is not exactly helpful, as after selecting the areas, they would still need to scroll through multiple bus stops.
- It can be quite a long list.
- Separately, after selecting an area, typing in the search bar overwrites this decision (i.e. the bus stop list follows the search bar, instead of searching within the area selected).

**Which heuristic:**  
1 — Visibility of System Status

**Screen or system:**  
Screen

**Severity, and why:**  
3

- The app is usable, but is less intuitive.
- A user should be guided on how to use the app (e.g. what is the first step, after which the flow is self-explanatory).
- Currently, it could seem like there are multiple entry points, and the user is confused on which should they use.

**The repair:**  
The list of Areas can be removed. User can use search bar, or filters, to narrow down the list of bus stops directly.

## REVIEWER B

**Where:**  
Home screen, the "Singapore Areas" list below the search box (89 areas, from Aljunied / Geylang East to Yishun)

**What I did, what I saw:**  
The first thing I saw was the Areas list, which looked clean: each row shows the area name, a code prefix and the number of stops. But when I scrolled to find my area, the list kept going through all 89 areas in one long alphabetical column, from Aljunied / Geylang East down to Yishun. There was no A–Z index, no grouping by region (North, East, Central), and no filter within the list, so I had to scroll and read every name. Some areas are split in ways I wouldn't guess, such as "Bedok / Chai Chee" and "Bedok South / Upper Changi," so I couldn't be sure I'd picked the right one without opening both.

**Which heuristic:**  
8 — Aesthetic and Minimalist Design

**Screen or system:**  
Screen. It can fix this on its own with what it already has: the 89 areas and their stop counts are already loaded, so the screen can group them by region, add an A–Z jump index, let the search box filter the list as the user types, and show nearby or recently used areas first. No new data is needed.

**Severity, and why:**  
2 (minor). Users can still search; it's just sometimes an ambiguity problem.

**The repair:**  
A user can reach their area in a few taps without long scrolling. The list is grouped by region or indexed A–Z, filters as the user types, and shows nearby or recent areas at the top. The feedback section can be reached without scrolling past every area.

## EVIDENCE NEITHER REVIEWER CONTROLS

- Reviewers who raised this problem independently, counting A and B: **4 out of 4 reviewers**
- Severities that reviewers other than A and B gave this problem: **1 and 3**

## GOAL

Judge the evidence, not the reviewers.

1. Say whether A and B describe the same problem. If they do not, say so and stop.
2. For each of the four factors, say what the evidence shows and what it cannot show.
3. Give the severity the evidence supports, and name the factor that decided it.
4. Name the one observation that would change your rating, and say how it could be collected quickly.

## GUARDRAILS

- Do not split the difference between A and B unless the evidence puts the rating there.
- If the evidence is too thin to decide, say so plainly instead of inventing a reason.
- Do not ask which reviewer built the product.
```

### Response
```
No. **A and B do not describe the same usability problem closely enough to arbitrate them as one finding.**

Reviewer B identifies a specific problem: **the 89-item "Singapore Areas" list is cumbersome to navigate because it is long, insufficiently structured, and sometimes ambiguously named.**

Reviewer A mentions that same long-list issue, but their severity-3 finding materially includes a second interaction problem: **selecting an area and then using search overrides the area selection**, creating competing entry points and uncertainty about the intended workflow. That search/filter-state behaviour is not part of B's finding.

Because A's rating is based partly on a problem B is not rating, comparing **A = 3** against **B = 2** would not be a valid severity arbitration. The independent severities of **1 and 3** cannot resolve this either, because it is unclear which formulation those reviewers evaluated.

The findings should first be separated into at least:

1. **Long/unstructured area list** — the issue B describes and A partially describes.
2. **Area selection conflicts with search / unclear interaction flow** — the additional issue in A.

Per the instruction to stop if the reviewers are not describing the same problem, the arbitration should stop here rather than manufacture a shared severity.
```

### 4. Unexplained Code/Area Prefix
### Prompt
