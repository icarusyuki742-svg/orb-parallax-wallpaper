const root = document.documentElement;

let targetX = 0;
let targetY = 0;

let currentX = 0;
let currentY = 0;

window.addEventListener("mousemove", (event) => {
    /*
     * Convert the mouse position into a value
     * between approximately -1 and +1.
     */

    targetX = (event.clientX / window.innerWidth - 0.5) * 2;
    targetY = (event.clientY / window.innerHeight - 0.5) * 2;
});


function animate() {
    /*
     * Smoothly move toward the mouse position.
     * This creates the soft, floating feeling
     * instead of making the orb snap to the cursor.
     */

    currentX += (targetX - currentX) * 0.035;
    currentY += (targetY - currentY) * 0.035;

    root.style.setProperty("--mouse-x", currentX);
    root.style.setProperty("--mouse-y", currentY);

    requestAnimationFrame(animate);
}

animate();
