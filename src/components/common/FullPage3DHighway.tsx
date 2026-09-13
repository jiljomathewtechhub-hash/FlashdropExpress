import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const FullPage3DHighway: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;

    // 1. Scene & Atmosphere Fog (Clean Daylight Theme)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);
    scene.fog = new THREE.FogExp2(0xf8fafc, 0.008);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 450);
    camera.position.set(0, 3.8, 10.5);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 4. Lighting (Warm Natural Daylight)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.9);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffbeb, 2.2);
    sunLight.position.set(20, 30, 15);
    sunLight.castShadow = true;
    scene.add(sunLight);

    const redGlow = new THREE.PointLight(0xc5161d, 1.2, 25);
    redGlow.position.set(0, 2, 7);
    scene.add(redGlow);

    // 5. Procedural 3D Commercial Express Vehicle (Signature FlashDrop Red)
    const vehicleGroup = new THREE.Group();
    scene.add(vehicleGroup);

    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xc5161d,
      roughness: 0.25,
      metalness: 0.6,
    });

    const stripeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
      metalness: 0.2,
      emissive: 0xffffff,
      emissiveIntensity: 0.1,
    });

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x1e293b,
      roughness: 0.08,
      metalness: 0.8,
      transparent: true,
      opacity: 0.85,
    });

    const tireMat = new THREE.MeshStandardMaterial({
      color: 0x181a20,
      roughness: 0.85,
      metalness: 0.1,
    });

    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.2,
      metalness: 0.9,
    });

    const hlMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 4.0,
    });

    const tlMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      emissive: 0xe11d48,
      emissiveIntensity: 2.5,
    });

    const vWidth = 1.9;
    const vHeight = 1.9;
    const cargoLen = 3.4;
    const cabLen = 1.25;
    const wheelRadius = 0.42;

    // Main Cargo Body
    const cargoGeo = new THREE.BoxGeometry(vWidth, vHeight, cargoLen);
    const cargoMesh = new THREE.Mesh(cargoGeo, bodyMat);
    cargoMesh.position.set(0, vHeight / 2 + 0.45, 0.4);
    cargoMesh.castShadow = true;
    cargoMesh.receiveShadow = true;
    vehicleGroup.add(cargoMesh);

    // Red racing stripe
    const stripeGeo = new THREE.BoxGeometry(vWidth + 0.04, 0.26, cargoLen * 0.98);
    const stripeMesh = new THREE.Mesh(stripeGeo, stripeMat);
    stripeMesh.position.set(0, vHeight * 0.45 + 0.45, 0.4);
    vehicleGroup.add(stripeMesh);

    // Cab / Front
    const cabGeo = new THREE.BoxGeometry(vWidth * 0.96, vHeight * 0.85, cabLen);
    const cabMesh = new THREE.Mesh(cabGeo, bodyMat);
    cabMesh.position.set(0, (vHeight * 0.85) / 2 + 0.45, -cargoLen / 2 - cabLen / 2 + 0.4);
    cabMesh.castShadow = true;
    vehicleGroup.add(cabMesh);

    // Windshield
    const windshieldGeo = new THREE.BoxGeometry(vWidth * 0.88, vHeight * 0.45, 0.1);
    const windshield = new THREE.Mesh(windshieldGeo, glassMat);
    windshield.position.set(0, vHeight * 0.8 + 0.35, -cargoLen / 2 - cabLen * 0.35 + 0.4);
    windshield.rotation.x = -Math.PI * 0.18;
    vehicleGroup.add(windshield);

    // Front Grille
    const frontZ = -cargoLen / 2 - cabLen + 0.4;
    const grilleGeo = new THREE.BoxGeometry(vWidth * 0.72, 0.4, 0.1);
    const grille = new THREE.Mesh(
      grilleGeo,
      new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.9 })
    );
    grille.position.set(0, 0.75, frontZ);
    vehicleGroup.add(grille);

    // Headlights
    const hlGeo = new THREE.BoxGeometry(0.35, 0.18, 0.12);
    const hlLeft = new THREE.Mesh(hlGeo, hlMat);
    hlLeft.position.set(-vWidth * 0.35, 0.88, frontZ);
    vehicleGroup.add(hlLeft);

    const hlRight = new THREE.Mesh(hlGeo, hlMat);
    hlRight.position.set(vWidth * 0.35, 0.88, frontZ);
    vehicleGroup.add(hlRight);

    // Headlight Spotlights on Highway
    const spotLeft = new THREE.SpotLight(0xffffff, 6.0, 50, Math.PI / 5, 0.35, 1.2);
    spotLeft.position.set(-vWidth * 0.35, 0.88, frontZ);
    const spotTargetLeft = new THREE.Object3D();
    spotTargetLeft.position.set(-vWidth * 0.35, 0, frontZ - 25);
    vehicleGroup.add(spotTargetLeft);
    spotLeft.target = spotTargetLeft;
    vehicleGroup.add(spotLeft);

    const spotRight = new THREE.SpotLight(0xffffff, 6.0, 50, Math.PI / 5, 0.35, 1.2);
    spotRight.position.set(vWidth * 0.35, 0.88, frontZ);
    const spotTargetRight = new THREE.Object3D();
    spotTargetRight.position.set(vWidth * 0.35, 0, frontZ - 25);
    vehicleGroup.add(spotTargetRight);
    spotRight.target = spotTargetRight;
    vehicleGroup.add(spotRight);

    // Taillights
    const rearZ = cargoLen / 2 + 0.4;
    const tlGeo = new THREE.BoxGeometry(0.35, 0.15, 0.08);
    const tlLeft = new THREE.Mesh(tlGeo, tlMat);
    tlLeft.position.set(-vWidth * 0.38, 0.9, rearZ);
    vehicleGroup.add(tlLeft);

    const tlRight = new THREE.Mesh(tlGeo, tlMat);
    tlRight.position.set(vWidth * 0.38, 0.9, rearZ);
    vehicleGroup.add(tlRight);

    // 4 Rotating Wheels
    const wheels: THREE.Mesh[] = [];
    const wheelPositions = [
      { x: -vWidth / 2 - 0.06, z: -cargoLen * 0.35 + 0.4 },
      { x: vWidth / 2 + 0.06, z: -cargoLen * 0.35 + 0.4 },
      { x: -vWidth / 2 - 0.06, z: cargoLen * 0.35 + 0.4 },
      { x: vWidth / 2 + 0.06, z: cargoLen * 0.35 + 0.4 },
    ];

    wheelPositions.forEach((pos) => {
      const wGroup = new THREE.Group();
      wGroup.position.set(pos.x, wheelRadius + 0.05, pos.z);

      const tireGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, 0.32, 24);
      tireGeo.rotateZ(Math.PI / 2);
      const tire = new THREE.Mesh(tireGeo, tireMat);
      tire.castShadow = true;
      wGroup.add(tire);

      const rimGeo = new THREE.CylinderGeometry(wheelRadius * 0.65, wheelRadius * 0.65, 0.33, 16);
      rimGeo.rotateZ(Math.PI / 2);
      const rim = new THREE.Mesh(rimGeo, rimMat);
      wGroup.add(rim);

      vehicleGroup.add(wGroup);
      wheels.push(tire);
    });

    // 6. 3D Highway Road
    const roadWidth = 16;
    const roadLength = 260;
    const roadGeo = new THREE.PlaneGeometry(roadWidth, roadLength, 1, 1);
    roadGeo.rotateX(-Math.PI / 2);

    const roadMat = new THREE.MeshStandardMaterial({
      color: 0xdde5ed,
      roughness: 0.45,
      metalness: 0.2,
    });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.position.set(0, 0, 0);
    road.receiveShadow = true;
    scene.add(road);

    // Center Dashed Stripes
    const stripeCount = 32;
    const centerStripes: THREE.Mesh[] = [];
    const stripeLength = 4.0;
    const stripeGap = 5.0;
    const stripeUnit = stripeLength + stripeGap;

    const laneMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const shoulderMat = new THREE.MeshBasicMaterial({ color: 0xc5161d });

    for (let i = 0; i < stripeCount; i++) {
      const zPos = (i - stripeCount / 2) * stripeUnit;
      const sGeo = new THREE.PlaneGeometry(0.25, stripeLength);
      sGeo.rotateX(-Math.PI / 2);
      const stripe = new THREE.Mesh(sGeo, laneMat);
      stripe.position.set(0, 0.015, zPos);
      scene.add(stripe);
      centerStripes.push(stripe);
    }

    // Road Edge Safety Lines
    const leftEdgeGeo = new THREE.PlaneGeometry(0.28, roadLength);
    leftEdgeGeo.rotateX(-Math.PI / 2);
    const leftEdge = new THREE.Mesh(leftEdgeGeo, shoulderMat);
    leftEdge.position.set(-roadWidth / 2 + 0.35, 0.015, 0);
    scene.add(leftEdge);

    const rightEdgeGeo = new THREE.PlaneGeometry(0.28, roadLength);
    rightEdgeGeo.rotateX(-Math.PI / 2);
    const rightEdge = new THREE.Mesh(rightEdgeGeo, shoulderMat);
    rightEdge.position.set(roadWidth / 2 - 0.35, 0.015, 0);
    scene.add(rightEdge);

    // 7. Roadside Glowing Guide Beacons
    const poleCount = 16;
    const roadPoles: THREE.Group[] = [];
    const poleSpacing = 16;

    for (let i = 0; i < poleCount; i++) {
      const zPos = (i - poleCount / 2) * poleSpacing;
      const pGroup = new THREE.Group();
      pGroup.position.set(0, 0, zPos);

      // Soft rose & soft sky beacons instead of harsh neon
      const markerMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0xfb7185 : 0x38bdf8,
      });
      const mGeo = new THREE.BoxGeometry(0.16, 0.9, 0.16);
      const mLeft = new THREE.Mesh(mGeo, markerMat);
      mLeft.position.set(-roadWidth / 2 - 0.7, 0.45, 0);
      pGroup.add(mLeft);

      const mRight = new THREE.Mesh(mGeo, markerMat);
      mRight.position.set(roadWidth / 2 + 0.7, 0.45, 0);
      pGroup.add(mRight);

      scene.add(pGroup);
      roadPoles.push(pGroup);
    }

    // 8. Particle Speed Streaks
    const particleCount = 200;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 32;
      particlePositions[i * 3 + 1] = Math.random() * 8 + 0.2;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 200;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.16,
      transparent: true,
      opacity: 0.6,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 9. Horizon City Silhouettes (GTA Skyline)
    const buildingCount = 28;
    const skylineGroup = new THREE.Group();
    skylineGroup.position.set(0, 0, -120);

    for (let i = 0; i < buildingCount; i++) {
      const bWidth = 3 + Math.random() * 6;
      const bHeight = 10 + Math.random() * 32;
      const bDepth = 4 + Math.random() * 4;
      const bGeo = new THREE.BoxGeometry(bWidth, bHeight, bDepth);
      const bMat = new THREE.MeshBasicMaterial({ color: 0x070b13 });
      const building = new THREE.Mesh(bGeo, bMat);
      const xOffset = (i - buildingCount / 2) * 6.5 + (Math.random() - 0.5) * 2;
      building.position.set(xOffset, bHeight / 2, (Math.random() - 0.5) * 12);
      skylineGroup.add(building);
    }
    scene.add(skylineGroup);

    // 10. Scroll Listener for Forward & Reverse Physics
    const physics = {
      velocity: 0.25, // Base gentle idle cruise
      targetVelocity: 0.25,
      lastScrollY: window.scrollY,
      mouseX: 0,
      mouseY: 0,
    };

    const updateVehicleLane = () => {
      const isDesktop = window.innerWidth >= 1024;
      vehicleGroup.position.x = isDesktop ? 2.2 : 0;
    };
    updateVehicleLane();

    let scrollTimeout: any = null;

    const onScroll = () => {
      const currentScrollY = window.scrollY;
      const deltaY = currentScrollY - physics.lastScrollY;
      physics.lastScrollY = currentScrollY;

      // Positive delta = scrolling down = driving forward
      // Negative delta = scrolling up = driving in reverse
      if (Math.abs(deltaY) > 0.5) {
        physics.targetVelocity += deltaY * 0.032;
        physics.targetVelocity = Math.max(-3.0, Math.min(3.8, physics.targetVelocity));
      }

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        physics.targetVelocity = 0.25; // Return to gentle forward cruise
      }, 180);
    };

    const onMouseMove = (e: MouseEvent) => {
      physics.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      physics.mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    // 11. Animation Loop
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);
      const time = clock.getElapsedTime();

      // Smooth velocity interpolation
      physics.velocity += (physics.targetVelocity - physics.velocity) * 0.12;
      const vel = physics.velocity;

      // Rotate wheels based on velocity (forward or backward)
      wheels.forEach((wheel) => {
        wheel.rotation.x += vel * delta * 24;
      });

      // Animate center stripes & guide poles (Infinite road motion)
      const moveSpeed = vel * delta * 42;

      centerStripes.forEach((stripe) => {
        stripe.position.z += moveSpeed;
        if (stripe.position.z > (stripeCount / 2) * stripeUnit) {
          stripe.position.z -= stripeCount * stripeUnit;
        } else if (stripe.position.z < (-stripeCount / 2) * stripeUnit) {
          stripe.position.z += stripeCount * stripeUnit;
        }
      });

      roadPoles.forEach((pole) => {
        pole.position.z += moveSpeed;
        if (pole.position.z > (poleCount / 2) * poleSpacing) {
          pole.position.z -= poleCount * poleSpacing;
        } else if (pole.position.z < (-poleCount / 2) * poleSpacing) {
          pole.position.z += poleCount * poleSpacing;
        }
      });

      // Animate speed particles
      const posAttr = particles.geometry.attributes.position as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        posArray[i * 3 + 2] += moveSpeed * 1.5;
        if (posArray[i * 3 + 2] > 60) {
          posArray[i * 3 + 2] = -140;
        } else if (posArray[i * 3 + 2] < -140) {
          posArray[i * 3 + 2] = 60;
        }
      }
      posAttr.needsUpdate = true;

      // Suspension & pitch dynamics
      const pitchAngle = vel * -0.026;
      vehicleGroup.rotation.x += (pitchAngle - vehicleGroup.rotation.x) * 0.12;

      // Steering sway
      const yawAngle = physics.mouseX * 0.06;
      vehicleGroup.rotation.y += (yawAngle - vehicleGroup.rotation.y) * 0.08;

      // Engine rumble
      vehicleGroup.position.y = Math.sin(time * 12) * 0.008;

      // Camera parallax
      const isDesktop = window.innerWidth >= 1024;
      const targetCamX = physics.mouseX * 1.1 + (isDesktop ? 0.6 : 0);
      const targetCamY = 3.8 + physics.mouseY * 0.5;
      const targetCamZ = 10.5 + Math.abs(vel) * 0.45;

      camera.position.x += (targetCamX - camera.position.x) * 0.05;
      camera.position.y += (targetCamY - camera.position.y) * 0.05;
      camera.position.z += (targetCamZ - camera.position.z) * 0.05;
      camera.lookAt(isDesktop ? 1.0 : 0, 1.4, -4);

      renderer.render(scene, camera);
    };

    animate();

    const onResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      updateVehicleLane();
    };

    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('mousemove', onMouseMove);
      clearTimeout(scrollTimeout);
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
      {/* Precision Contrast Gradients for Content Legibility & 3D Depth in Light Theme */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#F8FAFC]/94 via-[#F8FAFC]/65 to-[#F8FAFC]/82 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#F8FAFC]/92 via-transparent to-[#F8FAFC]/94 pointer-events-none" />
    </div>
  );
};
