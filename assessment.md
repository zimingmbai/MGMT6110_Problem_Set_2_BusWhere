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
- An initial bug happened whereby API was connected, but the simulated data was showing
