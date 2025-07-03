document.addEventListener('DOMContentLoaded', () => {
    const toggleButton = document.getElementById('toggle-menu');
    const dropdownMenu = document.getElementById('navLinks'); // Fixed: using correct nav links ID
    const userDropdown = document.getElementById('userDropdown');
    const userButton = userDropdown?.querySelector('.user-button');
    const dropdownContent = userDropdown?.querySelector('.dropdown-content');
    
    // Hamburger menu elements
    const hamburger = document.getElementById('hamburgerMenu');
    const sideMenu = document.getElementById('sideMenu');
    const sideMenuOverlay = document.getElementById('sideMenuOverlay');
    const closeSideMenu = document.getElementById('closeSideMenu');

    // Hamburger menu functionality
    function openSideMenu() {
        if (sideMenu && sideMenuOverlay) {
            sideMenu.classList.add('show');
            sideMenuOverlay.classList.add('show');
            hamburger?.classList.add('active');
            // Prevent body scrolling when menu is open
            document.body.classList.add('menu-open');
        }
    }

    function closeSideMenuFunc() {
        if (sideMenu && sideMenuOverlay) {
            sideMenu.classList.remove('show');
            sideMenuOverlay.classList.remove('show');
            hamburger?.classList.remove('active');
            // Re-enable body scrolling
            document.body.classList.remove('menu-open');
        }
    }

    // Hamburger menu event listeners
    if (hamburger) {
        hamburger.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openSideMenu();
        });
    }
    
    if (closeSideMenu) {
        closeSideMenu.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeSideMenuFunc();
        });
    }
    
    if (sideMenuOverlay) {
        sideMenuOverlay.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeSideMenuFunc();
        });
    }

    // Close side menu with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === "Escape") {
            closeSideMenuFunc();
        }
    });

    // Prevent menu close when clicking inside the menu
    if (sideMenu) {
        sideMenu.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    // Touch gesture support for mobile
    let touchStartX = 0;
    let touchEndX = 0;

    if (sideMenu) {
        sideMenu.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });

        sideMenu.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        });

        function handleSwipe() {
            // Close menu if swiping right (away from screen)
            if (touchEndX > touchStartX + 50) {
                closeSideMenuFunc();
            }
        }
    }

    // Mobile menu toggle (tablet nav-links dropdown)
    if (toggleButton && dropdownMenu) {
        toggleButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropdownMenu.classList.toggle('show');
        });

        document.addEventListener('click', (event) => {
            if (!toggleButton.contains(event.target) && !dropdownMenu.contains(event.target)) {
                dropdownMenu.classList.remove('show');
            }
        });
        
        // Close with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                dropdownMenu.classList.remove('show');
            }
        });
    }

    // Enhanced user dropdown functionality
    if (userDropdown && userButton && dropdownContent) {
        let isHovering = false;
        let showTimeout = null;
        let hideTimeout = null;

        // Show dropdown function
        const showDropdown = () => {
            if (hideTimeout) {
                clearTimeout(hideTimeout);
                hideTimeout = null;
            }
            
            userDropdown.classList.add('show');
        };

        // Hide dropdown function
        const hideDropdown = () => {
            hideTimeout = setTimeout(() => {
                if (!isHovering) {
                    userDropdown.classList.remove('show');
                }
            }, 150); // Reduced delay for better UX
        };

        // Mouse events for button
        userButton.addEventListener('mouseenter', () => {
            isHovering = true;
            showDropdown();
        });

        userButton.addEventListener('mouseleave', () => {
            isHovering = false;
            hideDropdown();
        });

        // Mouse events for dropdown content
        dropdownContent.addEventListener('mouseenter', () => {
            isHovering = true;
            if (hideTimeout) {
                clearTimeout(hideTimeout);
                hideTimeout = null;
            }
        });

        dropdownContent.addEventListener('mouseleave', () => {
            isHovering = false;
            hideDropdown();
        });

        // Click fallback for touch devices
        userButton.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            
            if (userDropdown.classList.contains('show')) {
                userDropdown.classList.remove('show');
                isHovering = false;
            } else {
                userDropdown.classList.add('show');
                isHovering = true;
            }
        });

        // Close when clicking outside
        document.addEventListener('click', (event) => {
            if (!userDropdown.contains(event.target)) {
                userDropdown.classList.remove('show');
                isHovering = false;
                if (showTimeout) clearTimeout(showTimeout);
                if (hideTimeout) clearTimeout(hideTimeout);
            }
        });

        // Prevent dropdown from closing when clicking inside
        dropdownContent.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Handle keyboard navigation
        userButton.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                userDropdown.classList.toggle('show');
            } else if (e.key === 'Escape') {
                userDropdown.classList.remove('show');
                isHovering = false;
            }
        });
    }
});
