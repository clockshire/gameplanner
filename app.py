"""
Main application entry point for the Scheduler app.

This module initializes and runs the Flask application for game and room booking.
"""

from app import create_app
from typing import NoReturn

app = create_app()

if __name__ == '__main__':
    """Run the application in development mode."""
    app.run(debug=True, host='0.0.0.0', port=5000)