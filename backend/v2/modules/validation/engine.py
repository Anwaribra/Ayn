import json
import logging
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

class Condition(BaseModel):
    type: str
    min: Optional[float] = None
    max: Optional[float] = None
    equals: Optional[Any] = None
    contains: Optional[Any] = None

class RuleSet(BaseModel):
    operator: str = Field("AND", description="Logical operator: AND or OR")
    conditions: List[Condition]

class ValidationEngine:
    """
    Deterministic rule evaluation engine for the V2 architecture.
    Evaluates AI Signals and factual evidence metrics against defined rules.
    """
    
    def __init__(self):
        pass
        
    def evaluate_condition(self, condition: Condition, facts: Dict[str, Any]) -> bool:
        value = facts.get(condition.type)
        if value is None:
            return False
            
        if condition.min is not None:
            if value < condition.min:
                return False
        if condition.max is not None:
            if value > condition.max:
                return False
        if condition.equals is not None:
            if value != condition.equals:
                return False
        if condition.contains is not None:
            if isinstance(value, list) or isinstance(value, str):
                if condition.contains not in value:
                    return False
            else:
                return False
                
        return True

    def evaluate_ruleset(self, ruleset: RuleSet, facts: Dict[str, Any]) -> bool:
        """
        Evaluates a parsed RuleSet against a dictionary of facts (AI signals + system metrics).
        """
        results = [self.evaluate_condition(cond, facts) for cond in ruleset.conditions]
        
        if ruleset.operator.upper() == "AND":
            return all(results)
        elif ruleset.operator.upper() == "OR":
            return any(results)
            
        return False

    def process_ai_signal(self, signal_payload: Dict[str, Any], rule_definition: Dict[str, Any]) -> Dict[str, Any]:
        """
        Primary entrypoint for evaluating AI signals and converting them to deterministic states with explainability.
        """
        explanations = []
        try:
            ruleset = RuleSet(**rule_definition)
            
            # Record individual conditions results for explainability
            for i, cond in enumerate(ruleset.conditions, start=1):
                res = self.evaluate_condition(cond, signal_payload)
                if cond.type == "confidence":
                    if res:
                        explanations.append(f"Requirement {i} satisfied")
                    else:
                        explanations.append(f"Requirement {i} confidence below threshold")
                elif cond.type == "detected_entities":
                    if res:
                        explanations.append(f"Requirement {i} satisfied")
                    else:
                        explanations.append(f"Requirement {i} missing evidence")
                else:
                    if res:
                        explanations.append(f"Requirement {i} satisfied")
                    else:
                        explanations.append(f"Requirement {i} did not meet criteria")
            
            is_valid = self.evaluate_ruleset(ruleset, signal_payload)
            
            decision = "COVERED" if is_valid else "NOT_COVERED"
            
            confidence = signal_payload.get("confidence", 0.0)
            if confidence < 0.7:
                decision = "PARTIALLY_COVERED"
                explanations.append("Confidence below threshold")
                
            return {
                "decision": decision,
                "explanations": explanations
            }
        except Exception as e:
            logger.error(f"Failed to process ruleset: {e}")
            return {
                "decision": "NEEDS_REVIEW",
                "explanations": [f"Validation system exception: {str(e)}"]
            }

