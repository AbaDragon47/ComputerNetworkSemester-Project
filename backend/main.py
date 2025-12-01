import secrets
from typing import Dict, Set

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Networking Final Project Backend",
    description="Room-based data sharing over WebSockets",
    version="0.1.0",
)

# Allow frontend dev on localhost (adjust origins later if needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for dev; you can restrict later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# room_id -> set of connected websockets
rooms: Dict[str, Set[WebSocket]] = {}


@app.get("/")
async def root():
    return {"status": "ok", "message": "Backend is running"}


@app.post("/api/rooms")
async def create_room():
    """
    Create a new room and return its ID.
    The frontend can then generate a link like:
    http://<host>/join/<room_id>
    """
    # 6 hex chars = 3 bytes, e.g. "a3f9c1"
    room_id = secrets.token_hex(3)

    # Initialize room in our in-memory dict
    rooms[room_id] = set()

    return {"room_id": room_id}


@app.get("/api/rooms/{room_id}")
async def get_room(room_id: str):
    """
    Simple endpoint to check if a room exists.
    Useful for frontend when someone clicks a link.
    """
    exists = room_id in rooms
    return {"room_id": room_id, "exists": exists, "num_clients": len(rooms.get(room_id, []))}


@app.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    """
    WebSocket endpoint for a given room.

    - Clients connect with ws://<host>/ws/<room_id>
    - Any text message received is broadcast to all other clients in the same room.
    """
    await websocket.accept()

    # If someone joins a room through a link before /api/rooms was called,
    # we can optionally create the room on the fly:
    if room_id not in rooms:
        rooms[room_id] = set()

    rooms[room_id].add(websocket)
    print(f"[INFO] Client joined room {room_id}. Total: {len(rooms[room_id])}")

    try:
        while True:
            data = await websocket.receive_text()
            # Here you can later parse JSON, enforce "type", "sender", etc.
            # For now, just broadcast raw text to others in the same room.
            await broadcast_to_room(room_id, data, sender=websocket)
    except WebSocketDisconnect:
        # Remove connection from room on disconnect
        rooms[room_id].remove(websocket)
        print(f"[INFO] Client left room {room_id}. Total: {len(rooms[room_id])}")
        # If room is empty, clean it up
        if not rooms[room_id]:
            del rooms[room_id]
            print(f"[INFO] Room {room_id} deleted (empty).")


async def broadcast_to_room(room_id: str, message: str, sender: WebSocket | None = None):
    """
    Send `message` to all clients in `room_id` except the optional sender.
    """
    if room_id not in rooms:
        return

    dead_sockets = []

    for ws in rooms[room_id]:
        if ws is sender:
            continue
        try:
            await ws.send_text(message)
        except Exception:
            # Connection might be closed unexpectedly
            dead_sockets.append(ws)

    # Clean up any dead connections
    for ws in dead_sockets:
        rooms[room_id].remove(ws)

    if not rooms[room_id]:
        del rooms[room_id]


# To run: uvicorn main:app --reload
# (Run this from inside the `backend` folder)
