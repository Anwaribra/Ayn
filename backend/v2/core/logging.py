import logging
import contextvars
import uuid

correlation_id_ctx = contextvars.ContextVar("correlation_id", default="")

class CorrelationIdFilter(logging.Filter):
    """
    Injects correlation_id from contextvars into the log record.
    """
    def filter(self, record):
        record.correlation_id = correlation_id_ctx.get() or "no-correlation-id"
        return True

def setup_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)
    
    # Avoid duplicate handlers if already configured
    if not logger.handlers:
        handler = logging.StreamHandler()
        formatter = logging.Formatter(
            "[%(asctime)s] [%(levelname)s] [trace:%(correlation_id)s] [%(name)s] %(message)s"
        )
        handler.setFormatter(formatter)
        handler.addFilter(CorrelationIdFilter())
        logger.addHandler(handler)
        
    return logger

def set_correlation_id(cid: str | None) -> str:
    """Sets the current correlation ID, generating a new UUID if none is provided."""
    val = cid or str(uuid.uuid4())
    correlation_id_ctx.set(val)
    return val

def get_correlation_id() -> str:
    return correlation_id_ctx.get()
