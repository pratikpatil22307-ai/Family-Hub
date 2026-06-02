// =====================================
// MONTH DATA
// Easy to extend later
// =====================================
const months = [
  {
    name: 'January',
    emoji: '❄️',
    description: 'New year plans and goals.'
  },
  {
    name: 'February',
    emoji: '❤️',
    description: 'Family celebrations and love.'
  },
  {
    name: 'March',
    emoji: '🌸',
    description: 'Spring memories and outings.'
  },
  {
    name: 'April',
    emoji: '🌦️',
    description: 'Events and family activities.'
  },
  {
    name: 'May',
    emoji: '🌷',
    description: 'Birthdays and gatherings.'
  },
  {
    name: 'June',
    emoji: '☀️',
    description: 'Summer fun begins.'
  },
  {
    name: 'July',
    emoji: '🏖️',
    description: 'Trips and vacations.'
  },
  {
    name: 'August',
    emoji: '🌻',
    description: 'Family adventures.'
  },
  {
    name: 'September',
    emoji: '🍂',
    description: 'Back-to-school season.'
  },
  {
    name: 'October',
    emoji: '🎃',
    description: 'Festive family moments.'
  },
  {
    name: 'November',
    emoji: '🦃',
    description: 'Thankful memories.'
  },
  {
    name: 'December',
    emoji: '🎄',
    description: 'Holiday celebrations.'
  }
];

// =====================================
// GET ELEMENTS FROM HTML
// =====================================
const monthsGrid = document.getElementById('monthsGrid');
const previewImage = document.getElementById('previewImage');
const previewTitle = document.getElementById('previewTitle');
const previewDescription = document.getElementById('previewDescription');

// =====================================
// UPDATE THE PREVIEW PANEL
// =====================================
function updatePreview(month) {
  previewImage.textContent = month.emoji;
  previewTitle.textContent = month.name;
  previewDescription.textContent = month.description;
}

// =====================================
// CREATE ALL MONTH CARDS
// =====================================
function renderMonths() {

  months.forEach((month, index) => {

    // Create a new div
    const card = document.createElement('div');

    // Add CSS class
    card.classList.add('month-card');

    // Make January selected initially
    if (index === 0) {
      card.classList.add('active');
    }

    // Add card content
    card.innerHTML = `
      <div class="thumbnail">${month.emoji}</div>
      <h3>${month.name}</h3>
    `;

    // Click event
    card.addEventListener('click', () => {

      // Remove active class from all cards
      document
        .querySelectorAll('.month-card')
        .forEach(c => c.classList.remove('active'));

      // Add active class to clicked card
      card.classList.add('active');

      // Update preview panel
      updatePreview(month);
    });

    // Add card to grid
    monthsGrid.appendChild(card);
  });

  // Show January when page loads
  updatePreview(months[0]);
}

// =====================================
// START THE APP
// =====================================
renderMonths();