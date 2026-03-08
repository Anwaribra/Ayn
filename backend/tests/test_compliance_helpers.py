from app.compliance.service import ComplianceService


def test_apply_task_event_created_and_updated():
    created = ComplianceService._apply_task_event(
        {},
        "action_plan_created",
        {
            "task": {
                "id": "t1",
                "title": "Initial",
                "status": "todo",
                "priority": "medium",
            }
        },
    )
    assert created["id"] == "t1"
    assert created["status"] == "todo"

    updated = ComplianceService._apply_task_event(
        created,
        "action_plan_updated",
        {"patch": {"status": "done", "title": "Initial Updated"}},
    )
    assert updated["status"] == "done"
    assert updated["title"] == "Initial Updated"


def test_apply_workflow_event_created_and_updated():
    created = ComplianceService._apply_workflow_event(
        {},
        "workflow_run_started",
        {
            "run": {
                "id": "r1",
                "workflowName": "Evidence Sync",
                "status": "queued",
            }
        },
    )
    assert created["id"] == "r1"
    assert created["status"] == "queued"

    updated = ComplianceService._apply_workflow_event(
        created,
        "workflow_run_updated",
        {"patch": {"status": "success"}},
    )
    assert updated["status"] == "success"


def test_as_dict_handles_non_dict_values():
    assert ComplianceService._as_dict({"a": 1}) == {"a": 1}
    assert ComplianceService._as_dict("x") == {}
    assert ComplianceService._as_dict(None) == {}

