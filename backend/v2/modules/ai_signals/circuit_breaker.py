import time
import logging
import enum

logger = logging.getLogger(__name__)

class CircuitState(str, enum.Enum):
    CLOSED = "CLOSED"
    OPEN = "OPEN"
    HALF_OPEN = "HALF_OPEN"

class AICircuitBreaker:
    """
    State machine for wrapping external AI provider calls.
    Transitions CLOSED -> OPEN after repeated failures, failing fast during cooldown.
    """
    def __init__(self, failure_threshold: int = 3, cooldown_window: float = 30.0):
        self.failure_threshold = failure_threshold
        self.cooldown_window = cooldown_window
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.last_state_change = time.time()

    def allow_request(self) -> bool:
        """
        Check if request is allowed. Transitions to HALF_OPEN if cooldown window has expired.
        """
        now = time.time()
        if self.state == CircuitState.OPEN:
            if now - self.last_state_change > self.cooldown_window:
                self.transition_to(CircuitState.HALF_OPEN)
                return True
            return False
        return True

    def record_success(self):
        """
        Reset failures and close circuit.
        """
        self.failure_count = 0
        if self.state == CircuitState.HALF_OPEN:
            self.transition_to(CircuitState.CLOSED)

    def record_failure(self):
        """
        Increment failures. Trip circuit to OPEN if threshold reached.
        """
        self.failure_count += 1
        logger.warning(f"[Circuit Breaker] Failure recorded. Count: {self.failure_count}/{self.failure_threshold}")
        if self.state in (CircuitState.CLOSED, CircuitState.HALF_OPEN):
            if self.failure_count >= self.failure_threshold:
                self.transition_to(CircuitState.OPEN)

    def transition_to(self, new_state: CircuitState):
        logger.info(f"[Circuit Breaker] State changed from {self.state} to {new_state}")
        self.state = new_state
        self.last_state_change = time.time()
