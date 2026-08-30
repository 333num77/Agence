# Genesis — Use Cases & Audience Positioning (International)

**Product:** Genesis — AI idea validation engine
**Doc:** Use cases NOW & FUTURE, ranked audiences, positioning, risks
**Date:** 2026-08-30
**Method:** Prior verified market research (inherited, marked *[inherited]*) + 5 fresh verification searches for new numeric claims only (sources inline; weak secondary sources flagged).

**Inherited findings this doc builds on** *(no new claims made below on these points)*:
- ~80% of AI-wrapper startups estimated to fail by 2026 (CB Insights/Gartner via secondary sources) *[inherited]*
- Free→paid conversion median ~8%; 25% of products convert <2.5% *[inherited]*
- Direct validators (IdeaProof, ValidatorAI) are already free → differentiation must be the **audited workflow**, not the one-shot report *[inherited]*
- 2026 winners are vertical + AI-native and must pass the "wrapper-trap"; 2-of-4 moats required *[inherited]*

---

## 1. Use Cases NOW (launch window)

### 1.1 Pre-seed founder: the night-before build/no-build gate
- **Who:** Solo founder or 2-person team with an idea and a free weekend, pre-revenue, often outside US/EU.
- **When:** The moment they're about to commit 4–12 weekends (or savings) to building v1.
- **Output:** One report: evidence-backed analysis of demand, competition, and feasibility → red-team critique → deterministic score (0–100) + verdict **VALIDATE / FIX_FIRST / REJECT** → 3–5 change suggestions and concrete next validation steps, every claim carrying a citation. The value is a *defensible no*, not encouragement.
- **Why it sticks:** CB Insights' post-mortem analysis found **42% of failed startups cited "no market need"** as a top reason (https://www.cbinsights.com/research/report/startup-failure-reasons-top/ — note: based on ~101–110 post-mortems, older data, treat as directional). Genesis prices the kill decision at a few credits instead of months of runway.

### 1.2 Agency / studio discovery-sprint compression
- **Who:** Product agencies, brand studios, and fractional CPOs who run paid discovery for clients.
- **When:** New client engagement kickoff, before committing a team to a sprint.
- **Output:** A pre-sprint evidence brief per client idea: market signals, competitor map, red flags — cited — that the agency white-labels into its own deck, plus a re-runnable score to show the client before/after pivots.
- **Why it sticks:** Agency-run design sprints cost **$15,000–$30,000 for a 5-day engagement**, with a discovery phase adding **$3,000–$8,000** (https://www.parallelhq.com/blog/design-sprint-cost; https://www.925studios.co/blog/design-sprint-cost-what-you-get-2026). Genesis doesn't replace the sprint; it arms it — and agencies pay recurring for margin, not entertainment.

### 1.3 VC scout & pre-partner deal-flow triage
- **Who:** Venture scouts, angels-in-training, and pre-partner analysts drowning in inbound.
- **When:** Weekly deal-flow review; before spending a partner's attention on a memo.
- **Output:** A standardized, evidence-linked screen per deal (same rubric every time): score, verdict, top 3 risks with citations. Output format is a memo they can paste into their internal stack.
- **Why it sticks:** Reported figures indicate **over 70% of venture firms now use data/AI tooling in sourcing or screening, up from <40% four years ago** (secondary source, low confidence: https://www.linkedin.com/pulse/ai-powered-deal-screening-how-venture-capital-redefining-smarter-pdzbe — directional only). The wedge is *scouts and analysts*, not partner-level buyers (see §5).

### 1.4 Indie hacker: the one-weekend kill test
- **Who:** Indie hackers / solo SaaS builders (Product Hunt–Dev.to–X ecosystem) with 5+ idea candidates.
- **When:** Idea-list triage — choosing which single idea earns the next month of nights.
- **Output:** Comparative verdicts across candidate ideas; a REJECT with citations on 4 of 5, a FIX_FIRST with a re-scoped wedge on the survivor.
- **Why it sticks:** This segment has the most ideas and the least time; they already pay for small utility tools. The CLI/SDK surfaces matter here — they'll script batch runs.

### 1.5 Accelerator / program application triage
- **Who:** Accelerator program managers, university incubators, grant reviewers.
- **When:** Application-window close, before human review hours are spent.
- **Output:** Ranked shortlist: every application scored on the same deterministic rubric with citations, so human reviewers spend time on the top decile and on challenging the AI's edge cases (human-in-the-loop by design).
- **Why it sticks:** Top programs reject the overwhelming majority of applicants (Y Combinator's acceptance rate is commonly reported around **~1%, with recent batches reported as low as ~0.6%** — weak secondary sources, directional: https://www.reddit.com/r/Entrepreneur/comments/1c4npcg/we_applied_to_y_combinator_100_times_heres_what/, https://www.linkedin.com/posts/sadiasaifuddin_the-acceptance-rate-for-y-combinator-this-activity-7371218381842264067-8B7d). First-pass triage is exactly the boring, high-volume job AI should do.

### 1.6 SME product team: roadmap initiative triage
- **Who:** PMs at small software companies (5–100 staff) without research teams.
- **When:** Quarterly planning, when the ideas backlog outnumbers capacity.
- **Output:** Evidence-backed score per initiative (internal ideas framed as mini-startups), killing pet projects with citations instead of politics.
- **Why it sticks:** Non-obvious wedge: the buyer already has a budget line for "research/insights tools" and feels the internal-politics pain acutely.

### 1.7 Hackathon team: the 48-hour idea pick
- **Who:** Hackathon participants and organizers.
- **When:** First 2 hours of a hackathon (teams picking what to build) or organizers pre-screening sponsored tracks.
- **Output:** Fast verdict + the 2–3 cited facts that make or break the idea, so teams don't burn 40 hours on a dead end. Organizer-side: a shortlist worth mentoring.
- **Why it sticks:** Volume funnel + top-of-funnel brand. Low willingness to pay, high word-of-mouth and team-formation gravity.

---

## 2. Use Cases FUTURE (12–24 months)

### 2.1 Continuous re-validation ("validation decay")
Ideas are validated once and then the world changes. Genesis re-runs validation on a cadence (or on trigger events: funding wave, competitor launch, regulation) and diffs the report: *score was 71, now 58 — competitor X raised $12M; here's what changed.* Converts a one-shot report into a subscription.

### 2.2 Portfolio tracking for accelerators & angels
A dashboard across dozens of companies/ideas over time: score trajectories, systemic risks in the batch, benchmark percentile. This is the natural expansion from §1.5 and the first real seat-based revenue layer.

### 2.3 The outcome flywheel dataset
Every verdict (VALIDATE/FIX_FIRST/REJECT) eventually meets reality (shipped? revenue? dead?). Anonymized verdict→outcome pairs make Genesis the only validator whose *accuracy* can be measured — "our REJECTs were right X% of the time" is a claim no free wrapper can make. This is the data moat; it requires deliberate outcome-survey plumbing from day one.

### 2.4 Agent-orchestration primitive: validation as a function call
Other agents (build agents, incubator bots, marketplaces) call `genesis.validate(idea, budget, depth)` via the Python SDK and get a structured verdict contract back. Genesis becomes invisible infrastructure — the validation layer of the agent economy. Guardrails (budget caps, human approval gates) are prerequisites for this to be trusted by other agents' operators.

### 2.5 Enterprise & corporate deal-screening (post-compliance)
Corporate innovation teams and PE/M&A screens scoring dozens of opportunities against the same audited rubric. Explicitly **deferred** until compliance maturity (SOC2 path, data residency) — see §3 ignore list.

---

## 3. Target Audiences (ranked)

### PRIMARY (beachhead — first 12 months)
1. **Pre-seed / idea-stage founders and indie hackers (global, developing markets included).** Largest volume, highest pain at the exact decision moment, credit-based freemium fits their reality. They anchor the top of the funnel and the outcome-flywheel dataset. Monetize modestly; learn aggressively.
2. **Product agencies, studios, fractional CPOs.** The revenue anchor: recurring use cases (every new client), white-label output, existing spend on discovery work ($3k–8k discovery phases per engagement — see §1.2 source), and they feel zero price anchoring to "free ChatGPT."
3. **Accelerators, incubators, hackathon programs, VC scouts/analysts.** Volume + standardization buyers: same rubric across hundreds of applications. Sales motion is community-led (one program manager influences hundreds of founders).

### SECONDARY (expand after beachhead)
4. **SME product teams / PMs** (roadmap triage, §1.6) — smaller numbers, longer cycles, but budget exists.
5. **Angel investors & syndicates** — portfolio screening before §2.2 ships; served initially by CLI/SDK and manual flows.
6. **Startup educators (bootcamps, university programs)** — low revenue, high distribution; free classroom tier.

### IGNORE — explicitly do not serve now
- **Enterprises needing SOC2/compliance today.** Compliance maturity is months away; enterprise sales cycles (6–12 months) would kill a freemium product before it learns. Revisit at §2.5.
- **Non-technical consumers satisfied by ChatGPT.** They want a confident-sounding opinion, not a cited audit; they can't perceive the difference and won't pay (free→paid median ~8% *[inherited]* — this segment converts near zero and support costs are high).
- **Partner-level VC deal teams as *primary* buyers.** They require bespoke diligence depth, relationship-driven sourcing, and legal/compliance posture Genesis doesn't have yet. Serve their scouts/analysts instead.
- **Mass idea-generators / spam pipelines.** Users generating hundreds of ideas to game the scores misalign incentives, burn credits, and would poison the outcome-flywheel dataset (§2.3). Rate-limit by design.

---

## 4. Positioning

**One line:**
> **Genesis is the evidence-audited validation engine that turns startup ideas into a cited, red-teamed, deterministic go/no-go decision — not another AI opinion.**

### Three differentiators (each passes the wrapper-trap)

1. **Audited workflow, not a one-shot report.** Free validators (IdeaProof, ValidatorAI *[inherited]*) emit a chat-shaped opinion. Genesis runs a pipeline — live web research (Tavily) → analysis → adversarial red-team → verdict — where **every claim carries a citation** you can check. The workflow is the moat; the report is just its output. *(Moat mapping: workflow + embedded data.)*
2. **Deterministic score + verdict contract.** `score 0–100` + `VALIDATE / FIX_FIRST / REJECT` is a reproducible contract: comparable across ideas, across time, across a portfolio, and consumable by software. Chat has no contract; wrappers can't fake reproducibility without building the same pipeline. *(Moat mapping: workflow/technical.)*
3. **Embeddable primitive with guardrails, priced for developing markets.** Web + CLI + SDK means Genesis composes into agencies' delivery stacks and other agents' workflows (§2.4) — switching cost lives in the integration, not the UI. Human-approval gates and budget guardrails make it delegable. Credits-based freemium opens the funnel globally instead of gating it behind a $29/mo Western card. *(Moat mapping: distribution + data flywheel.)*

Against the wrapper-trap rule *[inherited: 2026 winners are vertical + AI-native, 2-of-4 moats]*: Genesis is vertical (validation as its own discipline), AI-native (multi-step agent workflow, not a chat skin), and the three differentiators above cover ≥2 moat categories (workflow/technical + distribution/data).

---

## 5. Risks against this positioning

1. **"Good-enough free" gravity.** ChatGPT and free validators anchor idea-feedback at $0, and the median free→paid conversion is only ~8% *[inherited]*. If Genesis's paying base stays in the founder long-tail instead of agencies/programs/scouts (audiences 2–3), revenue will look like a rounding error. *Mitigation: weight GTM and pricing design toward the B-side recurring segments from month one.*
2. **Cited ≠ correct — the trust asymmetry.** A confidently cited but weak or wrong source (or a wrong REJECT on someone's dream) destroys trust faster than no citations at all; and because the model layer is configurable (Groq/OpenRouter/OpenAI/Ollama), verdict drift across providers threatens the "deterministic" promise. *Mitigation: pin models/versions per run, publish calibration stats, make the red-team visible and appealable (human approval is a feature, not friction).*
3. **Wrapper-trap perception persists anyway.** Despite the moats, press and investors may still bucket Genesis with the ~80% failing AI wrappers *[inherited]*, and free competitors can copy the visible surface (score UI, verdict labels, "citations") faster than the audited pipeline and outcome dataset (§2.3) can compound. *Mitigation: lead every narrative with workflow verifiability and measured verdict accuracy, not "AI analysis"; ship the outcome-tracking loop early so the data moat starts accruing.*

---

## Evidence notes (new numeric claims only)

| Claim | Source | Confidence |
|---|---|---|
| 42% of failed startups cite "no market need" (CB Insights post-mortem analysis, ~101–110 startups, 2014-era) | https://www.cbinsights.com/research/report/startup-failure-reasons-top/ | Medium (dated, small n) |
| Design sprints cost $15k–$30k per 5-day engagement | https://www.parallelhq.com/blog/design-sprint-cost | Medium (agency blog) |
| Discovery phase adds $3k–$8k | https://www.925studios.co/blog/design-sprint-cost-what-you-get-2026 | Medium (agency blog) |
| >70% of VC firms use data/AI tools in sourcing/screening, up from <40% | https://www.linkedin.com/pulse/ai-powered-deal-screening-how-venture-capital-redefining-smarter-pdzbe | Low (secondary, LinkedIn) — used directionally |
| YC acceptance ~1% (recent batches reported ~0.6–1.5%) | https://www.reddit.com/r/Entrepreneur/comments/1c4npcg/we_applied_to_y_combinator_100_times_heres_what/, https://www.linkedin.com/posts/sadiasaifuddin_the-acceptance-rate-for-y-combinator-this-activity-7371218381842264067-8B7d | Low (secondary) — used directionally |

All other figures are inherited from prior verified research and are marked *[inherited]* rather than re-claimed.
