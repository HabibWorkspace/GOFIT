"""Formatting utility functions."""


def format_stay_duration(minutes: int) -> str:
    """
    Format stay duration in minutes to "Xh Ym" format.
    
    Args:
        minutes: Duration in minutes
        
    Returns:
        Formatted string like "2h 30m" or "45m" or "1h"
    """
    if minutes < 0:
        minutes = 0
    
    hours = minutes // 60
    remaining_minutes = minutes % 60
    
    if hours == 0:
        return f"{remaining_minutes}m"
    elif remaining_minutes == 0:
        return f"{hours}h"
    else:
        return f"{hours}h {remaining_minutes}m"
