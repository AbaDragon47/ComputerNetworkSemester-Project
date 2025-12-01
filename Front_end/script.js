//---------------------------------------------
// PAGE REDIRECTS
//---------------------------------------------
function createRoom() {
    const random = Math.random().toString(36).substring(2, 8);
    window.location.href = `room.html?room=${random}`;
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

    function connectWebSocket() {
        ws = new WebSocket(`ws://localhost:8000/ws/${room}`);

        ws.onopen = () => setStatus(true);
        ws.onclose = () => setStatus(false);

        ws.onmessage = event => {
            const data = event.data;
            addMessage(data, "them");
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