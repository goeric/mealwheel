// app.js

'use strict';

// Global error handler to catch any uncaught exceptions
window.onerror = function(message, source, lineno, colno, error) {
  console.error('Global error handler:', message, 'at', source + ':' + lineno + ':' + colno);
};

console.log('app.js is loaded');

// Replace with your actual Spreadsheet ID and Sheet Name
const SPREADSHEET_ID = '1Yum89FFIcJgZ7kH6ZTbfq_5fhxktSu4Cg-juFLkoqts'; // Replace with your actual Spreadsheet ID
const SHEET_NAME = 'Sheet1'; // Replace with your actual sheet name

// Adjust the query if your data is not in column A
const QUERY = encodeURIComponent('SELECT A'); // Adjust if your data is not in column A

// Name of the callback function
const CALLBACK_NAME = 'handleData';

// Construct the URL to fetch data using the Google Visualization API with JSONP
const JSONP_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?sheet=${SHEET_NAME}&tq=${QUERY}&tqx=responseHandler:${CALLBACK_NAME}`;

console.log('JSONP_URL:', JSONP_URL);

let restaurants = [];
let excludedRestaurants = [];
let wheel;

// Initialize the application
function init() {
  console.log('init() is called');
  fetchRestaurants();
}

// Fetch restaurant data using JSONP
function fetchRestaurants() {
  console.log('fetchRestaurants() is called');
  console.log('Creating script tag to fetch data from:', JSONP_URL);
  
  // Create a script tag
  const script = document.createElement('script');
  script.src = JSONP_URL;
  script.onload = () => console.log('JSONP script loaded successfully');
  script.onerror = () => console.error('Error loading JSONP script');
  document.head.appendChild(script);
}

// Callback function to handle the data
function handleData(jsonData) {
  console.log('handleData() is called');
  console.log('jsonData:', jsonData);
  
  try {
    const rows = jsonData.table.rows;
    console.log('rows:', rows);

    // Extract restaurant names from the rows
    restaurants = rows.map(row => {
      const cell = row.c[0];
      return cell ? cell.v : null;
    }).filter(Boolean);

    console.log('restaurants array:', restaurants);

    // Continue with rendering and creating the wheel
    renderRestaurantList();
    createWheel();
  } catch (error) {
    console.error('Error processing data in handleData():', error);
  }
}

// Render the list of restaurants with checkboxes for exclusion
function renderRestaurantList() {
  console.log('renderRestaurantList() is called');
  
  const container = document.getElementById('restaurantList');
  if (!container) {
    console.error('Element with ID "restaurantList" not found in the DOM');
    return;
  }
  
  container.innerHTML = '';

  restaurants.forEach(restaurant => {
    console.log('Adding restaurant to list:', restaurant);
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = restaurant;
    checkbox.value = restaurant;
    checkbox.checked = true;

    checkbox.addEventListener('change', () => {
      console.log(`Checkbox for ${restaurant} changed, checked:`, checkbox.checked);
      
      if (checkbox.checked) {
        excludedRestaurants = excludedRestaurants.filter(r => r !== restaurant);
      } else {
        excludedRestaurants.push(restaurant);
      }
      createWheel();
    });

    const label = document.createElement('label');
    label.htmlFor = restaurant;
    label.innerText = restaurant;

    const div = document.createElement('div');
    div.appendChild(checkbox);
    div.appendChild(label);

    container.appendChild(div);
  });
}

// Create the spinning wheel
function createWheel() {
  console.log('createWheel() is called');
  
  const availableRestaurants = restaurants.filter(r => !excludedRestaurants.includes(r));
  console.log('Available restaurants for the wheel:', availableRestaurants);

  if (availableRestaurants.length === 0) {
    console.warn('No restaurants selected! Cannot create wheel.');
    document.getElementById('selectedRestaurant').innerText = 'No restaurants selected!';
    return;
  }

  const segments = availableRestaurants.map(restaurant => ({
    fillStyle: getRandomColor(),
    text: restaurant,
  }));

  console.log('Wheel segments:', segments);

  const canvas = document.getElementById('wheelCanvas');
  if (!canvas) {
    console.error('Element with ID "wheelCanvas" not found in the DOM');
    return;
  }
  
  const context = canvas.getContext('2d');
  if (!context) {
    console.error('Could not get 2D context for canvas');
    return;
  }
  
  // Clear the existing wheel
  context.clearRect(0, 0, canvas.width, canvas.height);

  // Create a new wheel
  wheel = new Winwheel({
    canvasId: 'wheelCanvas',
    numSegments: segments.length,
    segments: segments,
    animation: {
      type: 'spinToStop',
      duration: 5,
      spins: 8,
      callbackFinished: displayResult,
      callbackAfter: drawPointer,
    },
  });

  // Draw pointer on the canvas
  drawPointer();
}

// Generate a random color for each segment
function getRandomColor() {
  const color = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
  console.log('Generated random color:', color);
  return color;
}

// Display the selected restaurant after the wheel stops spinning
function displayResult(indicatedSegment) {
  console.log('displayResult() is called');
  console.log('Indicated segment:', indicatedSegment);

  document.getElementById('selectedRestaurant').innerText = `You should eat at: ${indicatedSegment.text}`;
}

// Event listener for the "Spin the Wheel!" button
const spinButton = document.getElementById('spinButton');
if (spinButton) {
  spinButton.addEventListener('click', () => {
    console.log('"Spin the Wheel!" button clicked');
    if (wheel) {
      wheel.startAnimation();
    } else {
      console.warn('Wheel is not initialized');
    }
  });
} else {
  console.error('Element with ID "spinButton" not found in the DOM');
}

// Function to draw a pointer on the canvas
function drawPointer() {
  const canvas = document.getElementById('wheelCanvas');
  if (!canvas) {
    console.error('Element with ID "wheelCanvas" not found in the DOM');
    return;
  }
  
  const context = canvas.getContext('2d');
  if (!context) {
    console.error('Could not get 2D context for canvas');
    return;
  }

  context.strokeStyle = 'black';
  context.fillStyle = 'red';
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(250 - 10, 0); // Adjusted for canvas size
  context.lineTo(250 + 10, 0);
  context.lineTo(250, 30);
  context.lineTo(250 - 10, 0);
  context.stroke();
  context.fill();
}

// Start the application
init();
