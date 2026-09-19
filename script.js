import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/0.186.0/three.module.min.js";


// ============================================================
// 3D PARALLAX SPACE WALLPAPER
//
// FOREGROUND:
//   Rotating rocky planet
//
// BACKGROUND:
//   Black hole
//   Accretion disk
//   Photon ring
//   Dust particles
//
// PARALLAX:
//   Camera + foreground + background each react differently
//   to the cursor, producing actual depth.
//
// CONTROLS:
//   Mouse = parallax
//   Space = pause/resume
//   R = reset parallax
// ============================================================



// ============================================================
// CONFIGURATION
// ============================================================

const CONFIG = {

  planet: {

    radius: 1.72,

    position: new THREE.Vector3(
      2.25,
      -0.28,
      0.35
    ),

    rotationSpeed: 0.125,

    texture:
      "https://threejs.org/examples/textures/planets/moon_1024.jpg"
  },


  blackHole: {

    position: new THREE.Vector3(
      1.05,
      0.42,
      -3.55
    ),

    coreRadius: 1.06,

    diskRadius: 3.35,

    diskInner: 0.32,

    diskTilt: 1.04,

    diskRotationSpeed: 0.16
  },


  camera: {

    fov: 44,

    near: 0.1,

    far: 80,

    z: 10.2,

    lookAt:
      new THREE.Vector3(
        0.72,
        -0.03,
        -0.6
      )
  },


  parallax: {

    cameraX: 0.9,

    cameraY: 0.52,

    foregroundX: 0.22,

    foregroundY: 0.10,

    backgroundX: 0.035,

    backgroundY: 0.018
  }

};



// ============================================================
// DOM
// ============================================================

const canvas =
  document.querySelector("#space");

const loading =
  document.querySelector("#loading");

const hint =
  document.querySelector("#hint");



// ============================================================
// GLOBAL STATE
// ============================================================

let renderer;

let scene;

let camera;

let clock;

let running = true;

let firstPointerMove = true;



const pointer = {

  x: 0,

  y: 0,

  targetX: 0,

  targetY: 0

};



// ============================================================
// SCENE GROUPS
// ============================================================

const planetGroup =
  new THREE.Group();


const blackHoleGroup =
  new THREE.Group();


const foregroundGroup =
  new THREE.Group();


const backgroundGroup =
  new THREE.Group();


let starField;

let nebula;

let planetAtmosphere;

let diskMaterial;

let dustGeometry;

let dustPoints;



// ============================================================
// TEXTURE HELPERS
// ============================================================

function fallbackTexture() {

  const c =
    document.createElement("canvas");

  c.width = 4;
  c.height = 4;

  const ctx =
    c.getContext("2d");

  ctx.fillStyle = "#3a424d";

  ctx.fillRect(
    0,
    0,
    4,
    4
  );

  const texture =
    new THREE.CanvasTexture(c);

  texture.colorSpace =
    THREE.SRGBColorSpace;

  return texture;
}



async function loadTexture(url) {

  const loader =
    new THREE.TextureLoader();

  try {

    const texture =
      await loader.loadAsync(url);

    texture.colorSpace =
      THREE.SRGBColorSpace;

    texture.anisotropy =
      renderer.capabilities.getMaxAnisotropy();

    return texture;

  } catch (error) {

    console.warn(
      "Texture failed to load:",
      url,
      error
    );

    return fallbackTexture();
  }
}



// ============================================================
// RADIAL GLOW TEXTURE
// ============================================================

function makeRadialTexture(
  inner,
  outer,
  center = "rgba(220,235,255,0.9)"
) {

  const size = 256;

  const c =
    document.createElement("canvas");

  c.width = size;
  c.height = size;

  const ctx =
    c.getContext("2d");


  const g =
    ctx.createRadialGradient(

      size / 2,
      size / 2,
      0,

      size / 2,
      size / 2,
      size / 2

    );


  g.addColorStop(
    0,
    inner
  );

  g.addColorStop(
    0.25,
    center
  );

  g.addColorStop(
    0.55,
    "rgba(110,150,205,0.16)"
  );

  g.addColorStop(
    1,
    outer
  );


  ctx.fillStyle = g;

  ctx.fillRect(
    0,
    0,
    size,
    size
  );


  const texture =
    new THREE.CanvasTexture(c);

  texture.colorSpace =
    THREE.SRGBColorSpace;


  return texture;
}



// ============================================================
// GLOW SPRITE
// ============================================================

function makeGlowSprite({

  size = 6,

  opacity = 0.18,

  position,

  colorTint = 0xaecaff

}) {

  const tex =
    makeRadialTexture(

      "rgba(255,255,255,0.58)",

      "rgba(0,0,0,0)",

      "rgba(165,198,255,0.12)"

    );


  const mat =
    new THREE.SpriteMaterial({

      map: tex,

      transparent: true,

      opacity,

      depthWrite: false,

      blending:
        THREE.AdditiveBlending,

      color: colorTint

    });


  const sprite =
    new THREE.Sprite(mat);


  sprite.position.copy(
    position
  );


  sprite.scale.set(
    size,
    size,
    1
  );


  return sprite;
}



// ============================================================
// STAR FIELD
// ============================================================

function createStarField() {

  const count = 1500;


  const positions =
    new Float32Array(
      count * 3
    );


  const sizes =
    new Float32Array(count);


  const phases =
    new Float32Array(count);



  for (
    let i = 0;
    i < count;
    i++
  ) {

    const i3 = i * 3;


    const radius =
      THREE.MathUtils.randFloat(
        9,
        34
      );


    const theta =
      THREE.MathUtils.randFloat(
        0,
        Math.PI * 2
      );


    const phi =
      Math.acos(
        THREE.MathUtils.randFloatSpread(2)
      );


    positions[i3] =
      Math.sin(phi) *
      Math.cos(theta) *
      radius;


    positions[i3 + 1] =
      Math.cos(phi) *
      radius;


    positions[i3 + 2] =
      -Math.abs(
        Math.sin(phi) *
        Math.sin(theta) *
        radius
      ) - 3;


    sizes[i] =
      THREE.MathUtils.randFloat(
        0.5,
        2.2
      );


    phases[i] =
      Math.random() *
      Math.PI *
      2;
  }



  const geometry =
    new THREE.BufferGeometry();


  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(
      positions,
      3
    )
  );


  geometry.setAttribute(
    "aSize",
    new THREE.BufferAttribute(
      sizes,
      1
    )
  );


  geometry.setAttribute(
    "aPhase",
    new THREE.BufferAttribute(
      phases,
      1
    )
  );



  const material =
    new THREE.ShaderMaterial({

      transparent: true,

      depthWrite: false,

      blending:
        THREE.AdditiveBlending,


      uniforms: {

        uTime: {
          value: 0
        }

      },


      vertexShader: `

        attribute float aSize;
        attribute float aPhase;

        uniform float uTime;

        varying float vAlpha;


        void main() {

          vec4 mvPosition =
            modelViewMatrix *
            vec4(position, 1.0);


          float pulse =
            0.78 +
            0.22 *
            sin(
              uTime * 0.7 +
              aPhase
            );


          gl_PointSize =
            aSize *
            pulse *
            (
              245.0 /
              max(
                1.0,
                -mvPosition.z
              )
            );


          gl_Position =
            projectionMatrix *
            mvPosition;


          vAlpha =
            pulse;
        }

      `,


      fragmentShader: `

        varying float vAlpha;


        void main() {

          vec2 p =
            gl_PointCoord -
            0.5;


          float d =
            length(p);


          float glow =
            smoothstep(
              0.5,
              0.02,
              d
            );


          float core =
            smoothstep(
              0.18,
              0.0,
              d
            );


          vec3 c =
            mix(
              vec3(
                0.38,
                0.45,
                0.58
              ),

              vec3(
                0.95,
                0.98,
                1.0
              ),

              core
            );


          gl_FragColor =
            vec4(
              c,
              glow *
              vAlpha *
              0.9
            );
        }

      `
    });



  starField =
    new THREE.Points(
      geometry,
      material
    );


  starField.position.set(
    0,
    0,
    -7
  );


  backgroundGroup.add(
    starField
  );
}



// ============================================================
// BLACK HOLE
// ============================================================

function createBlackHole() {

  blackHoleGroup.position.copy(
    CONFIG.blackHole.position
  );


  blackHoleGroup.rotation.x =
    CONFIG.blackHole.diskTilt;



  // ==========================================================
  // EVENT HORIZON
  // ==========================================================

  const eventHorizon =
    new THREE.Mesh(

      new THREE.SphereGeometry(
        CONFIG.blackHole.coreRadius,
        96,
        96
      ),

      new THREE.MeshBasicMaterial({
        color: 0x000000
      })

    );


  blackHoleGroup.add(
    eventHorizon
  );



  // ==========================================================
  // PHOTON RING
  // ==========================================================

  const photonRing =
    new THREE.Mesh(

      new THREE.TorusGeometry(
        1.055,
        0.032,
        16,
        160
      ),

      new THREE.MeshBasicMaterial({

        color: 0xcfe1ff,

        transparent: true,

        opacity: 0.62,

        blending:
          THREE.AdditiveBlending,

        depthWrite: false

      })

    );


  photonRing.rotation.x =
    Math.PI / 2;


  photonRing.scale.set(
    1.0,
    0.58,
    1.0
  );


  blackHoleGroup.add(
    photonRing
  );



  // ==========================================================
  // ACCRETION DISK
  // ==========================================================

  const diskGeometry =
    new THREE.CircleGeometry(
      CONFIG.blackHole.diskRadius,
      256
    );


  diskMaterial =
    new THREE.ShaderMaterial({

      transparent: true,

      side: THREE.DoubleSide,

      depthWrite: false,

      blending:
        THREE.AdditiveBlending,


      uniforms: {

        uTime: {
          value: 0
        },


        uInner: {
          value:
            CONFIG.blackHole.diskInner
        },


        uColorHot: {
          value:
            new THREE.Color(
              0xd7e8ff
            )
        },


        uColorCold: {
          value:
            new THREE.Color(
              0x526681
            )
        }

      },


      vertexShader: `

        varying vec2 vUv;


        void main() {

          vUv = uv;


          gl_Position =
            projectionMatrix *
            modelViewMatrix *
            vec4(
              position,
              1.0
            );
        }

      `,


      fragmentShader: `

        uniform float uTime;

        uniform float uInner;

        uniform vec3 uColorHot;

        uniform vec3 uColorCold;

        varying vec2 vUv;


        float hash21(
          vec2 p
        ) {

          p =
            fract(
              p *
              vec2(
                123.34,
                456.21
              )
            );


          p +=
            dot(
              p,
              p + 45.32
            );


          return fract(
            p.x * p.y
          );
        }


        void main() {

          vec2 p =
            vUv * 2.0 -
            1.0;


          float r =
            length(p);


          if (
            r < uInner ||
            r > 1.0
          )
            discard;


          float angle =
            atan(
              p.y,
              p.x
            );


          float innerFade =
            smoothstep(
              uInner,
              uInner + 0.08,
              r
            );


          float outerFade =
            1.0 -
            smoothstep(
              0.88,
              1.0,
              r
            );


          float band =
            exp(
              -pow(
                (r - 0.60) *
                3.5,
                2.0
              )
            );


          float band2 =
            exp(
              -pow(
                (r - 0.77) *
                8.5,
                2.0
              )
            );


          float turbulence =
            0.60 +
            0.40 *
            sin(
              angle * 15.0 +
              r * 55.0 -
              uTime * 3.4
            );


          float grain =
            hash21(
              floor(
                p * 55.0 +
                uTime * 0.06
              )
            ) *
            0.22;


          float intensity =
            (
              0.13 +
              band * 0.70 +
              band2 * 0.28
            ) *
            turbulence;


          intensity +=
            grain * band;


          intensity *=
            innerFade *
            outerFade;


          float warmMix =
            smoothstep(
              0.38,
              0.92,
              r
            );


          vec3 color =
            mix(
              uColorHot,
              uColorCold,
              warmMix
            );


          color +=
            vec3(
              0.22,
              0.26,
              0.34
            ) *
            band;


          gl_FragColor =
            vec4(
              color,
              intensity * 0.92
            );

        }

      `
    });



  const disk =
    new THREE.Mesh(
      diskGeometry,
      diskMaterial
    );


  disk.rotation.x =
    -Math.PI / 2;


  disk.renderOrder =
    1;


  blackHoleGroup.add(
    disk
  );



  // ==========================================================
  // INNER HOT RING
  // ==========================================================

  const innerDisk =
    new THREE.Mesh(

      new THREE.RingGeometry(
        0.98,
        1.38,
        192
      ),

      new THREE.MeshBasicMaterial({

        color: 0xa7cdfc,

        transparent: true,

        opacity: 0.26,

        side:
          THREE.DoubleSide,

        blending:
          THREE.AdditiveBlending,

        depthWrite: false

      })

    );


  innerDisk.rotation.x =
    -Math.PI / 2;


  innerDisk.renderOrder =
    2;


  blackHoleGroup.add(
    innerDisk
  );



  // ==========================================================
  // BLACK HOLE HALO
  // ==========================================================

  const halo =
    makeGlowSprite({

      size: 6.9,

      opacity: 0.22,

      position:
        new THREE.Vector3(
          0,
          0,
          -0.05
        ),

      colorTint:
        0x9ab8df

    });


  halo.renderOrder =
    0;


  blackHoleGroup.add(
    halo
  );



  // ==========================================================
  // ELLIPTICAL ORBIT LINES
  // ==========================================================

  for (
    const [
      rx,
      ry,
      alpha
    ]
    of [

      [3.0, 0.88, 0.12],

      [3.35, 1.02, 0.08],

      [2.6, 0.70, 0.06]

    ]
  ) {

    const curve =
      new THREE.EllipseCurve(

        0,
        0,

        rx,
        ry,

        0,
        Math.PI * 2,

        false,
        0

      );


    const points =
      curve.getPoints(180);


    const geo =
      new THREE.BufferGeometry()
        .setFromPoints(points);


    const line =
      new THREE.Line(

        geo,

        new THREE.LineBasicMaterial({

          color: 0xaec4df,

          transparent: true,

          opacity: alpha,

          blending:
            THREE.AdditiveBlending,

          depthWrite: false

        })

      );


    line.rotation.x =
      -Math.PI / 2;


    line.rotation.z =
      THREE.MathUtils.degToRad(10);


    line.position.z =
      0.02;


    blackHoleGroup.add(
      line
    );
  }



  // ==========================================================
  // PARTICLE DUST
  // ==========================================================

  createAccretionDust();


  foregroundGroup.add(
    blackHoleGroup
  );
}



// ============================================================
// ACCRETION DISK DUST
// ============================================================

function createAccretionDust() {

  const count = 1050;


  const positions =
    new Float32Array(
      count * 3
    );


  const sizes =
    new Float32Array(
      count
    );


  const colors =
    new Float32Array(
      count * 3
    );



  const cold =
    new THREE.Color(
      0x9ab8e4
    );


  const hot =
    new THREE.Color(
      0xe4ecff
    );


  const color =
    new THREE.Color();



  for (
    let i = 0;
    i < count;
    i++
  ) {

    const i3 =
      i * 3;


    const angle =
      Math.random() *
      Math.PI *
      2;


    const radius =
      THREE.MathUtils.lerp(

        1.28,

        3.2,

        Math.pow(
          Math.random(),
          0.68
        )

      );


    const thickness =
      THREE.MathUtils.randFloatSpread(
        0.045 +
        radius * 0.03
      );



    positions[i3] =
      Math.cos(angle) *
      radius;


    positions[i3 + 1] =
      Math.sin(angle) *
      radius;


    positions[i3 + 2] =
      thickness;



    const t =
      THREE.MathUtils.clamp(

        (radius - 1.2) / 2.0,

        0,
        1

      );


    color
      .copy(cold)
      .lerp(
        hot,
        1 - t * 0.75
      );


    colors[i3] =
      color.r;


    colors[i3 + 1] =
      color.g;


    colors[i3 + 2] =
      color.b;


    sizes[i] =
      THREE.MathUtils.randFloat(
        0.35,
        1.35
      );
  }



  dustGeometry =
    new THREE.BufferGeometry();


  dustGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(
      positions,
      3
    )
  );


  dustGeometry.setAttribute(
    "aSize",
    new THREE.BufferAttribute(
      sizes,
      1
    )
  );


  dustGeometry.setAttribute(
    "aColor",
    new THREE.BufferAttribute(
      colors,
      3
    )
  );



  const dustMaterial =
    new THREE.ShaderMaterial({

      transparent: true,

      depthWrite: false,

      blending:
        THREE.AdditiveBlending,

      vertexColors: true,


      vertexShader: `

        attribute float aSize;

        attribute vec3 aColor;

        varying vec3 vColor;


        void main() {

          vColor =
            aColor;


          vec4 mvPosition =
            modelViewMatrix *
            vec4(
              position,
              1.0
            );


          gl_PointSize =
            aSize *
            (
              170.0 /
              max(
                1.0,
                -mvPosition.z
              )
            );


          gl_Position =
            projectionMatrix *
            mvPosition;

        }

      `,


      fragmentShader: `

        varying vec3 vColor;


        void main() {

          vec2 p =
            gl_PointCoord -
            0.5;


          float d =
            length(p);


          float alpha =
            smoothstep(
              0.5,
              0.02,
              d
            );


          gl_FragColor =
            vec4(
              vColor,
              alpha * 0.72
            );

        }

      `

    });



  dustPoints =
    new THREE.Points(
      dustGeometry,
      dustMaterial
    );


  dustPoints.rotation.x =
    -Math.PI / 2;


  dustPoints.rotation.z =
    0.14;


  dustPoints.position.z =
    0.12;


  blackHoleGroup.add(
    dustPoints
  );
}



// ============================================================
// PLANET
// ============================================================

function createPlanet(
  moonTexture
) {

  planetGroup.position.copy(
    CONFIG.planet.position
  );


  foregroundGroup.add(
    planetGroup
  );



  const geometry =
    new THREE.SphereGeometry(
      CONFIG.planet.radius,
      128,
      128
    );



  const material =
    new THREE.MeshStandardMaterial({

      map:
        moonTexture,

      color:
        new THREE.Color(
          0x788695
        ),

      roughness:
        0.94,

      metalness:
        0.0,

      bumpMap:
        moonTexture,

      bumpScale:
        0.055

    });



  const planet =
    new THREE.Mesh(
      geometry,
      material
    );


  planetGroup.add(
    planet
  );



  // ==========================================================
  // ATMOSPHERE
  // ==========================================================

  const atmosphereGeometry =
    new THREE.SphereGeometry(
      CONFIG.planet.radius * 1.018,
      128,
      128
    );


  const atmosphereMaterial =
    new THREE.ShaderMaterial({

      transparent: true,

      side:
        THREE.BackSide,

      depthWrite: false,

      blending:
        THREE.AdditiveBlending,


      uniforms: {

        uColor: {
          value:
            new THREE.Color(
              0xbcd8ff
            )
        },


        uLightDir: {
          value:

            new THREE.Vector3(
              -0.72,
              0.26,
              0.66
            ).normalize()

        }

      },


      vertexShader: `

        varying vec3 vWorldNormal;

        varying vec3 vWorldPos;


        void main() {

          vec4 worldPos =
            modelMatrix *
            vec4(
              position,
              1.0
            );


          vWorldPos =
            worldPos.xyz;


          vWorldNormal =
            normalize(
              mat3(
                modelMatrix
              ) *
              normal
            );


          gl_Position =
            projectionMatrix *
            viewMatrix *
            worldPos;

        }

      `,


      fragmentShader: `

        uniform vec3 uColor;

        uniform vec3 uLightDir;

        varying vec3 vWorldNormal;

        varying vec3 vWorldPos;


        void main() {

          vec3 n =
            normalize(
              vWorldNormal
            );


          vec3 viewDir =
            normalize(
              cameraPosition -
              vWorldPos
            );


          float rim =
            pow(

              1.0 -
              max(
                dot(n, viewDir),
                0.0
              ),

              3.6

            );


          float lit =
            0.24 +
            0.76 *
            max(
              dot(
                n,
                normalize(
                  uLightDir
                )
              ),
              0.0
            );


          float alpha =
            rim *
            lit *
            0.72;


          gl_FragColor =
            vec4(
              uColor,
              alpha
            );

        }

      `

    });



  planetAtmosphere =
    new THREE.Mesh(

      atmosphereGeometry,

      atmosphereMaterial

    );


  planetGroup.add(
    planetAtmosphere
  );



  // ==========================================================
  // SUBTLE EDGE HIGHLIGHT
  // ==========================================================

  const edgeRing =
    new THREE.Mesh(

      new THREE.TorusGeometry(
        CONFIG.planet.radius * 1.002,
        0.018,
        12,
        180
      ),

      new THREE.MeshBasicMaterial({

        color:
          0xbfd8f6,

        transparent: true,

        opacity: 0.15,

        blending:
          THREE.AdditiveBlending,

        depthWrite: false

      })

    );


  edgeRing.rotation.y =
    0.12;


  planetGroup.add(
    edgeRing
  );
}



// ============================================================
// RENDERER
// ============================================================

function setupRenderer() {

  renderer =
    new THREE.WebGLRenderer({

      canvas,

      antialias: true,

      powerPreference:
        "high-performance"

    });


  renderer.setPixelRatio(

    Math.min(
      window.devicePixelRatio || 1,
      2
    )

  );


  renderer.setSize(

    window.innerWidth,

    window.innerHeight,

    false

  );


  renderer.outputColorSpace =
    THREE.SRGBColorSpace;


  renderer.toneMapping =
    THREE.ACESFilmicToneMapping;


  renderer.toneMappingExposure =
    1.22;
}



// ============================================================
// SCENE
// ============================================================

function setupScene() {

  scene =
    new THREE.Scene();


  scene.background =
    new THREE.Color(
      0x020305
    );



  camera =
    new THREE.PerspectiveCamera(

      CONFIG.camera.fov,

      window.innerWidth /
        window.innerHeight,

      CONFIG.camera.near,

      CONFIG.camera.far

    );


  camera.position.set(

    0,

    0,

    CONFIG.camera.z

  );


  clock =
    new THREE.Clock();



  // ==========================================================
  // LIGHTING
  // ==========================================================

  scene.add(

    new THREE.HemisphereLight(

      0x2f3d52,

      0x010203,

      0.24

    )

  );


  const key =
    new THREE.DirectionalLight(

      0xe8f1ff,

      2.25

    );


  key.position.set(

    -5,

    3.4,

    6

  );


  scene.add(key);



  const fill =
    new THREE.PointLight(

      0x7ca8ff,

      0.32,

      16,

      2

    );


  fill.position.set(

    2.5,

    -0.5,

    3

  );


  scene.add(fill);



  scene.add(
    backgroundGroup
  );


  scene.add(
    foregroundGroup
  );



  // ==========================================================
  // STARS
  // ==========================================================

  createStarField();



  // ==========================================================
  // LARGE BACKGROUND NEBULA
  // ==========================================================

  nebula =
    makeGlowSprite({

      size: 16,

      opacity: 0.075,

      position:
        new THREE.Vector3(
          -3.8,
          1.2,
          -12
        ),

      colorTint:
        0x5e769a

    });


  backgroundGroup.add(
    nebula
  );



  const secondaryNebula =
    makeGlowSprite({

      size: 8,

      opacity: 0.06,

      position:
        new THREE.Vector3(
          4.6,
          -1.4,
          -9
        ),

      colorTint:
        0x9ab7dc

    });


  backgroundGroup.add(
    secondaryNebula
  );
}



// ============================================================
// INPUT
// ============================================================

function setupInput() {

  const setPointer =
    (
      clientX,
      clientY
    ) => {

      const nx =
        (clientX /
          window.innerWidth) *
          2 -
        1;


      const ny =
        (clientY /
          window.innerHeight) *
          2 -
        1;


      pointer.targetX =
        THREE.MathUtils.clamp(
          nx,
          -1,
          1
        );


      pointer.targetY =
        THREE.MathUtils.clamp(
          ny,
          -1,
          1
        );



      if (
        firstPointerMove
      ) {

        firstPointerMove =
          false;


        hint.classList.add(
          "visible"
        );


        window.setTimeout(

          () =>
            hint.classList.remove(
              "visible"
            ),

          2600

        );
      }
    };



  window.addEventListener(
    "mousemove",

    event =>
      setPointer(
        event.clientX,
        event.clientY
      ),

    {
      passive: true
    }
  );



  window.addEventListener(

    "touchmove",

    event => {

      const touch =
        event.touches[0];

      if (touch) {

        setPointer(
          touch.clientX,
          touch.clientY
        );

      }

    },

    {
      passive: true
    }

  );



  // SPACE = pause
  window.addEventListener(

    "keydown",

    event => {

      if (
        event.code ===
        "Space"
      ) {

        event.preventDefault();

        running =
          !running;

      }


      // R = reset
      if (
        event.key.toLowerCase()
        === "r"
      ) {

        pointer.targetX =
          0;

        pointer.targetY =
          0;

      }

    }

  );



  // ==========================================================
  // RESIZE
  // ==========================================================

  window.addEventListener(

    "resize",

    () => {

      camera.aspect =
        window.innerWidth /
        window.innerHeight;


      camera.updateProjectionMatrix();


      renderer.setPixelRatio(

        Math.min(
          window.devicePixelRatio || 1,
          2
        )

      );


      renderer.setSize(

        window.innerWidth,

        window.innerHeight,

        false

      );

    }

  );
}



// ============================================================
// PARALLAX
// ============================================================

function updateParallax() {

  pointer.x =
    THREE.MathUtils.lerp(

      pointer.x,

      pointer.targetX,

      0.035

    );


  pointer.y =
    THREE.MathUtils.lerp(

      pointer.y,

      pointer.targetY,

      0.035

    );



  // ==========================================================
  // CAMERA MOVEMENT
  // ==========================================================

  camera.position.x =
    THREE.MathUtils.lerp(

      camera.position.x,

      pointer.x *
      CONFIG.parallax.cameraX,

      0.025

    );


  camera.position.y =
    THREE.MathUtils.lerp(

      camera.position.y,

      -pointer.y *
      CONFIG.parallax.cameraY,

      0.025

    );


  camera.lookAt(
    CONFIG.camera.lookAt
  );



  // ==========================================================
  // PLANET PARALLAX
  // ==========================================================

  const planetBase =
    CONFIG.planet.position;


  planetGroup.position.x =
    THREE.MathUtils.lerp(

      planetGroup.position.x,

      planetBase.x +
      pointer.x *
      CONFIG.parallax.foregroundX,

      0.035

    );


  planetGroup.position.y =
    THREE.MathUtils.lerp(

      planetGroup.position.y,

      planetBase.y -
      pointer.y *
      CONFIG.parallax.foregroundY,

      0.035

    );



  // ==========================================================
  // BLACK HOLE PARALLAX
  // ==========================================================

  const bhBase =
    CONFIG.blackHole.position;


  blackHoleGroup.position.x =
    THREE.MathUtils.lerp(

      blackHoleGroup.position.x,

      bhBase.x +
      pointer.x *
      0.09,

      0.03

    );


  blackHoleGroup.position.y =
    THREE.MathUtils.lerp(

      blackHoleGroup.position.y,

      bhBase.y -
      pointer.y *
      0.045,

      0.03

    );



  // ==========================================================
  // STAR/BACKGROUND PARALLAX
  // ==========================================================

  backgroundGroup.position.x =
    THREE.MathUtils.lerp(

      backgroundGroup.position.x,

      pointer.x *
      CONFIG.parallax.backgroundX,

      0.02

    );


  backgroundGroup.position.y =
    THREE.MathUtils.lerp(

      backgroundGroup.position.y,

      -pointer.y *
      CONFIG.parallax.backgroundY,

      0.02

    );
}



// ============================================================
// ANIMATION
// ============================================================

function animate() {

  requestAnimationFrame(
    animate
  );


  const delta =
    Math.min(
      clock.getDelta(),
      0.05
    );


  const elapsed =
    clock.elapsedTime;



  // Mouse parallax continues even when animation is paused.
  updateParallax();



  if (running) {

    // ========================================================
    // PLANET AXIAL ROTATION
    // ========================================================

    planetGroup.rotation.y +=
      delta *
      CONFIG.planet.rotationSpeed;



    // ========================================================
    // BLACK HOLE ROTATION
    // ========================================================

    blackHoleGroup.rotation.z +=
      delta *
      CONFIG.blackHole.diskRotationSpeed;



    // ========================================================
    // ACCRETION PARTICLES
    // ========================================================

    if (dustPoints) {

      dustPoints.rotation.z +=
        delta * 0.23;

    }



    // ========================================================
    // SHADER ANIMATION
    // ========================================================

    diskMaterial
      .uniforms
      .uTime
      .value =
      elapsed;


    starField
      .material
      .uniforms
      .uTime
      .value =
      elapsed;

  }



  // ==========================================================
  // SUBTLE LIVING MOVEMENT
  // ==========================================================

  const breathe =
    Math.sin(
      elapsed * 0.42
    ) * 0.006;


  foregroundGroup.rotation.y =
    THREE.MathUtils.lerp(

      foregroundGroup.rotation.y,

      pointer.x *
      0.012 +
      breathe,

      0.02

    );


  foregroundGroup.rotation.x =
    THREE.MathUtils.lerp(

      foregroundGroup.rotation.x,

      pointer.y *
      0.007,

      0.02

    );



  renderer.render(
    scene,
    camera
  );
}



// ============================================================
// START
// ============================================================

async function boot() {

  setupRenderer();

  setupScene();



  const moonTexture =
    await loadTexture(
      CONFIG.planet.texture
    );


  createBlackHole();

  createPlanet(
    moonTexture
  );

  setupInput();



  loading.classList.add(
    "fade-out"
  );


  window.setTimeout(
    () => loading.remove(),
    900
  );


  animate();
}



boot().catch(
  error => {

    console.error(error);

    loading.textContent =
      "3D scene failed to start — open the browser console.";

  }
);
