import uuid
import logging
from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from v2.modules.horus_operations.models import V2HorusActionLog, V2HorusApprovalRequest, V2HorusWorkflow
from v2.modules.horus_operations.policy_engine import PolicyEngine, ActionProposal, PolicyResult, ActionType
from v2.modules.tasks.models import Task, TaskStatus, TaskPriority
from v2.modules.validation.models import Risk, RiskSeverity, RiskStatus
from v2.modules.notifications.models import Notification, NotificationStatus

logger = logging.getLogger("v2.modules.horus_operations.services")

class HorusExecutionService:
    @staticmethod
    async def execute_proposal(
        db: AsyncSession, 
        proposal: ActionProposal, 
        correlation_id: str, 
        triggering_event: str, 
        reasoning: str, 
        workflow_id: Optional[uuid.UUID] = None
    ) -> V2HorusActionLog:
        """
        Takes an ActionProposal, validates it via PolicyEngine, and executes if approved.
        Always logs the action to v2_horus_action_logs.
        """
        # 1. Validate Proposal via deterministic Policy Engine
        policy_result, policy_reason = PolicyEngine.evaluate(proposal)
        
        execution_status = "PENDING"
        executed_action = "NONE"
        
        if policy_result == PolicyResult.DENIED:
            execution_status = "BLOCKED_BY_POLICY"
            logger.warning(f"Horus Execution blocked: {policy_reason}")
        else:
            # 2. Execute Approved Action
            try:
                if proposal.action_type == ActionType.CREATE_TASK:
                    # Enforce constraint: Task must be unassigned
                    priority_str = proposal.payload.get("priority", "MEDIUM")
                    priority = TaskPriority.MEDIUM
                    if hasattr(TaskPriority, priority_str):
                        priority = TaskPriority(priority_str)

                    task = Task(
                        campus_id=proposal.campus_id,
                        title=proposal.payload.get("title", "Horus Automated Task"),
                        description=proposal.payload.get("description", ""),
                        status=TaskStatus.OPEN,
                        priority=priority,
                        assignee_id=None, # Explicitly UNASSIGNED
                        metadata_json={"created_by_horus": True, "correlation_id": correlation_id}
                    )
                    db.add(task)
                    executed_action = ActionType.CREATE_TASK.value
                
                elif proposal.action_type == ActionType.CREATE_APPROVAL_REQUEST:
                    req = V2HorusApprovalRequest(
                        campus_id=proposal.campus_id,
                        request_type=proposal.payload.get("request_type", "GENERAL_APPROVAL"),
                        payload=proposal.payload,
                        status="PENDING"
                    )
                    db.add(req)
                    executed_action = ActionType.CREATE_APPROVAL_REQUEST.value
                    
                elif proposal.action_type == ActionType.CREATE_RISK:
                    severity_str = proposal.payload.get("severity", "MEDIUM")
                    severity = RiskSeverity.MEDIUM
                    if hasattr(RiskSeverity, severity_str):
                        severity = RiskSeverity(severity_str)

                    risk = Risk(
                        campus_id=proposal.campus_id,
                        type=proposal.payload.get("type", "UNKNOWN_RISK"),
                        description=proposal.payload.get("description", "Autonomously detected risk."),
                        severity=severity,
                        status=RiskStatus.OPEN,
                        reference_type=proposal.payload.get("reference_type"),
                        reference_id=proposal.payload.get("reference_id")
                    )
                    db.add(risk)
                    executed_action = ActionType.CREATE_RISK.value

                elif proposal.action_type == ActionType.CREATE_NOTIFICATION:
                    user_id_str = proposal.payload.get("user_id")
                    user_id = uuid.UUID(user_id_str) if user_id_str else None

                    notification = Notification(
                        user_id=user_id,
                        campus_id=proposal.campus_id,
                        title=proposal.payload.get("title", "Horus Alert"),
                        message=proposal.payload.get("message", "An automated compliance update is available."),
                        type=proposal.payload.get("type", "SYSTEM_ALERT"),
                        status=NotificationStatus.UNREAD
                    )
                    db.add(notification)
                    executed_action = ActionType.CREATE_NOTIFICATION.value

                else:
                    executed_action = proposal.action_type.value
                    logger.info(f"Mock executed action: {executed_action}")
                
                await db.flush()
                execution_status = "SUCCESS"
            except Exception as e:
                logger.error(f"Error executing Horus proposal: {e}")
                execution_status = "FAILED"
                policy_reason = str(e)
                
        # 3. Log Audit Record (100% Explainability)
        log = V2HorusActionLog(
            campus_id=proposal.campus_id,
            correlation_id=correlation_id,
            triggering_event=triggering_event,
            reasoning_summary=reasoning,
            recommended_action=proposal.action_type.value,
            executed_action=executed_action,
            action_payload=proposal.payload,
            confidence_score=proposal.confidence_score,
            workflow_id=workflow_id,
            policy_result=policy_result.value,
            execution_status=execution_status
        )
        db.add(log)
        await db.commit()
        
        return log

