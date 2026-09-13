# prompts.md - BusWhere
**Student:** Lim Zi Ming · **Course:** MGMT 6110 · **Problem Set 2**
**User sentence:** A [user] opens this screen to [job], and knows it worked when [what they see].
**Live link:** [your Vercel production URL, the short one, tested in a private window]

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
**What came back:** ...

**What I changed next and why:** ...

---
