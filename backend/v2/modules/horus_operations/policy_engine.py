import enum
import uuid
import logging
from typing import Optional, Dict, Any, Tuple
from pydantic import BaseModel, Field

logger = logging.getLogger("v2.modules.horus_operations.policy_engine")

class ActionType(str, enum.Enum):
    # Allowed
    CREATE_TASK = "CREATE_TASK"
    CREATE_RISK = "CREATE_RISK"
    CREATE_NOTIFICATION = "CREATE_NOTIFICATION"
    CREATE_APPROVAL_REQUEST = "CREATE_APPROVAL_REQUEST"
    GENERATE_BRIEFING = "GENERATE_BRIEFING"
    GENERATE_MOCK_AUDIT = "GENERATE_MOCK_AUDIT"
    
    # Restricted
    DELETE_EVIDENCE = "DELETE_EVIDENCE"
    MARK_STANDARD_COMPLETE = "MARK_STANDARD_COMPLETE"
    MODIFY_AUDIT_LOG = "MODIFY_AUDIT_LOG"
    CHANGE_VALIDATION_RESULT = "CHANGE_VALIDATION_RESULT"

class ActionProposal(BaseModel):
    action_type: ActionType
    payload: Dict[str, Any]
    campus_id: uuid.UUID
    confidence_score: float = 0.0

class PolicyResult(str, enum.Enum):
    APPROVED = "APPROVED"
    DENIED = "DENIED"

class PolicyEngine:
    RESTRICTED_ACTIONS = {
        ActionType.DELETE_EVIDENCE,
        ActionType.MARK_STANDARD_COMPLETE,
        ActionType.MODIFY_AUDIT_LOG,
        ActionType.CHANGE_VALIDATION_RESULT
    }

    @classmethod
    def evaluate(cls, proposal: ActionProposal) -> Tuple[PolicyResult, str]:
        """
        Validates if an action proposal is allowed to be executed autonomously by Horus.
        Returns (PolicyResult, reason_str).
        """
        # 1. Enforce Advisory-First / Restricted Actions
        if proposal.action_type in cls.RESTRICTED_ACTIONS:
            reason = f"Action {proposal.action_type.value} is strictly prohibited for autonomous execution."
            logger.warning(f"PolicyEngine DENIED: {reason}")
            return PolicyResult.DENIED, reason

        # 2. Enforce minimum confidence threshold for automated mutation
        # Notification/Briefing generation can have lower confidence, but Tasks/Risks need higher.
        min_confidence = 0.6 if proposal.action_type in (ActionType.CREATE_TASK, ActionType.CREATE_RISK) else 0.4
        if proposal.confidence_score < min_confidence:
            reason = f"Confidence score {proposal.confidence_score} is below the {min_confidence} threshold for {proposal.action_type.value}."
            logger.warning(f"PolicyEngine DENIED: {reason}")
            return PolicyResult.DENIED, reason

        # 3. Validation Rules per Action Type
        if proposal.action_type == ActionType.CREATE_TASK:
            assignee = proposal.payload.get("assignee_id")
            if assignee is not None and str(assignee).upper() != "UNASSIGNED":
                reason = "Autonomous task creation must be UNASSIGNED or assigned to a general pool, not a specific user."
                logger.warning(f"PolicyEngine DENIED: {reason}")
                return PolicyResult.DENIED, reason

        logger.info(f"PolicyEngine APPROVED action {proposal.action_type.value}")
        return PolicyResult.APPROVED, "Validation passed."
