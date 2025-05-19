// Select the "dancing-text" div
const dancingText = document.getElementById('dancing-text');

// Function to make the text "dance" and change its hue
function makeTextDance() {
    let angle = 0;

    setInterval(() => {
        angle += 5;
        const x = Math.sin(angle * (Math.PI / 180)) * 10; // Horizontal movement
        const y = Math.cos(angle * (Math.PI / 180)) * 10; // Vertical movement

        dancingText.style.transform = `translate(${x}px, ${y}px)`;
        dancingText.style.color = `hsl(${angle % 360}, 100%, 70%)`; // Change color based on angle
    }, 30); // Update every 50ms
}

// Start the dancing effect
makeTextDance();