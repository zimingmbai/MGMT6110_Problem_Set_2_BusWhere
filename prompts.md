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

CONTEXT: Individual Problem Set 1 for MGMT 6110 Human-AI Collaboration at SMU. Built in Google Stitch, shared as a link, and opened on a phone by classmates in Week 3. I am not a programmer: when you make a choice I did not specify, say so in one line rather than burying it.
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

## Prompt 3 - [and so on, one entry per prompt, in order]
