// app.js

'use strict';

// Global error handler to catch any uncaught exceptions
window.onerror = function (message, source, lineno, colno, error) {
  console.error('Global error handler:', message, 'at', source + ':' + lineno + ':' + colno);
};

console.log('app.js is loaded');

// Replace with your actual Spreadsheet ID and Sheet Name
const SPREADSHEET_ID = '1Yum89FFIcJgZ7kH6ZTbfq_5fhxktSu4Cg-juFLkoqts'; // Replace with your actual Spreadsheet ID
const SHEET_NAME = 'Sheet1'; // Replace with your actual sheet name

// Adjust the query if your data is not in column A
const QUERY = encodeURIComponent('SELECT A');

// Name of the callback function
const CALLBACK_NAME = 'handleData';

// Construct the URL to fetch data using the Google Visualization API with JSONP
const JSONP_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?sheet=${SHEET_NAME}&tq=${QUERY}&tqx=responseHandler:${CALLBACK_NAME}`;

console.log('JSONP_URL:', JSONP_URL);

let restaurants = [];
let excludedRestaurants = [];
let wheel;
let wheelSpinning = false; // Flag to track if the wheel is spinning

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
  script.onerror = (event) => {
    console.error('Error loading JSONP script:', event);
    console.error('Failed to load script:', script.src);
  };
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

    const itemDiv = document.createElement('div');
    itemDiv.className = 'restaurant-item';

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

    itemDiv.appendChild(checkbox);
    itemDiv.appendChild(label);

    container.appendChild(itemDiv);
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

  // Define a set of colors for the wheel segments
  const colors = ['#f94144', '#f3722c', '#f9c74f', '#90be6d', '#43aa8b', '#577590', '#277da1'];

  const segments = availableRestaurants.map((restaurant, index) => ({
    fillStyle: colors[index % colors.length],
    text: restaurant,
    textFontSize: 18,
    textFillStyle: '#fff',
  }));

  console.log('Wheel segments:', segments);

  // Clear existing wheel if any
  if (wheel) {
    wheel.stopAnimation(false); // Stop the animation, false as param so callback is not invoked
    if (wheel.animation && wheel.animation.tween) {
      wheel.animation.tween.kill(); // Kill the TweenMax animation instance
    }
    wheel = null;
  }

  wheel = new Winwheel({
    canvasId: 'wheelCanvas',
    numSegments: segments.length,
    segments: segments,
    lineWidth: 2,
    rotationAngle: 0, // Reset rotation angle
    animation: {
      type: 'spinToStop',
      duration: 5,
      spins: 8,
      callbackFinished: displayResult,
      callbackAfter: drawPointer,
    },
  });

  wheel.draw(); // Draw the wheel in its initial state
  drawPointer();
}

// Function to draw a pointer on the canvas
function drawPointer() {
  const canvas = document.getElementById('wheelCanvas');
  if (!canvas) {
    console.error('Element with ID "wheelCanvas" not found in the DOM');
    return;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('Could not get 2D context for canvas');
    return;
  }

  // Clear previous pointer
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  wheel.draw(); // Redraw the wheel
  // Draw the pointer
  ctx.fillStyle = '#333';
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2 - 15, 0);
  ctx.lineTo(canvas.width / 2 + 15, 0);
  ctx.lineTo(canvas.width / 2, 30);
  ctx.closePath();
  ctx.fill();
}

// Display the selected restaurant after the wheel stops spinning
function displayResult(indicatedSegment) {
  console.log('displayResult() is called');
  console.log('Indicated segment:', indicatedSegment);

  document.getElementById('selectedRestaurant').innerText = `You should eat at: ${indicatedSegment.text}`;

  // Only reset the spinning flag
  wheelSpinning = false; // Allow the wheel to be spun again
}

// Event listener for the "Spin the Wheel!" button
const spinButton = document.getElementById('spinButton');
if (spinButton) {
  spinButton.addEventListener('click', () => {
    console.log('"Spin the Wheel!" button clicked');
    if (wheel) {
      if (!wheelSpinning) {
        // Properly stop any existing animation and reset the wheel
        wheel.stopAnimation(false); // Stop the animation; false to prevent callback
        if (wheel.animation && wheel.animation.tween) {
          wheel.animation.tween.kill(); // Kill the TweenMax animation instance
        }
        wheel.rotationAngle = 0; // Reset rotation angle
        wheel.draw(); // Redraw the wheel at the starting position
        drawPointer(); // Redraw the pointer

        // Set up the animation for the new spin
        wheel.animation = {
          type: 'spinToStop',
          duration: 5,
          spins: 8,
          callbackFinished: displayResult,
          callbackAfter: drawPointer,
        };

        wheel.startAnimation();
        wheelSpinning = true;
      } else {
        console.warn('Wheel is already spinning');
      }
    } else {
      console.warn('Wheel is not initialized');
    }
  });
} else {
  console.error('Element with ID "spinButton" not found in the DOM');
}

// Start the application
init();