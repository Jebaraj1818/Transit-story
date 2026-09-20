"""WSGI Entry Point for Production Servers (Gunicorn / Waitress)"""

from backend.app import app

if __name__ == '__main__':
    app.run()
