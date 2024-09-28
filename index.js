document.addEventListener("DOMContentLoaded", function () {
    const menuIcon = document.getElementById("menu-icon");
    const overlay = document.getElementById("overlay");
    const overlayClose = document.getElementById("overlay-close");

    // Toggle overlay and menu icon animation
    menuIcon.addEventListener("click", function () {
        menuIcon.classList.toggle("open");
        overlay.classList.toggle("open");
    });

    // Close the overlay when the close icon is clicked
    overlayClose.addEventListener("click", function () {
        overlay.classList.remove("open");
        menuIcon.classList.remove("open");
    });
});
