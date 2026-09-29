# adversarial_collaboration.md
Zi Ming, Group 2
predictions.md committed at 25 Sep 2026, 21:51; first comment for this set on my board at 27 Sep 2026, 06:25

## The four-way table
### 1. Found by both
| Number | Problem | Raised By | Severity |
|---|---|---|---|
### 2. Found by them, missed by me
| Number | Problem | Raised By | Severity | Arbiter |
|---|---|---|---|---|
| 1 | Bus Service Not Available. But Trip Duration Still Visible | YiMing / Keziah | YiMing severity 3, Keziah severity 3 | 3 |
| 2 | Confusion between Bus Stop Code and Postal Code | Gillian | 2 | 2 |
| 3 | Different Search Results in Area Category vs Search Bar | Gillian | 2 | 2 |
| 4 | Unable to Translate Postal Code into Nearby Bus Stops | Gillian | 3 | 2 |
### 3. Found by me, not by them
| Number | Problem | My Severity |
|---|---|---|
| 1 | Bus Timings Not Refreshed | 4 |
| 2 | Confusing Data Inputs in Search Bar | 3 |
| 3 | Guiding Tooltips for New Users | 4 |
### 4. Found by both, rated differently
| Number | Problem | Raised By | Severity | Arbiter |
|---|---|---|---|---|
| 1 | Unable to Search by Bus Service Number | YiMing | my severity 2, YiMing severity 3 | 2 |
| 2 | Unable to Bookmark Bus Stop and Bus Service | YiMing / Keziah | my severity 3, YiMing severity 1, Keziah severity 2 | 2 |
| 3 | Long Areas List Scrolling | YiMing / Keziah / Gillian | my severity 3, YiMing severity 1, Keziah severity 2, Gillian severity 3 | Not Taken - Deemed as 2 Different Usability Problems |
| 4 | Unexplained Code/Area Prefix | Keziah | my severity 2, Keziah severity 1 | 1 |

## My predictions, checked
- Expected Finding 2: Long List of Area and Search Results > HELD (Me 3, YiMing 1, Keziah 2, Gillian 3)
- Expected Finding 3: Code Prefix > HELD (Me 2, Keziah 1)
- Expected Finding 6: Unable to Save Bus Stops or Services > HELD (Me 3, YiMing 1, Keziah 2)
- The heuristic I named as my product's worst: 1. Visibility of System Status > BROKE
  - The Worse Finding is under Heuristic 8 (Aesthetic and Minimalist Design), due to the Long List of Areas for scrolling
  - This was mentioned by every member in the team
- The finding that would show my evaluation was wrong: NOT RAISED
  - There were no findings that displayed concerns about the design being overly minimalist.

## Q1. Where was confirmation bias in my own evaluation?
- Finding 2, 3, 6 was what I predicted, which was confirmed from through the findings by other team members.
- These findings surfaced because they were the more obvious ones during the user journey.
## Q2. Which prediction broke, and what did it teach me?
- All of my Predicted Findings held, likely because these could appear in most AI products.
- For example, the ability to save Bus Stops and Services is an additional screen.
- This likely won't be built in unless it was explicitly mentioned to the AI.
## Q3. Which groupmate finding did I nearly dismiss, and what did the evidence say?
- I nearly dismissed the inability to search by bus service number.
- The comparison showed that searching by service number was a meaningful use case.
- This is a reminder to avoid undermining an issue simply because it did not strongly affect my own user flow.
## Q4. What did I revise, which heuristic does it serve, and how do I know it worked?
- Initial Version: https://mgmt-6110-problem-set-2-bus-where-5qx3-picvp2bfi-zi-ming-mbai.vercel.app?_vercel_share=hTg76ViXg5ltdgq6AVDqQ4no8F26gEee
- The Fixes are categorised into:
  1) Data Reliability and Correctness (Heuristic 1: Visibility of System Status)
  - It is working because now the ETA updates (i.e. if we are at the same screen, the timings will adjust when there are updates)
  - There is also no ETA provided if the Bus Service is not available
  2) User Search Journey (Heuristic 7: Flexibility and Efficiency of Use)
  - There is a single entry point to search for Bus Stops and Bus Services
  - Hence, a user does not have to be confused with the long list of areas previously
  - It also clearly tells the user what are the data that they can input in search
## Q5. What did my users give me that I could not have found myself?
- My users highlighted that asking mentioning that they can search by "code" is ambiguous, because it could mean Postal Code or Bus Stop Code
- I did not find this, because internally I set out to create a bus arrival app, hence intuitively I would have assumed "code" means bus stop code
- Hence, that led to me overlooking the flow of a regular user
## Q6. Did the AI help me confirm, or help me falsify?
- For the refreshing of Bus Arrival Timings, I initially wanted a 20s countdown button which the user has to manually trigger.
  - AI rejected this as additional friction, because a user has to trigger it. And if they are in a rush, this would not be helpful.
  - Hence, we moved to a subtle refreshing automatically every 20s
  - This removed friction for the user, and they can just glance at the page without always having to press a button
- AI also falsify my ask to have 4 separate tabs to search (1 each for Bus Stop, Bus Service, Road Name, Postal Code)
  - The suggestion made sense because 4 tabs meant a user who is in a rush and needs efficiency would have to actively think of what they want to search, and then tap the relevant tab
  - Consolidating all into a search bar would make it cleaner
  - The user does not have to think, and the search bar is intuitive enough to display relevant results
