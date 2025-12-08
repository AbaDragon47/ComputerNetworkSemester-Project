//const API_BASE = `http://${window.location.hostname}:8000`;//--> for testing one 
//device

const BACKEND_HOST = window.location.hostname; // same host as frontend
const API_BASE = `http://${BACKEND_HOST}:8000`;
const WS_BASE  = `ws://${BACKEND_HOST}:8000`;
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
    // WEBSOCKET INIT
    //---------------------------------------------
    let ws = null;

    function addSystemMessage(text) {
        const div = document.createElement("div");
        div.className = "message system";   // you can style this in CSS
        div.textContent = text;
        messagesEl.appendChild(div);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function connectWebSocket() {
        
        //ws = new WebSocket(`ws://localhost:8000/ws/${room}`);

        const url = `${WS_BASE}/ws/${room}`;
        console.log("Connecting WebSocket to:", url);
        ws = new WebSocket(url);

        ws.onopen = () => setStatus(true);
        ws.onclose = () => setStatus(false);
        ws.onerror = (err) => {
            console.error("WebSocket error:", err);
            setStatus(false);
        };


        ws.onmessage = event => {
            let raw = event.data;

            // Try to parse as JSON for system messages
            try {
                const msg = JSON.parse(raw);

                if (msg.type === "system") {
                    if (msg.event === "join") {
                        addSystemMessage(`Peer joined the room.`);
                    } else if (msg.event === "leave") {
                        addSystemMessage(`Peer left the room.`);
                    } else if (msg.event === "welcome") {
                        console.log("Assigned client_id:", msg.client_id);
                    }
                    return; // don't show system JSON as normal chat
                }

                // If later you send JSON chat messages, you can handle them here
                // e.g., if (msg.type === "chat") addMessage(msg.text, "them");
            } catch (e) {
                // Not JSON => treat as normal chat text
            }

        // Fallback: plain text chat (what you have now)
        addMessage(raw, "them");
        };
    }

    connectWebSocket();

    //---------------------------------------------
    // MESSAGE SENDING
    //---------------------------------------------
    function sendMessage() {
        const input = document.getElementById("chatInput");
        const message = input.value.trim();
        if (!message) return;

        addMessage(message, "you");
        input.value = "";
        ws.send(message);
    }
    window.sendMessage = sendMessage;


    //---------------------------------------------
    // COPY TO CLIPBOARD LOGIC (Updated)
    //---------------------------------------------
    async function copyToClipboard() {
        const btn = document.getElementById("copyBtn");
        const originalText = btn.textContent;
        const url = window.location.href;

        try {
            await navigator.clipboard.writeText(url);
            
            // Visual feedback
            btn.textContent = "Copied! ✅";
            btn.style.background = "var(--success)";
            btn.style.color = "#000";

            // Revert after 2 seconds
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = "";
                btn.style.color = "";
            }, 2000);

        } catch (err) {
            console.error("Failed to copy:", err);
            // Fallback for older browsers or if permission denied
            alert("Could not copy automatically. URL: " + url);
        }
    }
    // Expose function to global scope
    window.copyToClipboard = copyToClipboard;


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