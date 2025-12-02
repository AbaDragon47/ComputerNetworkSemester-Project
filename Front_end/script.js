const API_BASE = `http://${window.location.hostname}:8000`;
//---------------------------------------------
// PAGE REDIRECTS
//---------------------------------------------
async function createRoom() {
    // Person A will replace this with a backend call
    //const random = Math.random().toString(36).substring(2, 8);
    //window.location.href = `room.html?room=${random}`;

    try {
        const res = await fetch(`${API_BASE}/api/rooms`, {
            method: "POST"
        });

        if (!res.ok) {
            alert("Failed to create room");
            return;
        }

        const data = await res.json();
        const roomId = data.room_id;

        // Go to room page with code in query string
        window.location.href = `room.html?room=${encodeURIComponent(roomId)}`;
    } catch (err) {
        console.error("Error creating room:", err);
        alert("Error creating room. Is the backend running on port 8000?");
    }
}

function joinRoom() {
    const code = document.getElementById("roomInput").value.trim();
    if (code.length === 0) return;
    window.location.href = `room.html?room=${code}`;
}

//---------------------------------------------
// ROOM PAGE LOGIC
//---------------------------------------------
if (window.location.pathname.includes("room.html")) {

    const room = new URLSearchParams(window.location.search).get("room");
    document.getElementById("roomHeader").textContent = `Room: ${room}`;

    const statusEl = document.getElementById("status");
    const messagesEl = document.getElementById("messages");

    //---------------------------------------------
    // WEBSOCKET INIT (Person A plugs in here)
    //---------------------------------------------
    let ws = null;

    function connectWebSocket() {
        // Replace with your actual backend server:
        ws = new WebSocket(`ws://localhost:8000/ws/${room}`);

        ws.onopen = () => setStatus(true);
        ws.onclose = () => setStatus(false);

        ws.onmessage = event => {
            const data = event.data;
            addMessage(data, "them");

            // Person B: handle signaling messages here
            // handleSignaling(JSON.parse(data));
        };
    }

    connectWebSocket();


    //---------------------------------------------
    // MESSAGE SENDING (DataChannel or WebSocket)
    //---------------------------------------------
    function sendMessage() {
        const input = document.getElementById("chatInput");
        const message = input.value.trim();
        if (!message) return;

        addMessage(message, "you");
        input.value = "";

        // If using WebRTC DataChannel:
        // dataChannel.send(message);

        // TEMP: Send via WS for demo
        ws.send(message);
    }
    window.sendMessage = sendMessage;


    //---------------------------------------------
    // UI HELPERS
    //---------------------------------------------
    function addMessage(text, sender) {
        const div = document.createElement("div");
        div.className = "message " + sender;
        div.textContent = sender === "you" ? `You: ${text}` : `Peer: ${text}`;
        messagesEl.appendChild(div);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function setStatus(isConnected) {
        if (!statusEl) return;
        statusEl.textContent = isConnected ? "Connected" : "Disconnected";
        statusEl.className = "status " + (isConnected ? "connected" : "disconnected");
    }
}
