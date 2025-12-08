# Web Based Chat Rooms – Networking Final Project

Our App is a room-based networking application that lets multiple clients join a shared room via a link and exchange messages in real time.  

The app uses:

- **FastAPI + Uvicorn** as the backend server (HTTP + WebSocket over TCP)
- **Static HTML/CSS/JS** as the frontend, served via Python’s `http.server`
- **Room-based broadcast**: all clients connected to the same room receive each other’s messages

This document explains exactly how to **set up, run, and use** the application.

---

## 1. Prerequisites

You will need:

- **Python 3.10+** installed on the machine that will act as the server  
- A web browser (Chrome, Edge, Firefox, etc.) on each client device
- All machines must be on the **same network** (same Wi-Fi or LAN) to test multi-device behavior

No compilation is needed; this is an interpreted Python + static web project.

---

## 2. Repository Structure

The project is organized as follows:

```text
ComputerNetworkSemester-Project/
├── backend/
│   ├── main.py            # FastAPI backend (HTTP + WebSocket)
│   ├── requirements.txt   # Python dependencies (fastapi, uvicorn, etc.)
│   └── ... (venv, etc.)
└── Front_end/
    ├── index.html         # Landing page (create/join room)
    ├── room.html          # Room UI (chat / status)
    ├── script.js          # Frontend logic (HTTP + WebSocket)
    ├── style.css          # Styling
    └── ...
```
All commands below assume you are in the root folder of the project:
ComputerNetworkSemester-Project/

## 3. Backend Setup (FastAPI + Uvicorn)

### Create and activate a virtual environment

On Windows:
```bash
cd backend

# Create virtual environment (Windows)
py -m venv .venv

# Activate venv (Windows PowerShell)
.\.venv\Scripts\activate
```

On macOS/Linux:
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
```
### Install dependencies

```bash
pip install -r requirements.txt
```
if that is not working, install directly with:

```bash
pip install fastapi "uvicorn[standard]" 
pip freeze > requirements.txt    # optional, to lock versions
```

## 4. Running the Backend Server

From the `backend/` directory with the venv activated:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
- `--host 0.0.0.0` makes the server accessible from other devices on the LAN.
- `--port 8000` is the backend port used by the frontend.
- `--reload` is optional but convenient during development.

You should see output similar to:
```text
Uvicorn running on http://0.0.0.0:8000
Application startup complete.
```

Quick sanity check: open a browser on the server machine and visit:

http://127.0.0.1:8000/


You should see a JSON response like:
```json
{"status": "ok", "message": "Backend is running"}
```

Leave this backend terminal window running.

## 5. Running the Frontend

In a separate terminal window:

Navigate to the frontend folder:
```bash
cd Front_end
```
Start a simple HTTP server on port 5500:
```bash
# Windows / macOS / Linux
python -m http.server 5500 --bind 0.0.0.0
```

This serves index.html, room.html, script.js, etc. over HTTP.

You should now be able to access the app from the server machine at:

http://127.0.0.1:5500/index.html

## 6. Using the Application (Single Machine)

On the landing page (index.html):

Click **“Create a Room”.**

The frontend sends `POST /api/rooms` to the backend.

You will be redirected to:

`room.html?room=<room_id>`


For example:

`room.html?room=a3f9c1`


On the room page (`room.html`):

The header shows: `Room: <room_id>`.

A WebSocket connection is opened to:

`ws://<server-host>:8000/ws/<room_id>`


**Connection Status** should show **Connected**.

Open another tab/window on the same machine:

Paste the same `room.html?room=<room_id>` URL.

Now you have two “clients” in the same room.

In either tab:

- Type a message in the input box.

- Press Enter or click Send.

The sender sees: `You: <message>`.

The other tab sees: `Peer: <message>`.

Backend logs will show room creation, joins, messages, and disconnects.

## 7. Using the Application (Multiple Devices on the Same Network)

To demonstrate real networked behavior (distinct entities):

### Make sure both backend and frontend are running on the server machine:

Backend:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Frontend:
```bash
python -m http.server 5500 --bind 0.0.0.0
```

### On the server machine, find its LAN IP address:

On Windows, in PowerShell / Command Prompt:
```bash
ipconfig
```

Look for the Wi-Fi adapter’s IPv4 Address, e.g.:
```text
IPv4 Address . . . . . . . . . . : 192.168.1.47
```

You can also go into the devices wifi/network setting and find the Wifi Adapter

### On another device (laptop/phone) on the same Wi-Fi:

Open a browser and go to:

http://192.168.1.47:5500/index.html


(Replace 192.168.1.47 with the actual IP found in step 2.)

Click **“Create a Room”** on that device.

It will redirect you to:

`room.html?room=<room_id>`


### On a second device or back on the server machine:

Open a browser and navigate directly to the same room URL, e.g.:

http://192.168.1.47:5500/room.html?room=a3f9c1


### Send messages from any device:

All other devices in the same room should see them.

The backend terminal will show:

- Each WebSocket connection (with client IP/port and client_id)

- Joins, leaves, and room deletion when empty.

## 8. Disconnect Behavior

When a client closes the room tab or browser:
- The backend removes that WebSocket from the room.
- Remaining clients receive a system message like:
```text
Peer left the room.
```

- If the last client leaves, the backend deletes the room and logs something like:
```text
Room <room_id> deleted (empty after disconnect).
```

This demonstrates proper session cleanup and state management.

## 9. Stopping the Application

To stop the backend:

Go to the terminal running `uvicorn` and press `Ctrl + C`.

To stop the frontend server:

Go to the terminal running `python -m http.server` and press `Ctrl + C`.