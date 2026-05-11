document.addEventListener('DOMContentLoaded', () => {
    const greetingElement = document.getElementById('greeting');
    
    setTimeout(() => {
        greetingElement.textContent = 'Привет :)';
    }, 500);
});
