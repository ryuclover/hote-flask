document.addEventListener('DOMContentLoaded', () => {
    const toggleButton = document.getElementById('toggle-menu');
    const dropdownMenu = document.getElementById('dropdown-menu');

    toggleButton.addEventListener('click', () => {
        dropdownMenu.classList.toggle('show');
    });

    document.addEventListener('click', (event) => {
        if (!toggleButton.contains(event.target) && !dropdownMenu.contains(event.target)) {
            dropdownMenu.classList.remove('show');
        }
    });
});
