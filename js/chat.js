// =============================================
// CHAT APPLICATION - FAMILY HUB
// Features:
// - Main family chat room (all members)
// - Create private chat rooms for specific members
// - Messages persist in localStorage until manually deleted
// =============================================

const STORAGE_KEY = "family_chat_rooms";
const MEMBER_STORAGE_KEY = "current_family_member";
const MAIN_ROOM_ID = "main";

// Family members
const familyMembers = {
  Mom: { name: "Mom (Admin)", avatar: "👩", initials: "MA" },
  Dad: { name: "Dad", avatar: "👨", initials: "DA" },
  Alice: { name: "Alice", avatar: "👧", initials: "AL" },
  Ben: { name: "Ben", avatar: "👦", initials: "BN" }
};

// DOM Elements
const currentMemberSelect = document.getElementById("currentMember");
const messagesContainer = document.getElementById("messagesContainer");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const memberCount = document.getElementById("memberCount");
const roomsList = document.getElementById("roomsList");
const createRoomBtn = document.getElementById("createRoomBtn");
const createRoomModal = document.getElementById("createRoomModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelRoomBtn = document.getElementById("cancelRoomBtn");
const createRoomConfirmBtn = document.getElementById("createRoomConfirmBtn");
const roomNameInput = document.getElementById("roomName");
const membersCheckboxes = document.getElementById("membersCheckboxes");

// Room options modal
const roomOptionsModal = document.getElementById("roomOptionsModal");
const closeOptionsModalBtn = document.getElementById("closeOptionsModalBtn");
const viewMembersBtn = document.getElementById("viewMembersBtn");
const leaveRoomBtn = document.getElementById("leaveRoomBtn");
const deleteRoomBtn = document.getElementById("deleteRoomBtn");

// Members modal
const membersModal = document.getElementById("membersModal");
const closeMembersModalBtn = document.getElementById("closeMembersModalBtn");
const membersListModal = document.getElementById("membersListModal");

// App state
let currentMember = localStorage.getItem(MEMBER_STORAGE_KEY) || "Mom";
let currentRoomId = MAIN_ROOM_ID;
let rooms = loadRooms();
let selectedMembersForNewRoom = new Set();

// =============================================
// INITIALIZE APP
// =============================================
function init() {
  currentMemberSelect.value = currentMember;
  generateMemberCheckboxes();
  renderRoomsList();
  switchToRoom(MAIN_ROOM_ID);
  setupEventListeners();
  updateMemberCount();
  
  // Auto-refresh messages periodically
  setInterval(() => {
    let storedRooms = loadRooms();
    if (JSON.stringify(storedRooms) !== JSON.stringify(rooms)) {
      rooms = storedRooms;
      if (currentRoomId) {
        renderMessages();
      }
    }
  }, 500);
}

// =============================================
// LOAD/SAVE ROOMS FROM LOCALSTORAGE
// =============================================
function loadRooms() {
  let rooms = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  
  // Ensure main room exists
  if (!rooms[MAIN_ROOM_ID]) {
    rooms[MAIN_ROOM_ID] = {
      id: MAIN_ROOM_ID,
      name: "Family Chat",
      description: "Welcome to the family chat! All members can see this conversation.",
      type: "main",
      members: Object.keys(familyMembers),
      messages: [],
      createdAt: new Date().toISOString()
    };
  }
  
  return rooms;
}

function saveRooms() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
}

// =============================================
// GENERATE MEMBER CHECKBOXES
// =============================================
function generateMemberCheckboxes() {
  membersCheckboxes.innerHTML = "";
  
  Object.entries(familyMembers).forEach(([key, member]) => {
    const checkbox = document.createElement("div");
    checkbox.className = "checkbox-item";
    
    const inputId = `member-${key}`;
    const input = document.createElement("input");
    input.type = "checkbox";
    input.id = inputId;
    input.value = key;
    input.addEventListener("change", (e) => {
      if (e.target.checked) {
        selectedMembersForNewRoom.add(key);
      } else {
        selectedMembersForNewRoom.delete(key);
      }
    });
    
    const label = document.createElement("label");
    label.htmlFor = inputId;
    label.textContent = `${member.avatar} ${member.name}`;
    
    checkbox.appendChild(input);
    checkbox.appendChild(label);
    membersCheckboxes.appendChild(checkbox);
  });
}

// =============================================
// EVENT LISTENERS
// =============================================
function setupEventListeners() {
  // Send message
  sendBtn.addEventListener("click", sendMessage);
  messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  
  // Auto-expand textarea
  messageInput.addEventListener("input", () => {
    messageInput.style.height = "auto";
    messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + "px";
  });
  
  // Change current member
  currentMemberSelect.addEventListener("change", (e) => {
    currentMember = e.target.value;
    localStorage.setItem(MEMBER_STORAGE_KEY, currentMember);
  });
  
  // Create room button
  createRoomBtn.addEventListener("click", openCreateRoomModal);
  closeModalBtn.addEventListener("click", closeCreateRoomModal);
  cancelRoomBtn.addEventListener("click", closeCreateRoomModal);
  createRoomConfirmBtn.addEventListener("click", createNewRoom);
  
  // Room options modal
  closeOptionsModalBtn.addEventListener("click", closeRoomOptionsModal);
  viewMembersBtn.addEventListener("click", viewRoomMembers);
  leaveRoomBtn.addEventListener("click", leaveCurrentRoom);
  deleteRoomBtn.addEventListener("click", deleteCurrentRoom);
  
  // Members modal
  closeMembersModalBtn.addEventListener("click", closeMembersModal);
  
  // Close modals on backdrop click
  document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("show");
      }
    });
  });
}

// =============================================
// CREATE ROOM - MODAL
// =============================================
function openCreateRoomModal() {
  roomNameInput.value = "";
  selectedMembersForNewRoom.clear();
  document.querySelectorAll(".checkbox-item input").forEach(cb => cb.checked = false);
  createRoomModal.classList.add("show");
  roomNameInput.focus();
}

function closeCreateRoomModal() {
  createRoomModal.classList.remove("show");
}

function createNewRoom() {
  const roomName = roomNameInput.value.trim();
  const members = Array.from(selectedMembersForNewRoom);
  
  if (!roomName) {
    alert("Please enter a room name");
    return;
  }
  
  if (members.length === 0) {
    alert("Please select at least one member");
    return;
  }
  
  const roomId = `room_${Date.now()}`;
  const newRoom = {
    id: roomId,
    name: roomName,
    description: `Private chat with ${members.map(m => familyMembers[m].name).join(", ")}`,
    type: "private",
    members: members,
    messages: [],
    creator: currentMember,
    createdAt: new Date().toISOString()
  };
  
  rooms[roomId] = newRoom;
  saveRooms();
  
  renderRoomsList();
  switchToRoom(roomId);
  closeCreateRoomModal();
}

// =============================================
// SWITCH ROOM
// =============================================
function switchToRoom(roomId) {
  const room = rooms[roomId];
  if (!room) return;
  
  // Check if current member has access to this room
  if (!room.members.includes(currentMember) && room.type !== "main") {
    alert("You don't have access to this room");
    return;
  }
  
  currentRoomId = roomId;
  
  // Update header
  document.getElementById("currentRoomTitle").textContent = room.name;
  document.getElementById("currentRoomDesc").textContent = room.description;
  
  // Update delete button visibility
  deleteRoomBtn.style.display = room.type === "main" ? "none" : 
                                 (room.creator === currentMember ? "block" : "none");
  
  // Render messages
  renderMessages();
  scrollToBottom();
  
  // Update room list styling
  document.querySelectorAll(".room-item").forEach(item => {
    item.classList.remove("active");
    if (item.dataset.roomId === roomId) {
      item.classList.add("active");
    }
  });
}

// =============================================
// RENDER ROOMS LIST
// =============================================
function renderRoomsList() {
  roomsList.innerHTML = "";
  
  // Filter rooms based on current member's access
  const accessibleRooms = Object.values(rooms).filter(room => {
    return room.type === "main" || room.members.includes(currentMember);
  });
  
  accessibleRooms.forEach(room => {
    const roomItem = document.createElement("div");
    roomItem.className = `room-item ${room.id === currentRoomId ? "active" : ""}`;
    roomItem.dataset.roomId = room.id;
    
    const info = document.createElement("div");
    info.className = "room-item-info";
    
    const name = document.createElement("div");
    name.className = "room-item-name";
    name.textContent = room.name;
    
    const meta = document.createElement("div");
    meta.className = "room-item-meta";
    meta.textContent = `${room.members.length} members • ${room.messages.length} messages`;
    
    info.appendChild(name);
    info.appendChild(meta);
    
    const optionsBtn = document.createElement("button");
    optionsBtn.className = "room-options-btn";
    optionsBtn.textContent = "⋮";
    optionsBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      openRoomOptionsModal(room.id);
    });
    
    roomItem.appendChild(info);
    roomItem.appendChild(optionsBtn);
    
    roomItem.addEventListener("click", () => switchToRoom(room.id));
    roomsList.appendChild(roomItem);
  });
}

// =============================================
// ROOM OPTIONS MODAL
// =============================================
function openRoomOptionsModal(roomId) {
  currentRoomId = roomId;
  roomOptionsModal.classList.add("show");
}

function closeRoomOptionsModal() {
  roomOptionsModal.classList.remove("show");
}

function viewRoomMembers() {
  const room = rooms[currentRoomId];
  if (!room) return;
  
  membersListModal.innerHTML = room.members.map(memberId => {
    const member = familyMembers[memberId];
    return `
      <div class="member-item">
        <div class="avatar">${member.initials}</div>
        <span>${member.name}</span>
      </div>
    `;
  }).join("");
  
  closeRoomOptionsModal();
  membersModal.classList.add("show");
}

function closeMembersModal() {
  membersModal.classList.remove("show");
}

function leaveCurrentRoom() {
  const room = rooms[currentRoomId];
  if (!room || room.type === "main") {
    alert("You cannot leave the main chat room");
    return;
  }
  
  room.members = room.members.filter(m => m !== currentMember);
  saveRooms();
  renderRoomsList();
  switchToRoom(MAIN_ROOM_ID);
  closeRoomOptionsModal();
}

function deleteCurrentRoom() {
  const room = rooms[currentRoomId];
  if (!room || room.type === "main") {
    alert("You cannot delete the main chat room");
    return;
  }
  
  if (confirm(`Delete room "${room.name}" permanently? This cannot be undone.`)) {
    delete rooms[currentRoomId];
    saveRooms();
    renderRoomsList();
    switchToRoom(MAIN_ROOM_ID);
    closeRoomOptionsModal();
  }
}

// =============================================
// SEND MESSAGE
// =============================================
function sendMessage() {
  const messageText = messageInput.value.trim();
  
  if (!messageText || !currentMember || !currentRoomId) {
    return;
  }
  
  const room = rooms[currentRoomId];
  if (!room) return;
  
  const message = {
    id: Date.now(),
    sender: currentMember,
    text: messageText,
    timestamp: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    })
  };
  
  room.messages.push(message);
  saveRooms();
  
  messageInput.value = "";
  messageInput.style.height = "auto";
  
  sendBtn.disabled = true;
  setTimeout(() => {
    sendBtn.disabled = false;
  }, 100);
  
  renderMessages();
  scrollToBottom();
}

// =============================================
// RENDER MESSAGES
// =============================================
function renderMessages() {
  const room = rooms[currentRoomId];
  if (!room) return;
  
  messagesContainer.innerHTML = "";
  
  if (room.messages.length === 0) {
    messagesContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">💬</div>
        <div class="empty-state-text">No messages yet</div>
        <div class="empty-state-subtext">Start the conversation!</div>
      </div>
    `;
    return;
  }
  
  room.messages.forEach((message) => {
    const messageElement = createMessageElement(message);
    messagesContainer.appendChild(messageElement);
  });
}

// =============================================
// CREATE MESSAGE ELEMENT
// =============================================
function createMessageElement(message) {
  const isOwnMessage = message.sender === currentMember;
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${isOwnMessage ? "own" : "other"}`;
  
  const bubble = document.createElement("div");
  bubble.className = "message-bubble";
  
  // Sender name
  const senderElement = document.createElement("span");
  senderElement.className = "message-sender";
  const member = familyMembers[message.sender];
  senderElement.textContent = `${member.avatar} ${member.name}`;
  bubble.appendChild(senderElement);
  
  // Message text
  const textElement = document.createElement("div");
  textElement.style.wordWrap = "break-word";
  textElement.textContent = message.text;
  bubble.appendChild(textElement);
  
  // Timestamp
  const timeElement = document.createElement("span");
  timeElement.className = "message-time";
  timeElement.textContent = message.timestamp;
  bubble.appendChild(timeElement);
  
  messageDiv.appendChild(bubble);
  
  return messageDiv;
}

// =============================================
// SCROLL TO BOTTOM
// =============================================
function scrollToBottom() {
  setTimeout(() => {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }, 0);
}

// =============================================
// UPDATE MEMBER COUNT
// =============================================
function updateMemberCount() {
  const onlineCount = Object.keys(familyMembers).length;
  memberCount.textContent = `${onlineCount} members online`;
}

// =============================================
// INITIALIZE
// =============================================
document.addEventListener("DOMContentLoaded", init);
