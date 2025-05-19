document.addEventListener('DOMContentLoaded', () => {
    const counterElement = document.getElementById('counter');

    // Load initial counter value from server
    fetch('/api/counter')
        .then(res => res.json())
        .then(data => {
            counterElement.textContent = data.counter;
        });

    document.getElementById('upButton').addEventListener('click', () => {
        fetch('/api/counter/up', { method: 'POST' })
            .then(res => res.json())
            .then(data => {
                counterElement.textContent = data.counter;
            });
    });

    document.getElementById('downButton').addEventListener('click', () => {
        fetch('/api/counter/down', { method: 'POST' })
            .then(res => res.json())
            .then(data => {
                counterElement.textContent = data.counter;
            });
    });
});