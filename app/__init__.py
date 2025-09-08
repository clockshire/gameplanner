"""
Scheduler App - Game and Room Booking System.

A Flask application for managing room bookings and game scheduling.
"""

from flask import Flask
from typing import Optional


def create_app(config_name: Optional[str] = None) -> Flask:
    """
    Create and configure the Flask application.
    
    Args:
        config_name: Configuration name to use (development, production, testing)
        
    Returns:
        Configured Flask application instance
    """
    app = Flask(__name__)
    
    # Register blueprints
    from app.routes import main
    app.register_blueprint(main)
    
    return app