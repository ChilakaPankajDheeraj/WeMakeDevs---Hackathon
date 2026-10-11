"""
AquaNex Leak Intelligence & Anomaly Detection
Compares baseline expected consumption against observed telemetry readings.
Uses transparent heuristic statistical benchmarking with anomaly confidence indicators.
"""

from typing import Dict, Any, List
from backend.risk_engine import calculate_leak_risk

def analyze_leak_anomaly(
    normal_consumption: float,
    observed_consumption: float,
    pipe_zone_id: str = "Zone-B Metro Core"
) -> Dict[str, Any]:
    norm = max(0.0, float(normal_consumption))
    obs = max(0.0, float(observed_consumption))

    risk_result = calculate_leak_risk(norm, obs)

    return {
        "normal_consumption": norm,
        "observed_consumption": obs,
        "excess_consumption": risk_result["excess_liters"],
        "anomaly_percentage": risk_result["anomaly_percentage"],
        "anomaly_detected": risk_result["anomaly_detected"],
        "risk_score": risk_result["score"],
        "risk_level": risk_result["risk_level"],
        "confidence_type": risk_result["confidence_type"],
        "possible_causes": risk_result["possible_causes"],
        "recommended_actions": risk_result["actions"],
        "pipe_zone_id": pipe_zone_id,
        "disclaimer": "Prototype Mode • Heuristic Leak Detection Baseline"
    }
