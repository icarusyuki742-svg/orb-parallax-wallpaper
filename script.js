/* =========================================================
   NEURAL ORB
   FINAL INTERACTION SYSTEM
   ========================================================= */

const root = document.documentElement;
const canvas = document.getElementById("networkCanvas");

const context = canvas.getContext("2d");


/* =========================================================
   STATE
   ========================================================= */

let width = window.innerWidth;
let height = window.innerHeight;
let pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

let targetX = 0;
let targetY = 0;

let currentX = 0;
let currentY = 0;

let targetProximity = 0;
let currentProximity = 0;

let cursorX = width / 2;
let cursorY = height / 2;


/* =========================================================
   RESIZE
   ========================================================= */

function resize() {

    width = window.innerWidth;
    height = window.innerHeight;

    pixelRatio =
        Math.min(window.devicePixelRatio || 1, 2);

    canvas.width =
        width * pixelRatio;

    canvas.height =
        height * pixelRatio;

    canvas.style.width =
        `${width}px`;

    canvas.style.height =
        `${height}px`;

    context.setTransform(
        pixelRatio,
        0,
        0,
        pixelRatio,
        0,
        0
    );
}

window.addEventListener(
    "resize",
    resize
);

resize();


/* =========================================================
   NEURAL NETWORK NODES
   ========================================================= */

const nodes = [];

const nodeCount = 34;

for (let i = 0; i < nodeCount; i++) {

    const angle =
        i * 2.3999632297;

    const ring =
        0.26 +
        ((i * 17) % 100) / 100 * 0.32;

    nodes.push({

        angle,

        radius:
            ring,

        phase:
            i * 0.73,

        speed:
            0.35 +
            (i % 5) * 0.08,

        size:
            1.1 +
            (i % 3) * 0.45
    });
}


/* =========================================================
   MOUSE
   ========================================================= */

window.addEventListener(
    "mousemove",
    (event) => {

        cursorX = event.clientX;
        cursorY = event.clientY;

        targetX =
            (cursorX / width - 0.5) * 2;

        targetY =
            (cursorY / height - 0.5) * 2;


        const centerX =
            width * 0.5;

        const centerY =
            height * 0.5;


        const dx =
            cursorX - centerX;

        const dy =
            cursorY - centerY;


        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy
            );


        const proximityRange =
            Math.min(width, height) * 0.55;


        targetProximity =
            1 -
            Math.min(
                distance / proximityRange,
                1
            );


        root.style.setProperty(
            "--cursor-x",
            `${cursorX}px`
        );

        root.style.setProperty(
            "--cursor-y",
            `${cursorY}px`
        );
    }
);


/* =========================================================
   NETWORK POSITION
   ========================================================= */

function getNodePosition(node, time) {

    const centerX =
        width * 0.5;

    const centerY =
        height * 0.5;

    const orbRadius =
        Math.min(width, height) * 0.255;


    const breathing =
        Math.sin(
            time * node.speed +
            node.phase
        ) * 0.012;


    const radius =
        node.radius +
        breathing;


    const angle =
        node.angle +
        Math.sin(
            time * 0.00015 +
            node.phase
        ) * 0.045;


    return {

        x:
            centerX +
            Math.cos(angle) *
            orbRadius *
            radius +
            currentX * 8,

        y:
            centerY +
            Math.sin(angle) *
            orbRadius *
            radius +
            currentY * 7
    };
}


/* =========================================================
   DRAW NETWORK
   ========================================================= */

function drawNetwork(time) {

    context.clearRect(
        0,
        0,
        width,
        height
    );


    const positions =
        nodes.map(
            node =>
                getNodePosition(
                    node,
                    time
                )
        );


    /* ---------------------------------------------
       Connections
       --------------------------------------------- */

    for (
        let i = 0;
        i < positions.length;
        i++
    ) {

        for (
            let j = i + 1;
            j < positions.length;
            j++
        ) {

            const a =
                positions[i];

            const b =
                positions[j];


            const dx =
                a.x - b.x;

            const dy =
                a.y - b.y;


            const distance =
                Math.sqrt(
                    dx * dx +
                    dy * dy
                );


            if (distance > 105) {
                continue;
            }


            const strength =
                Math.max(
                    0,
                    1 -
                    distance / 105
                );


            const alpha =
                (
                    0.025 +
                    strength * 0.075
                )
                *
                (
                    0.75 +
                    currentProximity * 1.25
                );


            context.beginPath();

            context.moveTo(
                a.x,
                a.y
            );

            context.lineTo(
                b.x,
                b.y
            );


            context.strokeStyle =
                `rgba(242, 234, 219, ${alpha})`;

            context.lineWidth =
                0.65;

            context.stroke();
        }
    }


    /* ---------------------------------------------
       Moving neural pulse
       --------------------------------------------- */

    const pulseIndex =
        Math.floor(
            time * 0.0007
        ) %
        positions.length;


    const pulse =
        positions[pulseIndex];


    context.beginPath();

    context.arc(
        pulse.x,
        pulse.y,
        2.2 +
        currentProximity * 2.2,
        0,
        Math.PI * 2
    );


    context.fillStyle =
        `rgba(155, 124, 255, ${
            0.28 +
            currentProximity * 0.42
        })`;


    context.shadowBlur =
        12;

    context.shadowColor =
        "rgba(155, 124, 255, 0.65)";


    context.fill();


    context.shadowBlur = 0;


    /* ---------------------------------------------
       Nodes
       --------------------------------------------- */

    positions.forEach(
        (position, index) => {

            const node =
                nodes[index];


            const pulseAmount =
                (
                    Math.sin(
                        time * 0.0014 *
                        node.speed +
                        node.phase
                    ) + 1
                ) / 2;


            const radius =
                node.size +
                pulseAmount *
                0.8 +
                currentProximity *
                0.8;


            context.beginPath();

            context.arc(
                position.x,
                position.y,
                radius,
                0,
                Math.PI * 2
            );


            context.fillStyle =
                `rgba(242, 234, 219, ${
                    0.12 +
                    pulseAmount * 0.12 +
                    currentProximity * 0.18
                })`;


            context.fill();
        }
    );
}


/* =========================================================
   ANIMATION
   ========================================================= */

function animate(time) {

    /* Smooth parallax */

    currentX +=
        (targetX - currentX) *
        0.035;

    currentY +=
        (targetY - currentY) *
        0.035;


    /* Smooth proximity */

    currentProximity +=
        (targetProximity - currentProximity) *
        0.045;


    /* Send values into CSS */

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


    /* Draw neural network */

    drawNetwork(time);


    requestAnimationFrame(
        animate
    );
}


animate(0);
