const calendarContainer = document.getElementById("calendarContainer");

const STORAGE_KEY = "family_calendar_final_v2";

let savedData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
  highlights: {},
  notes: {},
  flags: {}
};

const months = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

const emojis = [
  "❄️","❤️","🌸","🌦️","🌷","☀️",
  "🏖️","🌻","🍂","🎃","🦃","🎄"
];

/* 🌄 images */
const monthImages = [
  "https://images.unsplash.com/photo-1483664852095-d6cc6870702d",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba",
  "https://images.unsplash.com/photo-1520763185298-1b434c919102",
  "https://images.unsplash.com/photo-1501004318641-b39e6451bec6",
  "https://images.unsplash.com/photo-1500375592092-40eb2168fd21",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470",
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
  "https://images.unsplash.com/photo-1541542684-4a6f1c7a7c13",
  "https://images.unsplash.com/photo-1512389142860-9c449e58a543"
];

function getDays(monthIndex) {
  return new Date(2024, monthIndex + 1, 0).getDate();
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(savedData));
}

/* ------------------------
   ACTIONS
-------------------------*/

function toggleHighlight(month, day, cell) {
  if (!savedData.highlights[month]) savedData.highlights[month] = {};

  savedData.highlights[month][day] =
    !savedData.highlights[month][day];

  save();
}

function setNote(month, day) {
  const old = savedData.notes?.[month]?.[day] || "";
  const text = prompt("Add note for this date:", old);

  if (!savedData.notes[month]) savedData.notes[month] = {};

  if (text === null) return;

  if (text.trim() === "") {
    delete savedData.notes[month][day];
  } else {
    savedData.notes[month][day] = text;
  }

  save();
  render();
}

function toggleFlag(month, day) {
  if (!savedData.flags[month]) savedData.flags[month] = {};

  savedData.flags[month][day] =
    !savedData.flags[month][day];

  save();
  render();
}

/* ------------------------
   MONTH BUILDER
-------------------------*/

function createMonth(month, index) {
  const block = document.createElement("div");
block.className = "month-block";

block.style.background = getMonthTheme(index);
  const img = document.createElement("img");
  img.className = "month-image";
  img.src = monthImages[index];
  img.alt = month;

  const content = document.createElement("div");
  content.className = "month-content";

  const title = document.createElement("div");
  title.className = "month-title";
  title.innerHTML = `${emojis[index]} ${month}`;

  const grid = document.createElement("div");
  grid.className = "dates-grid";

  const days = getDays(index);

  if (!savedData.highlights[month]) savedData.highlights[month] = {};
  if (!savedData.notes[month]) savedData.notes[month] = {};
  if (!savedData.flags[month]) savedData.flags[month] = {};

  for (let i = 1; i <= days; i++) {
    const cell = document.createElement("div");
    cell.className = "date-cell";

    if (savedData.highlights[month][i]) {
      cell.classList.add("selected");
    }

    const num = document.createElement("div");
    num.textContent = i;

    const note = document.createElement("div");
    note.className = "note";
    note.textContent = savedData.notes[month][i] || "";

    if (savedData.flags[month][i]) {
      const flag = document.createElement("div");
      flag.className = "flag";
      flag.textContent = "⭐";
      cell.appendChild(flag);
    }

    cell.appendChild(num);
    cell.appendChild(note);

    /* CLICK = highlight */
    cell.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleHighlight(month, i, cell);
      cell.classList.toggle("selected");
    });

    /* DOUBLE CLICK = note */
    cell.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      setNote(month, i);
    });

    /* RIGHT CLICK = flag */
    cell.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleFlag(month, i);
    });

    grid.appendChild(cell);
  }

  content.appendChild(title);
  content.appendChild(grid);

  block.appendChild(img);
  block.appendChild(content);

  return block;
}

/* ------------------------
   RENDER
-------------------------*/

function render() {
  calendarContainer.innerHTML = "";

  months.forEach((m, i) => {
    const el = createMonth(m, i);
    calendarContainer.appendChild(el);
  });

  setTimeout(initScrollEffects, 50);
}

/* ------------------------
   SMOOTH SCROLL FX
-------------------------*/

function initScrollEffects() {
  const cards = document.querySelectorAll(".month-block");

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
      }
    });
  }, {
    threshold: 0.1
  });

  cards.forEach(card => {
    card.style.opacity = "0";
    card.style.transform = "translateY(20px)";
    observer.observe(card);
  });
}

/* INIT */
render();
function getMonthTheme(index) {
  // Winter: Dec, Jan, Feb
  if ([11, 0, 1].includes(index)) {
    return "linear-gradient(135deg, #89f7fe, #66a6ff)"; // cool blue winter
  }

  // Spring: Mar, Apr, May
  if ([2, 3, 4].includes(index)) {
    return "linear-gradient(135deg, #fbc2eb, #a6c1ee)"; // soft pink/purple spring
  }

  // Summer: Jun, Jul
  if ([5, 6].includes(index)) {
    return "linear-gradient(135deg, #fddb92, #ffb347)"; // warm yellow-orange
  }

  // Monsoon / Late Summer: Aug, Sep
  if ([7, 8].includes(index)) {
    return "linear-gradient(135deg, #89f7fe, #66a6ff)"; // fresh blue-green
  }

  // Autumn: Oct, Nov
  if ([9, 10].includes(index)) {
    return "linear-gradient(135deg, #ff9a9e, #fecfef)"; // warm pink-orange
  }

  return "linear-gradient(135deg, #ff6a88, #ff99ac)"; // fallback
}