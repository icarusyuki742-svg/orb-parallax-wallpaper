/* =========================================================
   NEURAL ORB — INTERACTION SYSTEM
   ========================================================= */

const root = document.documentElement;

let targetX = 0;
let targetY = 0;

let currentX = 0;
let currentY = 0;

let targetProximity = 0;
let currentProximity = 0;


/* =========================================================
   MOUSE TRACKING
   ========================================================= */

window.addEventListener(
    "mousemove",
    (event) => {

        const normalizedX =
            (event.clientX / window.innerWidth - 0.5) * 2;

        const normalizedY =
            (event.clientY / window.innerHeight - 0.5) * 2;

        targetX = normalizedX;
        targetY = normalizedY;


        /* ---------------------------------------------
           Distance from the orb
           --------------------------------------------- */

        const orbX =
            window.innerWidth / 2;

        const orbY =
            window.innerHeight / 2;

        const distanceX =
            event.clientX - orbX;

        const distanceY =
            event.clientY - orbY;

        const distance =
            Math.sqrt(
                distanceX * distanceX +
                distanceY * distanceY
            );


        /*
         * Proximity begins within roughly
         * 520 pixels of the center.
         */

        const proximityRange = 520;

        targetProximity =
            1 -
            Math.min(
                distance / proximityRange,
                1
            );
    }
);


/* =========================================================
   SMOOTH ANIMATION
   ========================================================= */

function animate() {

    /*
     * Orb movement
     */

    currentX +=
        (targetX - currentX) * 0.035;

    currentY +=
        (targetY - currentY) * 0.035;


    /*
     * Proximity smoothing
     */

    currentProximity +=
        (targetProximity - currentProximity) * 0.045;


    /*
     * Send values to CSS
     */

    root.style.setProperty(
        "--mouse-x",
        currentX
    );

    root.style.setProperty(
        "--mouse-y",
        currentY
    );

    root.style.setProperty(
        "--proximity",
        currentProximity
    );


    requestAnimationFrame(animate);
}


/* =========================================================
   START
   ========================================================= */

animate();
