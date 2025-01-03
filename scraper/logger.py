import logging
import sys
from datetime import datetime

def setup_logger():
    """Set up the main logger."""
    logger = logging.getLogger("scraper")
    logger.setLevel(logging.INFO)
    
    # Console handler
    console = logging.StreamHandler(sys.stdout)
    console.setLevel(logging.INFO)
    
    # File handler
    file_handler = logging.FileHandler(
        f"logs/scraper_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
    )
    file_handler.setLevel(logging.INFO)
    
    # Formatter
    formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    console.setFormatter(formatter)
    file_handler.setFormatter(formatter)
    
    # Add handlers
    logger.addHandler(console)
    logger.addHandler(file_handler)
    
    return logger

def get_logger(name):
    """Get a logger for a specific module."""
    return logging.getLogger(f"scraper.{name}")