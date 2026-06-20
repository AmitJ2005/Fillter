"""WSGI entry point for production servers.

Local development:
    python app.py

Production (Linux / containers):
    gunicorn wsgi:app --workers 1 --threads 4 --timeout 120

NOTE: the app stores the currently selected stock in module-level globals
(df, result_info, stock_information), which are NOT shared across processes.
Run with a SINGLE worker (use threads for light concurrency); multiple
workers would let a /submit_selected_stock and the following /visualize_data
land on different processes and lose the data.
"""
from app import app

if __name__ == "__main__":
    app.run()
