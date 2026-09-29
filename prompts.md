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
```
# Usability Heuristic Severity Arbitration

## Prompt

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

### REVIEWER A

- Where: https://mgmt-6110-problem-set-2-bus-where-5.vercel.app/ - Homepage
- What I did, what I saw:
  - The area categories have a Code Prefix
  - This is not relevant to a real-world user, and is only an identifier for the backend.
  - Hence, it is unnecessary info which does not help the user
- Which heuristic: 2 - Match Between the System and the Real World
- Screen or system: Screen
- Severity, and why: 2
  - The app's usability is not affected
  - This is mainly aesthetic.
- The repair: Remove the Code Prefix line

### REVIEWER B

- **Where**: Home screen, the "Code prefix" line under every area in the Singapore Areas list (e.g. "Ang Mo Kio · Code prefix 54")
- **What I did, what I saw**: While scrolling through the Areas list, I noticed every area shows a "Code prefix" (81, 54, 50, and so on). Nothing on the page explained what it meant. I eventually guessed it was the first two digits of the stop codes in that area, but only because the search box mentions searching "by code." There's no tooltip, help link, or example showing how stop codes work, even though the app relies on them for searching. The only explanatory text at the top is the LTA DataMall licence notice, which explains where the data comes from, not how to use it.
- **Which heuristic:** 10. Help and Documentation
- Screen or system: Screen. It can fix this on its own with what it already has: the meaning of a code prefix is fixed, so a short tooltip or a one-line note ("Stop codes are the 5-digit number on every bus stop sign; the first two digits show the area") needs no new data.
- **Severity, and why**: 1 (cosmetic). The driver is low impact: users who ignore the prefix can still pick an area by name, but those who don't understand stop codes miss a faster way to search, and the unexplained label adds clutter to all 89 rows.
- **The repair**: A user understands what a code prefix is and how it helps them. The screen explains stop codes briefly, ideally with an example from a real bus stop sign, and links that explanation to the search box so users learn they can type a stop code directly.

### EVIDENCE NEITHER REVIEWER CONTROLS

- Reviewers who raised this problem independently, counting A and B: 2 out of 4 Reviewers
- Severities that reviewers other than A and B gave this problem: NONE

## GOAL

Judge the evidence, not the reviewers.

1. Say whether A and B describe the same problem. If they do not, say so and stop.
2. For each of the four factors, say what the evidence shows and what it cannot show.
3. Give the severity the evidence supports, and name the factor that decided it.
4. Name the one observation that would change your rating, and say how it could be collected quickly.

## GUARDRAILS

Do not split the difference between A and B unless the evidence puts the rating there. If the evidence is too thin to decide, say so plainly instead of inventing a reason. Do not ask which reviewer built the product.
```

### Response
```
Yes. **A and B are describing the same underlying problem**: the homepage repeatedly displays a **“Code prefix”** beside each area without a clear user-facing purpose. They disagree about the interpretation and repair—A says remove it; B says explain it—but the observed UI issue is the same.

| Factor | What the evidence shows | What it cannot show |
|---|---|---|
| **How often it happens** | The label appears under every area, reportedly across all 89 rows. Two of four reviewers independently noticed it. So whenever someone browses this list, the issue is repeatedly present. | We do not know how often real users browse the Areas list, notice the prefix, or try to understand it. “2 of 4 reviewers” measures evaluator detection, not user frequency. |
| **What it costs when it happens** | The demonstrated cost is low. Users can still select an area by name and continue their task. At most, the evidence supports visual clutter or failure to understand a potentially quicker code-based search method. | There is no evidence of task failure, significant delay, wrong bus information, navigation errors, or users abandoning the app because of it. |
| **Whether users can learn around it** | Users can apparently ignore the prefix completely and still use the area names. B was also able to infer its meaning from other interface cues. | We do not know whether ordinary users would make the same inference, how long that would take, or whether they would remember it later. |
| **Whether it disproportionately damages the product's standing** | No evidence shows reputational or trust damage. Technical-looking unexplained information could make the interface feel less polished, but that is all the supplied evidence establishes. | We cannot conclude that users perceive the app as unreliable, confusing, or unprofessional because of this label. |

## Supported severity: 1 — Cosmetic problem

The deciding factor is **cost when it happens**. The evidence does not demonstrate meaningful interference with the user's core tasks of finding a bus or its journey/arrival time. The information can be ignored without blocking progress. The repeated clutter is real, but repetition alone does not raise severity without evidence of consequential confusion or task degradation.

The evidence therefore supports **1 rather than 2**. A severity of 2 would need some observable minor usability consequence beyond visual or explanatory clutter.

## One observation that would change the rating

The most useful observation would be:

**Real users hesitate, make errors, or take noticeably longer because they misunderstand “Code prefix,” especially when trying to find a stop by code.**

This could be collected quickly with a small usability test: give roughly **5 users a task such as “Find this bus stop using its stop code”**, without explaining the interface, and observe whether the prefix causes confusion, incorrect actions, or measurable delay.

If that behaviour occurs consistently, there would be evidence for raising the issue to **severity 2**.
```

---
### Found by them, missed by me

### 1. Bus Service Not Available. But Trip Duration Still Visible
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

- Where: https://mgmt-6110-problem-set-2-bus-where-5.vercel.app/, on the section showing the route for selected bus service (right screen).
- What I did, what I saw: I selected bus 89A that does not run on weekend.
- Which heuristic: 4, Consistency and Standards
- Screen or system: Screen. There is a message below the boarding stop that tell user no buses are running on the selected service right now, but it still tells the user estimated bus arrival, ride length and estimated time to destination at the bottom.
- Severity, and why: 3, two results provide conflicting message to user.
- The repair: Provide no estimation for the selected bus service when it is not in service.

REVIEWER B:

- Where: At the screen to check the bus ETA and trip duration
- What I did, what I saw: If a bus does not have service currently, there is still an ETA and trip duration
- Which heuristic: 4 - Consistency and Standards
- Screen or system: Screen. The data is clear, but it is not presented clearly to the user
- Severity, and why: 3
  - A user can be reasonably confused when they check the bus timings.
- The repair: If there are no available services upcoming, say so and do not populate numbers like ETA

EVIDENCE NEITHER REVIEWER CONTROLS:

- Reviewers who raised this problem independently, counting A and B: 1 out of 3 Reviewers
- Severities that reviewers other than A and B gave this problem: NONE

GOAL: Judge the evidence, not the reviewers.

1. Say whether A and B describe the same problem. If they do not, say so and stop.
2. For each of the four factors, say what the evidence shows and what it cannot show.
3. Give the severity the evidence supports, and name the factor that decided it.
4. Name the one observation that would change your rating, and say how it could be collected quickly.

GUARDRAILS: Do not split the difference between A and B unless the evidence puts the rating there. If the evidence is too thin to decide, say so plainly instead of inventing a reason. Do not ask which reviewer built the product.
```

### Response
```
Yes. **A and B describe the same usability problem**: when a selected bus service is not currently operating, the interface simultaneously says there are no buses running and still displays ETA/trip estimates.

| Severity factor | What the evidence shows | What it cannot show |
|---|---|---|
| **How often it happens** | The condition exists at least for a service such as 89A when it is outside its operating period. Only **1 of 3 reviewers independently raised it**. | This does not tell us how frequently actual users select unavailable services, or whether the contradiction occurs for every unavailable service. |
| **What it costs when it happens** | The contradiction concerns the product's core task: deciding when a bus will arrive and how long the journey will take. The displayed ETA can reasonably be interpreted as an upcoming bus even though none is operating. | There is no observed evidence that a user actually waited for a nonexistent bus, missed another service, or otherwise suffered a significant consequence. |
| **Whether users can learn around it** | A "no buses are running" message is present, so the correct information is available on the screen. | We do not know whether users notice that message, which of the conflicting outputs they trust, or whether repeated use teaches them to ignore the ETA. |
| **Whether it disproportionately damages the product's standing** | Contradictory information about bus availability could undermine confidence in the reliability of the ETA feature. | There is no evidence about users' subsequent trust in the app, abandonment, or perceptions of the product overall. |

### Severity supported: **3 — Major usability problem**

The deciding factor is **the cost when it happens**.

This is not merely unclear formatting. The screen presents an apparently actionable ETA for a bus that the same screen says is not operating. Because arrival timing is one of the application's principal purposes, that contradiction can directly lead to an incorrect travel decision. That makes it important enough to fix with high priority.

The evidence does **not** support severity 4: there is no indication that the product becomes broadly unusable, that recovery is impossible, or that release should be blocked by this issue alone.

### Observation most likely to change the rating

Observe **whether users treat the displayed ETA as a real upcoming bus after seeing this screen**.

A quick test would be to give several users the out-of-service 89A scenario and ask:

> "Based on this screen, what would you do next?"

Do not point out the contradiction. If users consistently recognize that no bus is coming and disregard the ETA, I would lower the rating to **2**. If users interpret the ETA as meaning a bus will arrive and choose to wait, the **3** rating is strongly confirmed.
```

### 2. Confusion between Bus Stop Code and Postal Code
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

- Where: https://mgmt-6110-problem-set-2-bus-where-5.vercel.app/, search box at the top.
- What I did, what I saw: I typed 188065 (the postal code for SMU) and pressed search. I only worked out by inferring that the box needs a bus stop code, not a postal code.
- Which heuristic: 9, Help Users Recognize, Diagnose, and Recover from Errors.
- Screen or system: Screen. The page already knows the search returned zero results and that I typed 6 digits, which is enough to show a helpful message.
- Severity, and why: 2, driven by how often it happens. In Singapore "code" usually means postal code, so many first-time visitors will try one and hit a blank screen with no way forward. It could take a big long for those who are new to Singapore.
- The repair: When a search finds nothing, the screen suggests e.g. "No match. Bus stop codes have 5 digits, e.g. 01012. You might have input six-digit post code. You can also search by road name." Or a visitor can search by bus number and pick up one she knows is close to her.

REVIEWER B:

- Where: When using the search box
- What I did, what I saw: It does not indicate what is the code to input, the number of digits or characters accepted
- Which heuristic: 5 - Error Prevention
- Screen or system: Screen. The data is present, but users must be guided to perform the correct action
- Severity, and why: 2
  - A user can use other search methods to obtain the ETA, but they will face an unhappy path when doing the above.
- The repair: Be clear on what are the accepted values.

EVIDENCE NEITHER REVIEWER CONTROLS:

- Reviewers who raised this problem independently, counting A and B: 1 out of 3 Reviewers
- Severities that reviewers other than A and B gave this problem: NONE

GOAL: Judge the evidence, not the reviewers.

1. Say whether A and B describe the same problem. If they do not, say so and stop.
2. For each of the four factors, say what the evidence shows and what it cannot show.
3. Give the severity the evidence supports, and name the factor that decided it.
4. Name the one observation that would change your rating, and say how it could be collected quickly.

GUARDRAILS: Do not split the difference between A and B unless the evidence puts the rating there. If the evidence is too thin to decide, say so plainly instead of inventing a reason. Do not ask which reviewer built the product.
```

### Response
```
## 1. Are A and B describing the same problem?

**Yes.**

They describe the same underlying usability problem: **the search field does not make clear what kind of “code” it accepts, so a user can reasonably enter a six-digit postal code and reach an unsuccessful search without adequate guidance.**

The heuristic labels differ because they focus on different points in the same failure path:

- **B — Error Prevention:** the interface should clarify acceptable input before the user searches.
- **A — Error Recovery:** after the invalid search occurs, the interface should explain what went wrong and how to recover.

That difference does not make them separate problems.

## 2. The four severity factors

| Factor | What the evidence shows | What it cannot show |
|---|---|---|
| **How often it happens** | At least one reviewer encountered the ambiguity. Only **1 of 3 reviewers independently raised the problem**, so there is limited evidence that it is frequent. | There is no user-testing evidence showing how many actual bus users would interpret “code” as postal code or otherwise enter an unsupported value. A's statement that many first-time users will do so is plausible, but not demonstrated by the supplied evidence. |
| **What it costs when it happens** | The user can get zero results and receive insufficient information about why. This creates confusion and delays the task. B also reports that other search methods can still be used. | There is no evidence of the typical time lost, whether users abandon the task, or whether they ultimately fail to obtain an ETA. |
| **Whether the person can learn around it** | The evidence points toward the problem being **recoverable**. A was able to infer that a bus-stop code was required, and B identifies alternative search methods. | We do not know whether ordinary first-time users would make the same inference, how long recovery takes, or whether they would remember the requirement next time. |
| **Whether it damages the product's standing disproportionately** | Nothing supplied indicates disproportionate reputational damage. | There is no evidence about trust, perceived AI reliability, user satisfaction, or whether users interpret the failed search as the product itself being unreliable. |

## 3. Supported severity

**Severity: 2 — Minor usability problem.**

The deciding factor is **learnability/recoverability**.

The problem is more than cosmetic: it can put a user onto an unsuccessful path and gives insufficient guidance about what went wrong. That supports at least a 2 rather than a 1.

However, the available evidence indicates that users **can potentially recover or use another search route**, and there is no evidence of repeated task failure, abandonment, serious consequences, or an inability to proceed. That does not support a 3 on the evidence currently available.

The **1-of-3 reviewer incidence should not be treated as proof that the problem is rare among users**; three heuristic reviewers are too small and unlike actual usage data to establish frequency.

## 4. Observation that could change the rating

The most useful observation would be:

**Can first-time users who encounter this exact zero-result state recover without assistance?**

A quick test could give several first-time users a realistic task such as finding the arrival time for a bus near a known Singapore postal code. For anyone who enters the six-digit postal code, observe whether they can identify the problem and successfully continue **without prompting**.

If users who reach this state commonly become stuck, abandon the task, or require assistance, that would provide evidence for increasing the severity to **3**. If they consistently understand and recover almost immediately, the case for **2** would weaken.
```

### 3. Different Search Results in Area Category vs Search Bar
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

- Where: https://mgmt-6110-problem-set-2-bus-where-5.vercel.app/ the home page area list and the search results page.
- What I did, what I saw: On the home page, Balestier / Novena shows 51 stops. When I searched "balestier", the app said "16 stops found", but the list below it seemed to show more than 16 stops. It appears each of these goes by different definition of “Balestier”
- Which heuristic: 4, Consistency and Standards.
- Screen or system: [see screenshot]
- Severity, and why: 2, driven by the damage to the product's standing. When the numbers don't match, I stop trusting the other numbers in the app, including the arrival times.
- The repair: The same area shows the same stop count everywhere, and the "stops found" number matches the list shown. If the area and the search count different things, the screen says what each one counts.

REVIEWER B:

- Where: the search results
- What I did, what I saw: Typing Balester in the search bar shows matching road names or bus stop names, however the Balester in Area categories refer to potentially URA planning areas, which could have a wider range of bus stop results
- Which heuristic: 4 - Consistency and Standards
- Screen or system: Screen. The data is present, the filtering is based on differing criterias
- Severity, and why: 2
  - The app is usable, but it does not explain the criteria of the search function
- The repair: Have clear documentation and indicators on the various search options and their mechanics

EVIDENCE NEITHER REVIEWER CONTROLS:

- Reviewers who raised this problem independently, counting A and B: 1 out of 3 Reviewers
- Severities that reviewers other than A and B gave this problem: NONE

GOAL: Judge the evidence, not the reviewers.

1. Say whether A and B describe the same problem. If they do not, say so and stop.
2. For each of the four factors, say what the evidence shows and what it cannot show.
3. Give the severity the evidence supports, and name the factor that decided it.
4. Name the one observation that would change your rating, and say how it could be collected quickly.

GUARDRAILS: Do not split the difference between A and B unless the evidence puts the rating there. If the evidence is too thin to decide, say so plainly instead of inventing a reason. Do not ask which reviewer built the product.
```

### Response
```
Yes. **A and B are describing the same underlying problem**: the app appears to use different scopes or definitions for “Balestier” in the area category and in search results, without making that distinction clear. A emphasizes the resulting count inconsistency; B emphasizes the unexplained filtering criteria.

| Factor | What the evidence shows | What it cannot show |
|---|---|---|
| **How often it happens** | It occurred for the Balestier case. The independent-review evidence says only **1 of 3 reviewers** raised it. | Whether this happens for many area/search terms, or only Balestier. There is no systematic test across other areas. |
| **What it costs when it happens** | It can cause confusion about what the counts represent and whether the displayed results are complete. | There is no evidence that users fail to find a bus, receive incorrect arrival times, choose the wrong route, or cannot complete their task. |
| **Whether the person can learn around it** | The app remains usable: users can inspect search results and use area categories separately. The distinction could potentially be learned through repeated use. | There is no evidence from actual users showing whether they understand the distinction, how quickly they learn it, or whether they continue making mistakes. |
| **Whether it damages the product's standing disproportionately** | Contradictory-looking counts can plausibly reduce confidence in the interface, particularly because this is an information service. | The evidence does not establish that users generalise that doubt to arrival-time accuracy. A's statement that they would stop trusting other numbers is one reviewer's reaction, not evidence of a broader effect. |

### Severity supported: **2 — Minor usability problem**

The deciding factor is **cost when it happens**. The evidence establishes ambiguity and apparent inconsistency, but not task failure or materially wrong transport decisions. That supports fixing it, but does not support severity 3 on the available evidence.

The **1-of-3 occurrence evidence** reinforces that conclusion, but is too small a sample to establish that the issue is rare.

### One observation that would change the rating

Determine whether **“16 stops found” literally disagrees with the number of stops that the search results actually contain**, rather than merely differing from the broader area-category count.

This can be checked quickly: search **“Balestier”**, record the reported result count, and count the unique bus-stop results actually displayed (including any results revealed by scrolling/pagination).

- If the interface says **16** while actually presenting materially more than 16 qualifying results, that is a genuine internal contradiction rather than merely unexplained search scope. I would reconsider it toward **severity 3**, because users cannot reliably interpret the system's own result state.
- If the **16 exactly matches the search results**, while the area's **51** refers to a different geographic grouping, the evidence remains consistent with **severity 2**: principally a labeling/explanation problem.
```

### 4. Unable to Translate Postal Code into Nearby Bus Stops
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

- Where: https://mgmt-6110-problem-set-2-bus-where-5.vercel.app/ homepage search
- What I did, what I saw: When I imagine I'm not standing at the stop, I don't know its code or the exact road name. I have to open Google Maps first to find it, and only then could I use this app.
- Which heuristic: 7, Flexibility and Efficiency of Use.
- Screen or system: System. The page cannot turn a postal code or my location into nearby stops by itself, so it would need a lookup such as OneMap in the back end.
- Severity, and why: 3, driven by to whom it happens. Anyone planning a fixed route daily close to the start point doesn’t experience this issue. But if someone isn’t familiar with the start area, he has to open another app first.
- The repair: A visitor can find a stop without knowing its code, e.g. by postal code, by current location, or from saved favourite stops. Or a visitor can search by bus number and pick up one she knows is close to her.

REVIEWER B:

- Where: the search results
- What I did, what I saw: The app requires some knowledge of the public bus service in SG (e.g. bus stops, roads or bus service numbers). if i don't know about this (e.g. a tourist), then i would have difficulty navigating.
- Which heuristic: 7 - Flexibility of Use
- Screen or system: System. I might need to correlate my location, e.g. postal code, to the nearby bus stops available
- Severity, and why: 3
  - This can expand my use case to a new segment of users
- The repair: Being able to search nearby bus stops by postal code

EVIDENCE NEITHER REVIEWER CONTROLS:

- Reviewers who raised this problem independently, counting A and B: 1 out of 3 Reviewers
- Severities that reviewers other than A and B gave this problem: NONE

GOAL: Judge the evidence, not the reviewers.

1. Say whether A and B describe the same problem. If they do not, say so and stop.
2. For each of the four factors, say what the evidence shows and what it cannot show.
3. Give the severity the evidence supports, and name the factor that decided it.
4. Name the one observation that would change your rating, and say how it could be collected quickly.

GUARDRAILS: Do not split the difference between A and B unless the evidence puts the rating there. If the evidence is too thin to decide, say so plainly instead of inventing a reason. Do not ask which reviewer built the product.
```

### Response
```
Yes. **A and B describe the same underlying usability problem**: users who do not already know a relevant bus stop, road, or service cannot easily translate their current/intended location into a usable starting point within the app. Both propose essentially the same repair: location/postal-code-based discovery of nearby stops.

| Factor | What the evidence shows | What it cannot show |
|---|---|---|
| **How often it happens** | The problem occurs mainly when users are **unfamiliar with the starting area or its bus stops**. The independent-review evidence is weak: only **1 of 3 reviewers** surfaced the problem independently. | It does not tell us how often real users are unfamiliar with their starting area, or what proportion of searches fail because of this. Reviewer incidence is not the same as user incidence. |
| **What it costs when it happens** | The user may need to leave the app, use something such as Google Maps to identify a stop, then return. That introduces extra effort and could interrupt the task. | There is no evidence that users become completely unable to complete the task, make serious errors, or abandon it. The actual time/effort penalty has not been measured. |
| **Whether the person can learn around it** | There is a clear workaround: find the stop externally, learn the road/stop code, or rely on familiar stops/routes. Regular users may avoid the problem entirely for habitual journeys. | We do not know how readily first-time users discover that workaround or whether they are willing to tolerate it. |
| **Whether it damages the product's standing disproportionately** | It may make the app seem less useful for unfamiliar journeys or unfamiliar users. | There is **no evidence** of disproportionate reputational or trust damage. Neither reviewer reports users rejecting the product because of it. |

### Supported severity: **2 — Minor usability problem**

The deciding factor is **learnability/workaround**. The problem creates real friction, but the available evidence shows a recoverable extra step rather than a blockage of the core task. The evidence for frequency is also too thin to justify elevating it to a major problem solely because tourists or unfamiliar users could encounter it.

The reviewers' proposed **3** could be justified if this obstacle frequently prevents a meaningful proportion of intended users from starting their journey search, but the supplied evidence does not establish that.

### One observation that would change the rating

Observe **whether users who do not know their nearby bus stop can successfully begin a journey search without leaving the app**.

A quick test would be to give 5–8 participants an unfamiliar starting location such as a postal code or landmark and ask them to find the next suitable bus using only this app. Record whether they succeed, leave the app, or abandon the task. If a substantial proportion cannot proceed or must leave the app, that would support raising the severity to **3**.
```

## Problem Set 4

### Prompt 1 - Repair Data Reliability and Correctness
```
ROLE: You are a skeptical senior developer and usability reviewer working in my existing project. Before you write any code, your job is to argue against the repair I propose.

CONTEXT:
Live address: https://mgmt-6110-problem-set-2-bus-where-5.vercel.app/
Who the product is for, and what it does for them: The product is for regular public bus users, to know the arrival timings of buses and the duration of their bus trip.
The finding:
What I did, what I saw:
- Typed in the Search Bar > Tapped the Bus Service Number > Looked at the Bus Arrival Timings
- The Timings does not Auto-Refresh
- It seems static, which can quickly become outdated as the data refreshes
Which heuristic: 1 - Visibility of System Status
Screen or system: System
Severity, and why: 4/4
- The function of the app is greatly limited, as the ETA shown can easily be outdated
- A user is not being warned about this, and would have to encounter an unhappy episode before realising
- Even if they are aware, they would have to repeatedly tap on the service number to get updated timings
The repair:
- Part 1: When checking the bus timings, there is a button that countdown 20 seconds, after which a user can tap on it to refresh the bus arrival timings. Then another 20 seconds countdown will start, following a similar flow.
- Part 2: Currently the arrival timing might show 0min, we need to be clearer. We need to confirm the LTA data. If the bus has not arrived, it should show "Arriving". This allows the user to know if the bus has arrived or could have left.
- Part 3: If the selected service is not running currently, the "Boarding" tag should be changed to "No Service" instead. Similarly, the data on estimated bus arrival, ride length and estimated time to destination should be "Not Available". This is to minimise confusion for the users.

The evidence behind it: 2 out of 4 group members shared this

GOAL: Argue against my repair.
- Does it solve the problem the finding describes, or a problem I already believed I had? Say which, and why.
- Does the problem belong to the screen or to the system, and does my repair sit in the right half?
- Name one heuristic this repair could break while it serves the one above, and how.
- Propose the smallest alternative that would make the same thing true.
- Tell me exactly what to do on the live address to check that the repair worked.

OUTPUT: Your arguments first, as a numbered list. Then stop. Write no code until I reply with the repair I have chosen.

GUARDRAILS: Do not tell me the repair is good. If you have no strong reason to doubt it, say so plainly instead of inventing one. When I do ask you to build, change only what the repair needs. Do not remove Disqus or the privacy notice, and do not break /api/health.
```
### Response 1
```
Here is the usability and engineering critique of the proposed repair:

1. Does it solve the problem the finding describes, or a problem you already believed you had?
It solves a problem you already believed you had, while bundling in unrelated scope.
The core finding is simple: arrival timings feel static, do not auto-refresh, and go stale without user warning.
Part 1 does not fix stale timings automatically—instead of solving freshness, it pushes the labor onto the commuter by forcing them to watch a 20-second timer and tap a manual button. Furthermore, a lockout/cooldown button contradicts the finding that having to repeatedly tap is painful.
Parts 2 and 3 (replacing "0 min" with "Arriving", and handling "No Service" states) are edge-case data formatting issues that you already had in mind. They are reasonable cleanup tasks, but they do not solve the root finding: keeping real-time data synchronized and showing commuters whether the data they are looking at is fresh.

2. Does the problem belong to the screen or to the system, and does your repair sit in the right half?
The problem belongs to the system (data lifecycle and freshness), but your repair sits almost entirely in the screen.
Stale data is a temporal system state: cached or fetched timestamps vs. wall-clock time.
Your proposed repair attempts to solve a background synchronization problem by introducing new UI widgets (a 20-second countdown button, disabled button states, custom badge renamings).
If a commuter opens their phone while walking to the stop, waiting for a countdown to hit zero before they are allowed to tap "Refresh" is screen friction masking a system lifecycle deficiency.

3. Which heuristic could this repair break while serving Visibility of System Status?
Heuristic 3: User Control and Freedom.
A 20-second countdown button that locks out manual refresh removes user autonomy. If a commuter just walked out of an MRT station or an elevator where signal was lost, or if they suspect a bus just passed, forcing them to wait out an arbitrary 20-second cooldown timer prevents them from retrieving urgent information when they need it most.

4. What is the smallest alternative that would make the same thing true?
Instead of adding a countdown button, countdown state machine, and manual tap flow:
Background Auto-polling with Timestamp Visibility:
Set a silent background interval that refetches arrival data every 20 or 30 seconds while the service/stop view is active.
Display a discrete text indicator right beside the arrival time: "Updated just now" (or "Updated at 1:15 PM", changing to "Updated 1m ago").
Text normalization in place:
Map 0 min or < 1 min directly to "Arr" or "Arriving" in the existing rendering function.
If the arrivals array is empty, render "No Service" in place of the arrival pill, leaving the rest of the layout untouched.
This completely resolves Heuristic 1 without adding any interactive button, timer lockout, or manual effort.

5. How to check on the live address that the repair worked
Open https://mgmt-6110-problem-set-2-bus-where-5.vercel.app/.
In the search box, search for a bus stop (e.g., 10018 or Opp Blk 1).
Tap on a live bus service (e.g., 14 or 166).
Observe the Arrival Pill and Timestamp:
Confirm that any bus due in < 1 min displays "Arriving" rather than 0min.
Keep the screen open without touching the phone for 30–45 seconds; verify the arrival time ticks down or updates automatically, and the "Updated at..." text updates to reflect the latest poll.
Search for an inactive service or check outside operating hours (e.g., past 1:00 AM) to verify the service status shows "No Service" instead of broken or zeroed commute estimates.
```

### Prompt 2 - Repair User Search Journey
```
ROLE: You are a skeptical senior developer and usability reviewer working in my existing project. Before you write any code, your job is to argue against the repair I propose.

CONTEXT:
Live address: https://mgmt-6110-problem-set-2-bus-where-5.vercel.app/
Who the product is for, and what it does for them: The product is for regular public bus users, to know the arrival timings of buses and the duration of their bus trip.
The finding:
What I did, what I saw:
- The Search functionality can be confusing.
- There is a long list of Areas, which make scrolling cumbersome
- The Areas are categorised by Code Prefix, but the Search Bar filters bus stops by Road Name or Bus Stop Name
= If a user knows the bus to take, they are unable to search by bus services
- Also, a person is not able to filter by their nearby bus stops
Which heuristic: 7 - Flexibility and Efficiency of Use
Screen or system: System
Severity, and why: 2/4
- The user discovery journey is disrupted, leading to confusion
= A user could potentially go through multiple taps to find their info
The repair:
- Part 1: Remove the List of Areas
- Part 2: Replace the Search Bar with a Search Bar that has multiple tabs
>> Tab 1: Bus Stop Number
Display Bus Stops by Bus Stop Number
Restrict to only 5 numeric digits, and have a subtle reminder on this requirement
>> Tab 2: Road Name
Match Bus Stops by the Road Name
Provide a dropdown of suggested Road Names as the user types
>> Tab 3: Bus Service Number
Filter by bus services. This is a different entry point vs the bus stop flow
Provide the list of available bus services as the user types
It should still show the side bar with the bus route, and tapping on it will show the bus arrival timing for the selected bus stop
Advise me on the potential of this flow.
>> Tab 4: Postal Code
Is there a way or formula, whereby a user can enter their Postal Code, and we find the nearest bus stops for them?
What would be the requirements to achieve this? And are there other data required.
The user journey would now primarily start with the Search functionality.
The evidence behind it: 3 out of 4 group members shared this

GOAL: Argue against my repair.
- Does it solve the problem the finding describes, or a problem I already believed I had? Say which, and why.
- Does the problem belong to the screen or to the system, and does my repair sit in the right half?
= Name one heuristic this repair could break while it serves the one above, and how.
= Propose the smallest alternative that would make the same thing true.
= Tell me exactly what to do on the live address to check that the repair worked.

OUTPUT: Your arguments first, as a numbered list. Then stop. Write no code until I reply with the repair I have chosen.
GUARDRAILS: Do not tell me the repair is good. If you have no strong reason to doubt it, say so plainly instead of inventing one. When I do ask you to build, change only what the repair needs. Do not remove Disqus or the privacy notice, and do not break /api/health.
```
### Response 2
```
Here is the usability and engineering critique of the proposed repair:

1. Does it solve the problem the finding describes, or a problem you already believed you had?
It solves a problem you already believed you had by externalizing database schema distinctions onto the user.
Commuters do not think in database column types ("I want to search by field: road_name vs field: bus_stop_code"). They have a single piece of information in hand—a bus number (65), a stop number (54261), or a street (Orchard)—and want to type it immediately into whatever box is in front of them.
Forcing users to choose between 4 tabs before they can type introduces artificial interaction friction (a mode-switching tax). If a user is on the "Road Name" tab and pastes a 5-digit stop code or types service 147, the query fails with zero results.
Regarding Postal Code (Tab 4): Singapore postal codes (6 digits) map to specific buildings via coordinate projection (SVY21 / WGS84). To support this, you would either have to bundle a 30MB+ offline table of Singapore's ~140,000 postal codes or query external APIs (like SLA OneMap API), which introduces latency, API quotas, and network failure points. Commuters standing at or near a bus stop already have GPS on their phones; requiring them to look up and type a 6-digit postal code is far slower than tapping a 1-click location button.

2. Does the problem belong to the screen or to the system, and does your repair sit in the right half?
The problem belongs to the Screen, but your repair over-engineers the System.
The system already has all stop codes, stop names, road names, services, and GPS coordinates (latitude, longitude) in memory within /stops.json.
The problem is purely Screen representation:
The search predicate in FindMyStop.tsx simply omitted stop.services.includes(query).
The default landing screen renders an unhelpful list of 100+ LTA 2-digit administrative code prefixes (e.g., "Prefix 01", "Prefix 54") that mean nothing to everyday commuters.
Splitting one input into 4 tabs overcomplicates the screen to solve a two-line filter omission.

3. Name one heuristic this repair could break while it serves the one above, and how.
Heuristic 8: Aesthetic and Minimalist Design (and Heuristic 6: Recognition Rather Than Recall).
On mobile viewports (where 90%+ of bus commuters check arrival times), 4 horizontal tabs consume critical vertical real estate above the fold.
It forces users to recall which category their search term belongs to, and creates dead-end states when users type across category boundaries without switching tabs first.
Imposing a rigid 5-digit validation with a reminder rule breaks Heuristic 3: User Control and Freedom and Heuristic 5: Error Prevention; the current search gracefully matches partial numbers as the user types each digit.4. Propose the smallest alternative that would make the same thing true.
Instead of adding 4 tabs and a postal code lookup service:
Single Omnibox Search with Service Matching:
Keep one single search input. Update the client-side filter in FindMyStop.tsx to search stop.services in addition to code, name, and road:
codeTsconst serviceMatch = stop.services.some(svc => svc.toLowerCase() === trimmedQuery);
If a user types 65, they immediately see all stops served by bus 65; if they type 54261, they see that stop; if they type Orchard, they see Orchard stops. Zero tab switching.
Replace the Area Prefix List with a "Near Me" GPS Button:
Remove the artificial LTA 2-digit Area list. In its place on the default empty-search state:
Provide a prominent "Find stops near me" button using standard browser GPS (navigator.geolocation.getCurrentPosition).
Calculate Euclidean/Haversine distance against the existing latitude and longitude fields in stops.json to instantly surface the nearest 5–10 stops sorted by distance (e.g., 120m away).
If location access is denied or unavailable, show a clean list of recently viewed stops or top transit hubs instead of a massive alphabetical prefix directory.

5. Tell me exactly what to do on the live address to check that the repair worked.
Test Bus Service Search:
Tap the search bar and type 65 (or any service number).
Verify that bus stops serving route 65 appear immediately in the search results without navigating to a special tab.
Test Stop Code & Road Name in the Same Box:
Backspace and type 54261 to verify the exact stop appears.
Backspace and type Bishan to verify road/location results appear.
Verify Removal of the Area List & Check Nearby Stops:
Clear the search bar completely.
Confirm that the long, scrolling 2-digit Area prefix list is gone.
Tap the "Find stops near me" button, allow browser location permission, and verify that the closest physical stops appear with distance indicators (e.g. 150m).
```
### Response 2 Iterations
```
### Prompt:
For Single Omnibox Search with Service Matching, what happens if a user enters 65, and there are services and bus stop numbers that matches or starts/ends with 65?

### Response:
If you do a naive, unordered text search, a query like 65 creates a collision problem:
Bus service 65 matches.
Every bus stop whose 5-digit code starts with or contains 65 (e.g., 65009, 65129, 06519, 16541) matches.
Every bus stop whose name or street happens to have 65 (e.g., “Blk 65”) matches.
If all of these are dumped into one unranked list, the user gets an overwhelming list of 80+ stops, where stops served by Bus 65 are indistinguishable from stops whose postal/stop code happens to contain 65.
How to Disambiguate Without Splitting into 4 Tabs
In transit search (how apps like Citymapper, Apple Maps, and Google Maps handle this), you solve this with Result Categorization & Tiered Ranking:
1. Distinguish "Full Service Match" from "Stop Matches"
In Singapore, bus stop codes are strictly 5 digits (e.g., 65009), while bus service numbers are 1 to 3 digits (plus occasional letter suffixes like 65M).
When a user enters 65, they have typed an exact bus service number, but only a partial 2-digit stop code.
2. Group the Results into Two Clear Sections:
Instead of mixing everything together, the search dropdown/list renders two distinct sections:
code
Text
┌────────────────────────────────────────────────────────┐
│ Search: 65                                          ✕  │
└────────────────────────────────────────────────────────┘

  BUS SERVICES
  ┌────────────────────────────────────────────────────┐
  │ [65]  Service 65                                   │
  │       Tampines Int ⇄ HarbourFront Int              │
  └────────────────────────────────────────────────────┘

  BUS STOPS (Matching code or name)
  ┌────────────────────────────────────────────────────┐
  │ 65009  Opp Blk 125                                 │
  │        Tampines Ave 1 • Services: 8, 15, 23, 65... │
  ├────────────────────────────────────────────────────┤
  │ 65129  Blk 126                                     │
  │        Tampines Ave 1 • Services: 8, 15, 23, 65... │
  └────────────────────────────────────────────────────┘
3. How the User Journey Works for Each Case:
If the user taps the Service card ([65] Service 65):
It immediately opens the Ride Panel route view for Service 65, showing its full origin-to-destination stop sequence. (This achieves the exact goal you asked about in Tab 3: "filter by bus services, show the sidebar with the route").
If the user taps a Bus Stop (65009):
It expands or focuses on that specific stop, highlighting the [65] service chip.
If the user finishes typing a 5-digit code (65009):
The Service section disappears (since no service is named 65009), and the exact stop 65009 immediately jumps to the top as the sole exact match.
Why this is superior to tabs:
Zero mode-switching: The user never has to think "Wait, is this the Stop Number tab or the Service Number tab?"
Immediate recognition: Both matching services and matching stops are visible in one glance.
Natural drilldown: Typing 2 digits presents the route; typing 5 digits pinpoints the stop.

### Prompt:
Remove the Quick Search Hubs
This is not helpful, as tapping on it leads to a long list of bus stops that are not targeted for the user.
Tell me if you think otherwise.

### Response:
I agree with your decision to remove the Quick Search Hubs.
Why removing it is the right move:
Low Intent & Poor Targeting: Hub tags like "Orchard" or "Jurong East" match dozens of physically dispersed stops across major corridors. Tapping them resulted in an unranked, unwieldy list of stops with zero proximity context.
Clearer User Funnels: Commuters have two genuine entry points:
High specificity: Knowing the bus service (e.g. 65), 5-digit bus stop code, or road name via the Single Omnibox.
Immediate physical context: Tapping "Use Current Location" (GPS) to find walking-distance stops sorted by distance.
Reduced Cognitive Load (Heuristic 8: Aesthetic and Minimalist Design): Eliminating the hub chips removes visual noise and prevents users from falling into an unproductive tap trap.
Summary of Change:
Removed the Quick Search Hubs chip grid from the home screen (FindMyStop.tsx).
The home view now cleanly highlights GPS Near Me discovery and the concise guide for the Single Omnibox search.
Verified build and /api/health intact.

### Prompt:
Can we review these:
- When using the entry point via a Bus Service Number, the user should be able to choose both the Boarding stop as well as the Destination stop
- This is because this entry point does not know what's the user Boarding stop
= Also, when searching for Bus Service 851, there is a subtext that mentions "107 stops on route". Can you check if this is accurate?

GOAL: Argue against my repair.
- Does it solve the problem the finding describes, or a problem I already believed I had? Say which, and why.
- Name one heuristic this repair could break while it serves the one above, and how.
- Propose the smallest alternative that would make the same thing true.

OUTPUT: Your arguments first, as a numbered list. Then stop. Write no code until I reply with the repair I have chosen.

GUARDRAILS: Do not tell me the repair is good. If you have no strong reason to doubt it, say so plainly instead of inventing one. When I do ask you to build, change only what the repair needs. Do not remove Disqus or the privacy notice, and do not break /api/health.

### Response:
Here is the usability review and critique of the proposed repair, followed by the verification of Bus Service 851's route data:

1. Verification of Bus Service 851 ("107 stops on route")
The 107 figure is technically real data, but semantically inaccurate and misleading to a commuter.
The exact breakdown:
Direction 1 (Yishun Temp Int > Bukit Merah Int): 57 stops
Direction 2 (Bukit Merah Int > Yishun Temp Int): 52 stops
Total stop visits =. Because both directions terminate at the same two physical interchange poles (Yishun Int 59009 and Bukit Merah Int 10009), there are 107 unique physical bus stop codes in stops.json.
The flaw: The current code counted unique physical stops across both opposing directions combined. A passenger riding Bus 851 never experiences a 107-stop journey; they experience a 57-stop trip southbound or a 52-stop trip northbound. Conflating both directions into a single sum creates confusion.

2. Does it solve the problem the finding describes, or a problem you already believed you had?
It solves a problem you already believed you had (turning the app into a 2-point A-to-B route planner), not the problem the finding describes.
Why:
The original finding was: "If a user knows the bus to take, they are unable to search by bus services."
The core user goal in this app is to check bus arrival timings and trip duration.
When a user searches for a bus service like "851", their immediate question is either "When is it reaching my stop?" or "Does it go toward Bukit Merah or Yishun?"
The defect in the current build is not that the user is missing a destination picker; the defect is that FindMyStop.tsx used a crude implementation shortcut: it blindly grabbed svc.stops[0].code (a random stop from the raw stops.json array) and locked the panel to it.
Forcing the user to mandatorily select both boarding and destination stops before showing anything turns a quick arrival check into an onerous multi-step form wizard.

3. Which heuristic does this repair break, and how?
Heuristic 7: Flexibility and Efficiency of Use (and Heuristic 3: User Control and Freedom):
High interaction cost & deadlocks: A commuter standing at a bus stop who searches "851" just wants to see when the bus arrives at that stop. Forcing them into a modal or two-step selector to choose a Boarding Stop from a 50+ stop list, followed by a Destination Stop, introduces unnecessary friction for a user who may not even need a destination to see live timings.
Direction ambiguity: A bus service has two directions. Without first resolving direction, presenting 107 stops in a picker risks the user selecting a destination that belongs to the opposite direction, creating invalid route states or errors.

4. What is the smallest alternative that would make the same thing true?
Instead of creating a cumbersome two-stop selection form:
Direction Selector on Service Click:
When the user taps Bus Service 851, display the two clear terminus directions:
Towards Bukit Merah Int (57 stops)
Towards Yishun Temp Int (52 stops)
Show the direction's actual stop count (57 or 52), eliminating the misleading "107 stops" label.
Context-Aware Default Boarding Stop:
If GPS location was already granted, default the boarding stop to whichever stop on that direction is physically closest to the user.
If no GPS, default to the route's origin terminus (e.g. Stop 1: Yishun Temp Int), allowing the user to browse from start to end.
Interactive Timeline Selection in RidePanel:
In the route timeline, every stop is already listed in sequence. Allow the user to tap "Set as Boarding" on any stop in the list, or tap a downstream stop to set the destination.
This keeps arrival timing immediately visible without blocking the user behind a mandatory two-stop input barrier.
```

