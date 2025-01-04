import logging
from datetime import datetime
import os

def setup_logger():
    """Set up logger with both file and console handlers."""
    # Create logs directory if it doesn't exist
    logs_dir = os.path.join(os.getcwd(), 'logs')
    os.makedirs(logs_dir, exist_ok=True)
    
    # Create logger
    logger = logging.getLogger('scraper')
    logger.setLevel(logging.INFO)
    
    # File handler
    file_handler = logging.FileHandler(
        os.path.join(logs_dir, f"scraper_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log")
    )
    file_handler.setLevel(logging.INFO)
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    
    # Create formatter
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    file_handler.setFormatter(formatter)
    console_handler.setFormatter(formatter)
    
    # Add handlers to logger
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    
    return logger

def get_logger(name):
    """Get a logger instance."""
    return logging.getLogger(name)