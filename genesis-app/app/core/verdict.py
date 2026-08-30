"""Deterministic verdict scoring: combines analyst + critic outputs with
evidence statistics so the decision is traceable, not vibes."""
from .. import config

STRENGTH_THRESHOLD = config.THRESHOLD_VALIDATE      # >= 70 -> VALIDATE
FIX_THRESHOLD = config.THRESHOLD_FIX_FIRST          # >= 45 -> FIX_FIRST, else REJECT


def build(idea: str, analysis: dict, critique: dict, evidence: list[dict], summary: dict) -> dict:
    demand_signals = analysis.get("demand_signals") or []
    backed_signals = [s for s in demand_signals if s.get("evidence_ids")]
    competition = analysis.get("competition") or {}
    players = competition.get("players") or []
    feasibility = analysis.get("feasibility") or {}
    feas_score = float(feasibility.get("score", 5))  # expected 0-10

    # 0-25: demand signals, each must cite evidence
    demand_score = min(25, 6 * len(backed_signals))
    if any(len(s.get("evidence_ids") or []) >= 2 for s in backed_signals):
        demand_score = min(25, demand_score + 5)

    # 0-20: competition presence (some competition = proven market)
    if competition.get("exists") and len(players) >= 2:
        comp_score = 15
    elif competition.get("exists"):
        comp_score = 10
    else:
        comp_score = 4  # no competition found: untested market, not automatically good

    # 0-25: evidence quality (count + domain diversity)
    evidence_score = min(25, 2 * len(evidence) + (5 if summary.get("domain_diversity", 0) >= 5 else 0))

    # 0-15: feasibility
    feasibility_score = max(0.0, min(15.0, feas_score * 1.5))

    # penalty: critic risks (high -8 each, medium -3, cap -25)
    risks = critique.get("risks") or []
    penalty = 0
    for r in risks:
        sev = (r.get("severity") or "low").lower()
        if sev == "high":
            penalty += 8
        elif sev == "medium":
            penalty += 3
    penalty = min(penalty, 25)

    score = max(0, min(100, round(demand_score + comp_score + evidence_score + feasibility_score - penalty)))

    fatal = critique.get("fatal") or []
    if score >= STRENGTH_THRESHOLD and not fatal:
        verdict = "VALIDATE"
    elif score >= FIX_THRESHOLD and not fatal:
        verdict = "FIX_FIRST"
    else:
        verdict = "REJECT"

    return {
        "score": score,
        "verdict": verdict,
        "breakdown": {
            "demand": demand_score,
            "market_competition": comp_score,
            "evidence_quality": evidence_score,
            "feasibility": round(feasibility_score, 1),
            "risk_penalty": -penalty,
        },
        "strengths": analysis.get("strengths") or [],
        "audience": analysis.get("audience"),
        "monetization": analysis.get("monetization"),
        "competition_players": players,
        "risks": risks,
        "fatal_issues": fatal,
        "change_suggestions": critique.get("change_suggestions") or [],
        "rejection_reason": critique.get("rejection_reason"),
        "next_steps": _next_steps(verdict, critique, analysis),
        "evidence_used": summary,
    }


def _next_steps(verdict: str, critique: dict, analysis: dict) -> list[str]:
    if verdict == "VALIDATE":
        return [
            "Ship the smallest wedge that tests the core assumption in 7 days",
            "Put it in front of 20 people from the target audience this week",
            "Track: do they return after first use? That is the real signal",
        ]
    if verdict == "FIX_FIRST":
        steps = [
            "Apply the change suggestions below, then re-run validation on the revised idea",
            "Interview 5 people from the audience before building anything",
        ]
        if analysis.get("monetization"):
            steps.append(f"Pressure-test monetization: {analysis['monetization']}")
        return steps
    return [
        "Do not build this in its current form",
        "Address the fatal issues or pick a different problem wedge",
        "Re-run validation only after a substantial reframe",
    ]
