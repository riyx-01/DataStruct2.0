import { BloomEffect, EffectComposer, EffectPass, RenderPass } from 'postprocessing';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

import './Hyperspeed.css';

const DEFAULT_EFFECT_OPTIONS = {
  distortion: 'turbulentDistortion',
  length: 400,
  roadWidth: 10,
  islandWidth: 2,
  lanesPerRoad: 4,
  fov: 90,
  fovSpeedUp: 150,
  speedUp: 2,
  carLightsFade: 0.4,
  totalSideLightSticks: 20,
  lightPairsPerRoadWay: 40,
  shoulderLinesWidthPercentage: 0.05,
  brokenLinesWidthPercentage: 0.1,
  brokenLinesLengthPercentage: 0.5,
  lightStickWidth: [0.12, 0.5],
  lightStickHeight: [1.3, 1.7],
  movingAwaySpeed: [60, 80],
  movingCloserSpeed: [-120, -160],
  carLightsLength: [400 * 0.03, 400 * 0.2],
  carLightsRadius: [0.05, 0.14],
  carWidthPercentage: [0.3, 0.5],
  carShiftX: [-0.8, 0.8],
  carFloorSeparation: [0, 5],
  colors: {
    roadColor: 0x080808,
    islandColor: 0x0a0a0a,
    background: 0x000000,
    shoulderLines: 0xffffff,
    brokenLines: 0xffffff,
    leftCars: [0xd856bf, 0x6750a2, 0xc247ac],
    rightCars: [0x03b3c3, 0x0e5ea5, 0x324555],
    sticks: 0x03b3c3
  }
};

const Hyperspeed = ({ effectOptions = DEFAULT_EFFECT_OPTIONS }) => {
  const hyperspeed = useRef(null);
  const appRef = useRef(null);

  useEffect(() => {
    let app = null;

    const initW = hyperspeed.current?.offsetWidth || 0;
    const initH = hyperspeed.current?.offsetHeight || 0;
    if (initW <= 0 || initH <= 0) return;

    // Distortions logic
    const mountainUniforms = { uFreq: { value: new THREE.Vector3(3, 6, 10) }, uAmp: { value: new THREE.Vector3(30, 30, 20) } };
    const xyUniforms = { uFreq: { value: new THREE.Vector2(5, 2) }, uAmp: { value: new THREE.Vector2(25, 15) } };
    const LongRaceUniforms = { uFreq: { value: new THREE.Vector2(2, 3) }, uAmp: { value: new THREE.Vector2(35, 10) } };
    const turbulentUniforms = { uFreq: { value: new THREE.Vector4(4, 8, 8, 1) }, uAmp: { value: new THREE.Vector4(25, 5, 10, 10) } };
    const deepUniforms = { uFreq: { value: new THREE.Vector2(4, 8) }, uAmp: { value: new THREE.Vector2(10, 20) }, uPowY: { value: new THREE.Vector2(20, 2) } };
    const nsin = val => Math.sin(val) * 0.5 + 0.5;

    const distortions = {
      mountainDistortion: {
        uniforms: mountainUniforms,
        getDistortion: `
          uniform vec3 uAmp;
          uniform vec3 uFreq;
          #define PI 3.14159265358979
          float nsin(float val){ return sin(val) * 0.5 + 0.5; }
          vec3 getDistortion(float progress){
            float movementProgressFix = 0.02;
            return vec3( 
              cos(progress * PI * uFreq.x + uTime) * uAmp.x - cos(movementProgressFix * PI * uFreq.x + uTime) * uAmp.x,
              nsin(progress * PI * uFreq.y + uTime) * uAmp.y - nsin(movementProgressFix * PI * uFreq.y + uTime) * uAmp.y,
              nsin(progress * PI * uFreq.z + uTime) * uAmp.z - nsin(movementProgressFix * PI * uFreq.z + uTime) * uAmp.z
            );
          }
        `,
        getJS: (progress, time) => {
          let uFreq = mountainUniforms.uFreq.value; let uAmp = mountainUniforms.uAmp.value;
          return new THREE.Vector3(
            Math.cos(progress * Math.PI * uFreq.x + time) * uAmp.x - Math.cos(0.02 * Math.PI * uFreq.x + time) * uAmp.x,
            nsin(progress * Math.PI * uFreq.y + time) * uAmp.y - nsin(0.02 * Math.PI * uFreq.y + time) * uAmp.y,
            nsin(progress * Math.PI * uFreq.z + time) * uAmp.z - nsin(0.02 * Math.PI * uFreq.z + time) * uAmp.z
          ).multiply(new THREE.Vector3(2, 2, 2)).add(new THREE.Vector3(0, 0, -5));
        }
      },
      xyDistortion: {
        uniforms: xyUniforms,
        getDistortion: `
          uniform vec2 uFreq;
          uniform vec2 uAmp;
          #define PI 3.14159265358979
          vec3 getDistortion(float progress){
            float movementProgressFix = 0.02;
            return vec3( 
              cos(progress * PI * uFreq.x + uTime) * uAmp.x - cos(movementProgressFix * PI * uFreq.x + uTime) * uAmp.x,
              sin(progress * PI * uFreq.y + PI/2. + uTime) * uAmp.y - sin(movementProgressFix * PI * uFreq.y + PI/2. + uTime) * uAmp.y,
              0.
            );
          }
        `,
        getJS: (progress, time) => {
          let uFreq = xyUniforms.uFreq.value; let uAmp = xyUniforms.uAmp.value;
          return new THREE.Vector3(
            Math.cos(progress * Math.PI * uFreq.x + time) * uAmp.x - Math.cos(0.02 * Math.PI * uFreq.x + time) * uAmp.x,
            Math.sin(progress * Math.PI * uFreq.y + time + Math.PI / 2) * uAmp.y - Math.sin(0.02 * Math.PI * uFreq.y + time + Math.PI / 2) * uAmp.y,
            0
          ).multiply(new THREE.Vector3(2, 0.4, 1)).add(new THREE.Vector3(0, 0, -3));
        }
      },
      turbulentDistortion: {
        uniforms: turbulentUniforms,
        getDistortion: `
          uniform vec4 uFreq; uniform vec4 uAmp;
          float nsin(float val){ return sin(val) * 0.5 + 0.5; }
          #define PI 3.14159265358979
          float getDistortionX(float progress){ return cos(PI * progress * uFreq.r + uTime) * uAmp.r + pow(cos(PI * progress * uFreq.g + uTime * (uFreq.g / uFreq.r)), 2. ) * uAmp.g; }
          float getDistortionY(float progress){ return -nsin(PI * progress * uFreq.b + uTime) * uAmp.b + -pow(nsin(PI * progress * uFreq.a + uTime / (uFreq.b / uFreq.a)), 5.) * uAmp.a; }
          vec3 getDistortion(float progress){ return vec3(getDistortionX(progress) - getDistortionX(0.0125), getDistortionY(progress) - getDistortionY(0.0125), 0.); }
        `,
        getJS: (progress, time) => {
          const uFreq = turbulentUniforms.uFreq.value; const uAmp = turbulentUniforms.uAmp.value;
          const getX = p => Math.cos(Math.PI * p * uFreq.x + time) * uAmp.x + Math.pow(Math.cos(Math.PI * p * uFreq.y + time * (uFreq.y / uFreq.x)), 2) * uAmp.y;
          const getY = p => -nsin(Math.PI * p * uFreq.z + time) * uAmp.z - Math.pow(nsin(Math.PI * p * uFreq.w + time / (uFreq.z / uFreq.w)), 5) * uAmp.w;
          return new THREE.Vector3(getX(progress) - getX(progress + 0.007), getY(progress) - getY(progress + 0.007), 0).multiply(new THREE.Vector3(-2, -5, 0)).add(new THREE.Vector3(0, 0, -10));
        }
      }
    };

    class Road {
      constructor(webgl, options) {
        this.webgl = webgl; this.options = options;
        this.uTime = { value: 0 };
      }
      createPlane(side, width, isRoad) {
        const options = this.options;
        const geometry = new THREE.PlaneGeometry(isRoad ? options.roadWidth : options.islandWidth, options.length, 20, 100);
        let uniforms = {
          uTravelLength: { value: options.length },
          uColor: { value: new THREE.Color(isRoad ? options.colors.roadColor : options.colors.islandColor) },
          uTime: this.uTime,
          ...options.distortion.uniforms,
          fogColor: this.webgl.fogUniforms.fogColor,
          fogNear: this.webgl.fogUniforms.fogNear,
          fogFar: this.webgl.fogUniforms.fogFar
        };
        if (isRoad) {
          Object.assign(uniforms, {
            uLanes: { value: options.lanesPerRoad },
            uBrokenLinesColor: { value: new THREE.Color(options.colors.brokenLines) },
            uShoulderLinesColor: { value: new THREE.Color(options.colors.shoulderLines) },
            uShoulderLinesWidthPercentage: { value: options.shoulderLinesWidthPercentage },
            uBrokenLinesLengthPercentage: { value: options.brokenLinesLengthPercentage },
            uBrokenLinesWidthPercentage: { value: options.brokenLinesWidthPercentage }
          });
        }
        const material = new THREE.ShaderMaterial({
          fragmentShader: isRoad ? ROAD_FRAGMENT : ISLAND_FRAGMENT,
          vertexShader: ROAD_VERTEX,
          side: THREE.DoubleSide,
          uniforms
        });
        material.onBeforeCompile = shader => {
          shader.vertexShader = shader.vertexShader.replace('#include <getDistortion_vertex>', options.distortion.getDistortion);
        };
        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.z = -options.length / 2;
        mesh.position.x += (options.islandWidth / 2 + options.roadWidth / 2) * side;
        this.webgl.scene.add(mesh);
        return mesh;
      }
      init() {
        this.leftRoadWay = this.createPlane(-1, this.options.roadWidth, true);
        this.rightRoadWay = this.createPlane(1, this.options.roadWidth, true);
        this.island = this.createPlane(0, this.options.islandWidth, false);
      }
      update(time) { this.uTime.value = time; }
    }

    class CarLights {
      constructor(webgl, options, colors, speed, fade) { this.webgl = webgl; this.options = options; this.colors = colors; this.speed = speed; this.fade = fade; }
      init() {
        const options = this.options;
        let geometry = new THREE.TubeGeometry(new THREE.LineCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1)), 40, 1, 8, false);
        let instanced = new THREE.InstancedBufferGeometry().copy(geometry);
        instanced.instanceCount = options.lightPairsPerRoadWay * 2;
        let laneWidth = options.roadWidth / options.lanesPerRoad;
        let aOffset = [], aMetrics = [], aColor = [];
        let colors = Array.isArray(this.colors) ? this.colors.map(c => new THREE.Color(c)) : new THREE.Color(this.colors);
        for (let i = 0; i < options.lightPairsPerRoadWay; i++) {
          let radius = Math.random() * (options.carLightsRadius[1] - options.carLightsRadius[0]) + options.carLightsRadius[0];
          let length = Math.random() * (options.carLightsLength[1] - options.carLightsLength[0]) + options.carLightsLength[0];
          let speed = Math.random() * (this.speed[1] - this.speed[0]) + this.speed[0];
          let laneX = (i % options.lanesPerRoad) * laneWidth - options.roadWidth / 2 + laneWidth / 2 + (Math.random() * (options.carShiftX[1] - options.carShiftX[0]) + options.carShiftX[0]) * laneWidth;
          let offsetY = (Math.random() * (options.carFloorSeparation[1] - options.carFloorSeparation[0]) + options.carFloorSeparation[0]) + radius * 1.3;
          let offsetZ = -Math.random() * options.length;
          let c = Array.isArray(colors) ? colors[Math.floor(Math.random() * colors.length)] : colors;
          for (let j = 0; j < 2; j++) {
            aOffset.push(laneX + (j === 0 ? -1 : 1) * (Math.random() * (options.carWidthPercentage[1] - options.carWidthPercentage[0]) + options.carWidthPercentage[0]) * laneWidth / 2, offsetY, offsetZ);
            aMetrics.push(radius, length, speed);
            aColor.push(c.r, c.g, c.b);
          }
        }
        instanced.setAttribute('aOffset', new THREE.InstancedBufferAttribute(new Float32Array(aOffset), 3));
        instanced.setAttribute('aMetrics', new THREE.InstancedBufferAttribute(new Float32Array(aMetrics), 3));
        instanced.setAttribute('aColor', new THREE.InstancedBufferAttribute(new Float32Array(aColor), 3));
        const material = new THREE.ShaderMaterial({
          fragmentShader: CAR_LIGHTS_FRAGMENT, vertexShader: CAR_LIGHTS_VERTEX, transparent: true,
          uniforms: { uTime: { value: 0 }, uTravelLength: { value: options.length }, uFade: { value: this.fade }, ...this.webgl.fogUniforms, ...options.distortion.uniforms }
        });
        material.onBeforeCompile = shader => { shader.vertexShader = shader.vertexShader.replace('#include <getDistortion_vertex>', options.distortion.getDistortion); };
        this.mesh = new THREE.Mesh(instanced, material); this.mesh.frustumCulled = false; this.webgl.scene.add(this.mesh);
      }
      update(time) { this.mesh.material.uniforms.uTime.value = time; }
    }

    class LightsSticks {
      constructor(webgl, options) { this.webgl = webgl; this.options = options; }
      init() {
        const options = this.options;
        let instanced = new THREE.InstancedBufferGeometry().copy(new THREE.PlaneGeometry(1, 1));
        instanced.instanceCount = options.totalSideLightSticks;
        const aOffset = [], aColor = [], aMetrics = [];
        let colors = Array.isArray(options.colors.sticks) ? options.colors.sticks.map(c => new THREE.Color(c)) : new THREE.Color(options.colors.sticks);
        for (let i = 0; i < options.totalSideLightSticks; i++) {
          aOffset.push((i - 1) * (options.length / (options.totalSideLightSticks - 1)) * 2 + Math.random());
          let c = Array.isArray(colors) ? colors[Math.floor(Math.random() * colors.length)] : colors;
          aColor.push(c.r, c.g, c.b);
          aMetrics.push(Math.random() * (options.lightStickWidth[1] - options.lightStickWidth[0]) + options.lightStickWidth[0], Math.random() * (options.lightStickHeight[1] - options.lightStickHeight[0]) + options.lightStickHeight[0]);
        }
        instanced.setAttribute('aOffset', new THREE.InstancedBufferAttribute(new Float32Array(aOffset), 1));
        instanced.setAttribute('aColor', new THREE.InstancedBufferAttribute(new Float32Array(aColor), 3));
        instanced.setAttribute('aMetrics', new THREE.InstancedBufferAttribute(new Float32Array(aMetrics), 2));
        const material = new THREE.ShaderMaterial({
          fragmentShader: STICKS_FRAGMENT, vertexShader: STICKS_VERTEX, side: THREE.DoubleSide,
          uniforms: { uTravelLength: { value: options.length }, uTime: { value: 0 }, ...this.webgl.fogUniforms, ...options.distortion.uniforms }
        });
        material.onBeforeCompile = shader => { shader.vertexShader = shader.vertexShader.replace('#include <getDistortion_vertex>', options.distortion.getDistortion); };
        this.mesh = new THREE.Mesh(instanced, material); this.mesh.frustumCulled = false; this.webgl.scene.add(this.mesh);
      }
      update(time) { this.mesh.material.uniforms.uTime.value = time; }
    }

    class App {
      constructor(container, options) {
        this.container = container; this.options = options; this.clock = new THREE.Clock(); this.timeOffset = 0; this.speedUp = 0; this.disposed = false;
        try {
          this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: "high-performance" });
          this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
          this.renderer.setSize(initW, initH, false);
          container.appendChild(this.renderer.domElement);
          
          this.scene = new THREE.Scene();
          this.camera = new THREE.PerspectiveCamera(options.fov, initW / initH, 0.1, 10000);
          this.camera.position.set(0, 8, -5);
          
          let fog = new THREE.Fog(options.colors.background, options.length * 0.2, options.length * 500);
          this.scene.fog = fog;
          this.fogUniforms = { fogColor: { value: fog.color }, fogNear: { value: fog.near }, fogFar: { value: fog.far } };
          
          this.road = new Road(this, options);
          this.leftCarLights = new CarLights(this, options, options.colors.leftCars, options.movingAwaySpeed, new THREE.Vector2(0, 1 - options.carLightsFade));
          this.rightCarLights = new CarLights(this, options, options.colors.rightCars, options.movingCloserSpeed, new THREE.Vector2(1, 0 + options.carLightsFade));
          this.leftSticks = new LightsSticks(this, options);
          
          this.road.init(); this.leftCarLights.init(); 
          this.leftCarLights.mesh.position.x = -options.roadWidth / 2 - options.islandWidth / 2;
          this.rightCarLights.init();
          this.rightCarLights.mesh.position.x = options.roadWidth / 2 + options.islandWidth / 2;
          this.leftSticks.init();
          this.leftSticks.mesh.position.x = -(options.roadWidth + options.islandWidth / 2);
          
          const context = this.renderer.getContext();
          if (context && context.getContextAttributes()) {
             try {
                this.composer = new EffectComposer(this.renderer);
                this.composer.addPass(new RenderPass(this.scene, this.camera));
                this.composer.addPass(new EffectPass(this.camera, new BloomEffect({ luminanceThreshold: 0.2, luminanceSmoothing: 0, resolutionScale: 1 })));
             } catch (e) { this.composer = null; }
          }
          
          this.tick = this.tick.bind(this);
          requestAnimationFrame(this.tick);
        } catch (e) { console.error("Initial WebGL render failed", e); }
      }
      tick() {
        if (this.disposed) return;
        const delta = this.clock.getDelta();
        const time = this.clock.elapsedTime + (this.timeOffset += this.speedUp * delta);
        this.road.update(time); this.leftCarLights.update(time); this.rightCarLights.update(time); this.leftSticks.update(time);
        if (this.options.distortion.getJS) {
          const d = this.options.distortion.getJS(0.025, time);
          this.camera.lookAt(this.camera.position.x + d.x, this.camera.position.y + d.y, this.camera.position.z + d.z);
        }
        if (this.composer) this.composer.render(delta); else this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(this.tick);
      }
      dispose() {
        this.disposed = true;
        if (this.composer) this.composer.dispose();
        if (this.renderer) {
          this.renderer.dispose();
          this.renderer.forceContextLoss();
          if (this.renderer.domElement?.parentNode) this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
        }
        this.scene?.clear();
      }
    }

    const ROAD_VERTEX = `uniform float uTime; uniform float uTravelLength; varying vec2 vUv; #include <getDistortion_vertex>
      void main() {
        vec3 t = position.xyz; vec3 d = getDistortion((t.y + uTravelLength / 2.) / uTravelLength);
        t.x += d.x; t.z += d.y; t.y += -1. * d.z;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(t, 1.); vUv = uv; }`;
    const ROAD_FRAGMENT = `varying vec2 vUv; uniform vec3 uColor; uniform float uTime; uniform float uLanes; uniform vec3 uBrokenLinesColor; 
      void main() {
        vec2 uv = vUv; uv.y = mod(uv.y + uTime * 0.05, 1.);
        float lw = 1.0 / uLanes; float blw = lw * 0.1;
        float bl = step(1.0 - blw, fract(uv.x * 2.0)) * step(0.5, fract(uv.y * 10.0));
        gl_FragColor = vec4(mix(uColor, uBrokenLinesColor, bl * uv.x), 1.); }`;
    const ISLAND_FRAGMENT = `varying vec2 vUv; uniform vec3 uColor; void main() { gl_FragColor = vec4(uColor, 1.); }`;
    const CAR_LIGHTS_VERTEX = `attribute vec3 aOffset; attribute vec3 aMetrics; attribute vec3 aColor; uniform float uTravelLength; uniform float uTime; varying vec2 vUv; varying vec3 vColor; #include <getDistortion_vertex>
      void main() {
        vec3 t = position.xyz; t.xy *= aMetrics.r; t.z *= aMetrics.g;
        t.z += aMetrics.g - mod(uTime * aMetrics.b + aOffset.z, uTravelLength); t.xy += aOffset.xy;
        t.xyz += getDistortion(abs(t.z / uTravelLength));
        gl_Position = projectionMatrix * modelViewMatrix * vec4(t, 1.); vUv = uv; vColor = aColor; }`;
    const CAR_LIGHTS_FRAGMENT = `varying vec3 vColor; varying vec2 vUv; uniform vec2 uFade; void main() { gl_FragColor = vec4(vColor, smoothstep(uFade.x, uFade.y, vUv.x)); }`;
    const STICKS_VERTEX = `attribute float aOffset; attribute vec3 aColor; attribute vec2 aMetrics; uniform float uTravelLength; uniform float uTime; varying vec3 vColor;
      #include <getDistortion_vertex>
      void main() {
        vec3 t = position.xyz; t.xy *= aMetrics;
        float tm = mod(uTime * 120. + aOffset, uTravelLength);
        t = (mat4(0.,0.,1.,0., 0.,1.,0.,0., -1.,0.,0.,0., 0.,0.,0.,1.) * vec4(t,1.)).xyz;
        t.z += -uTravelLength + tm; t.xyz += getDistortion(abs(t.z / uTravelLength));
        gl_Position = projectionMatrix * modelViewMatrix * vec4(t, 1.); vColor = aColor; }`;
    const STICKS_FRAGMENT = `varying vec3 vColor; void main() { gl_FragColor = vec4(vColor, 1.); }`;

    const options = { ...DEFAULT_EFFECT_OPTIONS, ...effectOptions, distortion: distortions[effectOptions.distortion || DEFAULT_EFFECT_OPTIONS.distortion] };
    app = new App(hyperspeed.current, options);
    appRef.current = app;

    return () => { if (appRef.current) { appRef.current.dispose(); appRef.current = null; } };
  }, [effectOptions]);

  return <div id="lights" ref={hyperspeed} style={{ position: 'absolute', width: '100%', height: '100%', zIndex: -1, background: '#000' }}></div>;
};

export default Hyperspeed;
