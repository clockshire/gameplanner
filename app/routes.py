"""
Main routes for the Scheduler application.

Contains the primary routing logic for the game and room booking system.
"""

from flask import Blueprint, render_template
from typing import str as String

main = Blueprint('main', __name__)


@main.route('/')
def index() -> String:
    """
    Render the main index page.
    
    Returns:
        Rendered HTML template for the home page
    """
    return render_template('index.html', title='Scheduler - Game & Room Booking')


@main.route('/health')
def health_check() -> dict:
    """
    Health check endpoint for monitoring.
    
    Returns:
        JSON response indicating application health status
    """
    return {'status': 'healthy', 'message': 'Scheduler app is running'}