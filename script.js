/* =========================================================
   NEURAL SHARD
   MOUSE / PARALLAX / PROXIMITY SYSTEM
   ========================================================= */


const root =
    document.documentElement;

const canvas =
    document.getElementById(
        "networkCanvas"
    );

const ctx =
    canvas.getContext("2d");


/* =========================================================
   STATE
   ========================================================= */

let width =
    window.innerWidth;

let height =
    window.innerHeight;

let targetX = 0;
let targetY = 0;

let mouseX = width / 2;
let mouseY = height / 2;

let smoothX = 0;
let smoothY = 0;

let targetProximity = 0;
let proximity = 0;


/* =========================================================
   CANVAS
   ========================================================= */

function resizeCanvas() {

    width =
        window.innerWidth;

    height =
        window.innerHeight;


    const ratio =
        Math.min(
            window.devicePixelRatio || 1,
            2
        );


    canvas.width =
        width * ratio;

    canvas.height =
        height * ratio;


    canvas.style.width =
        width + "px";

    canvas.style.height =
        height + "px";


    ctx.setTransform(
        ratio,
        0,
        0,
        ratio,
        0,
        0
    );
}


window.addEventListener(
    "resize",
    resizeCanvas
);


resizeCanvas();


/* =========================================================
   MOUSE
   ========================================================= */

window.addEventListener(
    "mousemove",
    (event) => {

        mouseX =
            event.clientX;

        mouseY =
            event.clientY;


        targetX =
            (
                mouseX / width
                - 0.5
            ) * 2;


        targetY =
            (
                mouseY / height
                - 0.5
            ) * 2;


        const centerX =
            width / 2;

        const centerY =
            height / 2;


        const dx =
            mouseX - centerX;

        const dy =
            mouseY - centerY;


        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy
            );


        const range =
            Math.min(
                width,
                height
            ) * 0.48;


        targetProximity =
            Math.max(
                0,
                1 - distance / range
            );


        root.style.setProperty(
            "--cursor-x",
            mouseX + "px"
        );

        root.style.setProperty(
            "--cursor-y",
            mouseY + "px"
        );

    }
);


/* =========================================================
   NEURAL NODES
   ========================================================= */

const nodes = [];

const NODE_COUNT = 22;


for (
    let i = 0;
    i < NODE_COUNT;
    i++
) {

    const angle =
        (
            Math.PI * 2 /
            NODE_COUNT
        ) * i;


    const radius =
        0.42 +
        Math.random() * 0.24;


    nodes.push({

        angle,

        radius,

        phase:
            Math.random() * Math.PI * 2,

        speed:
            0.00025 +
            Math.random() * 0.00035

    });

}


/* =========================================================
   DRAW NEURAL NETWORK
   ========================================================= */

function drawNetwork(time) {

    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    const centerX =
        width / 2 +
        smoothX * 12;


    const centerY =
        height / 2 +
        smoothY * 10;


    const baseRadius =
        Math.min(
            width,
            height
        ) * 0.27;


    const positions =
        [];


    nodes.forEach(
        (node) => {

            const angle =
                node.angle +
                Math.sin(
                    time * node.speed +
                    node.phase
                ) * 0.025;


            const radius =
                baseRadius *
                node.radius;


            positions.push({

                x:
                    centerX +
                    Math.cos(angle) *
                    radius,

                y:
                    centerY +
                    Math.sin(angle) *
                    radius

            });

        }
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


            if (
                distance > 120
            ) {
                continue;
            }


            const strength =
                1 -
                distance / 120;


            const alpha =
                (
                    0.025 +
                    strength * 0.075
                ) *
                (
                    0.8 +
                    proximity * 0.9
                );


            ctx.beginPath();

            ctx.moveTo(
                a.x,
                a.y
            );

            ctx.lineTo(
                b.x,
                b.y
            );


            ctx.strokeStyle =
                `rgba(232,225,212,${alpha})`;


            ctx.lineWidth =
                0.7;


            ctx.stroke();

        }

    }


    /* ---------------------------------------------
       Nodes
       --------------------------------------------- */

    positions.forEach(
        (point, index) => {

            const pulse =
                (
                    Math.sin(
                        time * 0.0015 +
                        nodes[index].phase
                    ) + 1
                ) / 2;


            const radius =
                1.1 +
                pulse * 0.6 +
                proximity * 0.7;


            ctx.beginPath();

            ctx.arc(
                point.x,
                point.y,
                radius,
                0,
                Math.PI * 2
            );


            ctx.fillStyle =
                `rgba(
                    232,
                    225,
                    212,
                    ${
                        0.10 +
                        pulse * 0.08 +
                        proximity * 0.16
                    }
                )`;


            ctx.fill();

        }
    );

}


/* =========================================================
   ANIMATION LOOP
   ========================================================= */

function animate(time) {


    /* Smooth parallax */

    smoothX +=
        (
            targetX -
            smoothX
        ) * 0.045;


    smoothY +=
        (
            targetY -
            smoothY
        ) * 0.045;


    /* Smooth proximity */

    proximity +=
        (
            targetProximity -
            proximity
        ) * 0.055;


    /* CSS values */

    root.style.setProperty(
        "--mouse-x",
        smoothX
    );


    root.style.setProperty(
        "--mouse-y",
        smoothY
    );


    root.style.setProperty(
        "--proximity",
        proximity
    );


    /* Neural network */

    drawNetwork(time);


    requestAnimationFrame(
        animate
    );

}


animate(0);
