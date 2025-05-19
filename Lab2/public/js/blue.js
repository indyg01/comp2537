// Select the button and the container div
const button = document.querySelector('#myButton');
const container = document.querySelector('.container');

// Add an event listener to the button
button.addEventListener('click', () => {
    // Check the current background color and toggle it
    if (container.style.backgroundColor === 'blue') {
        container.style.backgroundColor = 'inherit';
        button.textContent = 'Click to make me Blue!';
    } else {
        container.style.backgroundColor = 'blue';
        button.textContent = 'Click to change me back!';
    }
});