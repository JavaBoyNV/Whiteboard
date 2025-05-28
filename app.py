from flask import Flask, render_template
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins="*")

@app.route('/')
def index():
    return render_template('index.html', role='viewer')

@app.route('/main')
def main():
    return render_template('index.html', role='main')

@socketio.on('draw')
def handle_draw(data):
    # Broadcast drawing data to all clients except the sender
    emit('draw', data, broadcast=True, include_self=False)

@socketio.on('clear')
def handle_clear():
    emit('clear', broadcast=True)

if __name__ == '__main__':
    socketio.run(app, debug=True)
