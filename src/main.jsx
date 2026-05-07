import React from "react";
import ReactDOM from "react-dom/client";
import gsap from "gsap";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import Lenis from "lenis";
import App from "./App";
import "./index.css";

import airplain from "./assets/airplain.jpg";
import butterfly from "./assets/butterfly.jpg";
import enstain from "./assets/enstain.jpg";
import flyersPromo from "./assets/Flyers_Promo.jpg";
import headphone from "./assets/headphone.jpg";
import hoverSound from "./assets/hover.b226066e.mp3";

const clickImages = [airplain, butterfly, enstain, flyersPromo, headphone];

let clickEffectReady = false;
let activeClickImages = 0;
let menuOpen = false;

let threeRenderer = null;
let threeScene = null;
let threeCamera = null;
let threeModel = null;
let threeAnimId = null;

let lenis = null;

let finalCountdownStarted = false;
let finalCountdownDone = false;
let finalCountdownInterval = null;
let finalRevealTriggered = false;
let finalGravityCall = null;

function initThree() {
  const canvas = document.getElementById("threeCanvas");
  if (!canvas) return;

  destroyThree();

  threeScene = new THREE.Scene();

  threeCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  threeCamera.position.set(0, 0, 5);

  threeRenderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
  });

  const modelSize = Math.min(window.innerWidth * 0.7, 900);

  threeRenderer.setSize(modelSize, modelSize);
  threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  threeRenderer.setClearColor(0x000000, 0);
  threeRenderer.toneMapping = THREE.ACESFilmicToneMapping;
  threeRenderer.toneMappingExposure = 1.4;
  threeRenderer.outputColorSpace = THREE.SRGBColorSpace;
  threeRenderer.sortObjects = true;

  const ambient = new THREE.AmbientLight(0xffffff, 0.7);
  threeScene.add(ambient);

  const hemi = new THREE.HemisphereLight(0xffffff, 0xcdfd50, 2.2);
  threeScene.add(hemi);

  const dirLight1 = new THREE.DirectionalLight(0xffffff, 3);
  dirLight1.position.set(5, 8, 5);
  threeScene.add(dirLight1);

  const dirLight2 = new THREE.DirectionalLight(0xcdfd50, 2);
  dirLight2.position.set(-5, -3, 3);
  threeScene.add(dirLight2);

  const pointLight = new THREE.PointLight(0xffffff, 3, 20);
  pointLight.position.set(0, 3, 4);
  threeScene.add(pointLight);

  const loader = new GLTFLoader();

  loader.load(
    "/font/star2.gltf",
    (gltf) => {
      threeModel = gltf.scene;

      const waterMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xcdfd50,
        metalness: 0,
        roughness: 0.015,
        transmission: 1,
        thickness: 3,
        transparent: true,
        opacity: 0.36,
        ior: 1.333,
        envMapIntensity: 2.5,
        clearcoat: 1,
        clearcoatRoughness: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
        depthTest: true,
      });

      threeModel.traverse((child) => {
        if (child.isMesh) {
          child.material = waterMaterial;
          child.castShadow = false;
          child.receiveShadow = false;
          child.renderOrder = 10;
        }
      });

      const box = new THREE.Box3().setFromObject(threeModel);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 3.8 / maxDim;

      threeModel.scale.setScalar(scale);
      threeModel.position.sub(center.multiplyScalar(scale));

      threeScene.add(threeModel);
    },
    undefined,
    (err) => console.error("GLTF error:", err)
  );

  function animate() {
    threeAnimId = requestAnimationFrame(animate);

    if (threeModel) {
      threeModel.rotation.y += 0.006;
      threeModel.rotation.x += 0.002;
    }

    if (threeRenderer && threeScene && threeCamera) {
      threeRenderer.render(threeScene, threeCamera);
    }
  }

  animate();
}

function destroyThree() {
  if (threeAnimId) {
    cancelAnimationFrame(threeAnimId);
    threeAnimId = null;
  }

  if (threeModel) {
    threeModel.traverse((child) => {
      if (child.isMesh) {
        if (child.geometry) child.geometry.dispose();

        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => mat.dispose());
          } else {
            child.material.dispose();
          }
        }
      }
    });
  }

  if (threeRenderer) {
    threeRenderer.dispose();
    threeRenderer = null;
  }

  threeScene = null;
  threeCamera = null;
  threeModel = null;
}

document.addEventListener("DOMContentLoaded", () => {
  const windowWidth = window.innerWidth;
  const wrapperWidth = 180;
  const finalPosition = windowWidth - wrapperWidth;
  const stepDistance = finalPosition / 6;
  const tl = gsap.timeline();

  tl.to(".count", {
    x: -900,
    duration: 0.85,
    delay: 0.5,
    ease: "power4.inOut",
  });

  for (let i = 1; i <= 6; i++) {
    const xPosition = -900 + i * 180;

    tl.to(".count", {
      x: xPosition,
      duration: 0.85,
      ease: "power4.inOut",
      onStart: () => {
        gsap.to(".count-wrapper", {
          x: stepDistance * i,
          duration: 0.85,
          ease: "power4.inOut",
        });
      },
    });
  }

  gsap.set(".revealer svg", { scale: 0 });

  gsap.set(".cursor-follower", {
    xPercent: -50,
    yPercent: -50,
    scale: 0,
  });

  const delays = [6, 6.5, 7];

  document.querySelectorAll(".revealer svg").forEach((el, i) => {
    gsap.to(el, {
      scale: 45,
      duration: 1.5,
      ease: "power4.inOut",
      delay: delays[i],
      onComplete: () => {
        if (i === delays.length - 1) {
          document.querySelector(".loader")?.remove();
          clickEffectReady = true;
        }
      },
    });
  });

  gsap.to(".header h1", {
    onStart: () => {
      gsap.to(".toggle-btn", {
        scale: 1,
        duration: 1,
        ease: "power4.inOut",
      });

      gsap.to(".line p", {
        y: 0,
        duration: 1,
        stagger: 0.1,
        ease: "power3.out",
      });

      gsap.to(".marquee-track", {
        xPercent: -50,
        duration: 14,
        repeat: -1,
        ease: "none",
      });
    },
    rotateY: 0,
    opacity: 1,
    duration: 2,
    ease: "power3.out",
    delay: 8,
  });

  const follower = document.querySelector(".cursor-follower");
  const heroText = document.querySelector(".header h1");
  const toggleBtn = document.querySelector(".toggle-btn");
  const menuOverlay = document.querySelector(".menu-overlay");
  const curtainDark = document.querySelector(".menu-curtain--dark");
  const curtainLime = document.querySelector(".menu-curtain--lime");
  const socialPills = document.querySelectorAll(".social-pill");
  const menuLines = document.querySelectorAll(".menu-line");
  const scrollArea = document.getElementById("menuScrollArea");
  const modelContainer = document.getElementById("modelContainer");
  const menuParagraphs = document.getElementById("menuParagraphs");

  function createFinalCountdown() {
    if (document.getElementById("finalCountdown")) return;

    const countdown = document.createElement("div");
    countdown.className = "final-countdown";
    countdown.id = "finalCountdown";

    countdown.innerHTML = `
      <span class="count-num" id="countLeft">5</span>
      <span class="count-text" id="countText">This message will self destruct in five…</span>
      <span class="count-num" id="countRight">5</span>
    `;

    document.querySelector(".menu-content")?.appendChild(countdown);
  }

  function createFinalRevealAndCTA() {
    if (!document.getElementById("finalRevealLayer")) {
      const revealLayer = document.createElement("div");
      revealLayer.className = "final-reveal-layer";
      revealLayer.id = "finalRevealLayer";

      revealLayer.innerHTML = `
        <div class="final-revealer final-revealer-1">
          <svg width="151" height="148" viewBox="0 0 151 148" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M75.9817 0L77.25 34.2209C78.0259 55.1571 94.8249 71.9475 115.762 72.7127L150.982 74L115.762 75.2873C94.8249 76.0525 78.0259 92.8429 77.25 113.779L75.9817 148L74.7134 113.779C73.9375 92.8429 57.1385 76.0525 36.2019 75.2873L0.981689 74L36.2018 72.7127C57.1384 71.9475 73.9375 55.1571 74.7134 34.2209L75.9817 0Z" fill="white"/>
          </svg>
        </div>

        <div class="final-revealer final-revealer-2">
          <svg width="151" height="148" viewBox="0 0 151 148" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M75.9817 0L77.25 34.2209C78.0259 55.1571 94.8249 71.9475 115.762 72.7127L150.982 74L115.762 75.2873C94.8249 76.0525 78.0259 92.8429 77.25 113.779L75.9817 148L74.7134 113.779C73.9375 92.8429 57.1385 76.0525 36.2019 75.2873L0.981689 74L36.2018 72.7127C57.1384 71.9475 73.9375 55.1571 74.7134 34.2209L75.9817 0Z" fill="#CDFD50"/>
          </svg>
        </div>

        <div class="final-revealer final-revealer-3">
          <svg width="151" height="148" viewBox="0 0 151 148" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M75.9817 0L77.25 34.2209C78.0259 55.1571 94.8249 71.9475 115.762 72.7127L150.982 74L115.762 75.2873C94.8249 76.0525 78.0259 92.8429 77.25 113.779L75.9817 148L74.7134 113.779C73.9375 92.8429 57.1385 76.0525 36.2019 75.2873L0.981689 74L36.2018 72.7127C57.1384 71.9475 73.9375 55.1571 74.7134 34.2209L75.9817 0Z" fill="black"/>
          </svg>
        </div>
      `;

      document.querySelector(".menu-content")?.appendChild(revealLayer);
    }

    if (!document.getElementById("finalCtaScreen")) {
      const finalScreen = document.createElement("div");
      finalScreen.className = "final-cta-screen";
      finalScreen.id = "finalCtaScreen";

      finalScreen.innerHTML = `
        ${Array.from({ length: 15 })
          .map((_, i) => {
            const names = ["Awwwards", "CSSDA", "FWA"];
            const name = names[i % names.length];

            return `
              <div class="final-floating-card card-${i}">
                ${name}
              </div>
            `;
          })
          .join("")}

        <div class="final-cta-pill">
          <p>Want to work with us?</p>
          <h2>Drop us a line.</h2>
        </div>
      `;

      document.querySelector(".menu-content")?.appendChild(finalScreen);
    }
  }

  function makeCardInteractive(card) {
  if (card.dataset.interactive === "true") return;

  card.dataset.interactive = "true";
  card.style.pointerEvents = "auto";
  card.style.cursor = "grab";

  const platformY = window.innerHeight * 0.28;

  card.addEventListener("mouseenter", () => {
    const currentX = Number(gsap.getProperty(card, "x")) || 0;

    const nextX = gsap.utils.clamp(
      -window.innerWidth * 0.45,
      window.innerWidth * 0.45,
      currentX + gsap.utils.random(-180, 180)
    );

    gsap.to(card, {
      x: nextX,
      y: platformY - gsap.utils.random(80, 180),
      rotation: `+=${gsap.utils.random(-180, 180)}`,
      duration: 0.45,
      ease: "power3.out",
    });

    gsap.to(card, {
      y: platformY + gsap.utils.random(10, 80),
      duration: 0.9,
      delay: 0.35,
      ease: "bounce.out",
    });
  });
}

  function triggerFinalGravity() {
  const finalCards = document.querySelectorAll(".final-floating-card");

  finalCards.forEach((card) => {
    gsap.to(card, {
      y: window.innerHeight * 0.28 + gsap.utils.random(10, 80),
      x: `+=${gsap.utils.random(-120, 120)}`,
      rotation: `+=${gsap.utils.random(-90, 90)}`,
      duration: gsap.utils.random(1.1, 1.7),
      delay: gsap.utils.random(0, 0.25),
      ease: "bounce.out",
      onComplete: () => {
        makeCardInteractive(card);
      },
    });
  });
}
  function scheduleFinalGravity() {
    if (finalGravityCall) {
      finalGravityCall.kill();
      finalGravityCall = null;
    }

    finalGravityCall = gsap.delayedCall(2, triggerFinalGravity);
  }

  function randomizeFinalCards() {
    const finalCards = document.querySelectorAll(".final-floating-card");

    const colors = [
      "#ff3b30",
      "#8e44ff",
      "#ff8c00",
      "#00c2ff",
      "#ff4fd8",
      "#00e676",
      "#ffd60a",
    ];

    finalCards.forEach((card, i) => {
      const bg = colors[i % colors.length];

      card.dataset.interactive = "false";
      card.style.pointerEvents = "none";

      gsap.set(card, {
        left: "50%",
        top: "50%",
        opacity: 0,
        x: gsap.utils.random(
          -window.innerWidth * 0.42,
          window.innerWidth * 0.42
        ),
        y: gsap.utils.random(
          -window.innerHeight * 0.35,
          window.innerHeight * 0.25
        ),
        rotation: gsap.utils.random(-18, 18),
        backgroundColor: bg,
        color: "#111111",
        zIndex: 3,
      });
    });
  }

  function triggerFinalReveal() {
    if (finalRevealTriggered) return;

    finalRevealTriggered = true;

    const finalRevealLayer = document.getElementById("finalRevealLayer");
    const whiteStar = document.querySelector(".final-revealer-1 svg");
    const limeStar = document.querySelector(".final-revealer-2 svg");
    const blackStar = document.querySelector(".final-revealer-3 svg");
    const finalCtaScreen = document.getElementById("finalCtaScreen");
    const finalCtaPill = document.querySelector(".final-cta-pill");
    const finalCards = document.querySelectorAll(".final-floating-card");

    if (
      !finalRevealLayer ||
      !whiteStar ||
      !limeStar ||
      !blackStar ||
      !finalCtaScreen ||
      !finalCtaPill
    ) {
      return;
    }

    randomizeFinalCards();

    const revealTl = gsap.timeline();

    revealTl
      .set(finalRevealLayer, {
        opacity: 1,
        pointerEvents: "none",
      })
      .set([whiteStar, limeStar, blackStar], {
        scale: 0,
        transformOrigin: "50% 50%",
      })
      .to(whiteStar, {
        scale: 45,
        duration: 1.5,
        ease: "power4.inOut",
      })
      .to(
        limeStar,
        {
          scale: 45,
          duration: 1.5,
          ease: "power4.inOut",
        },
        0.35
      )
      .to(
        blackStar,
        {
          scale: 45,
          duration: 1.5,
          ease: "power4.inOut",
        },
        0.7
      )
      .to(
        ".menu-scroll-area",
        {
          opacity: 0,
          duration: 0.4,
          ease: "power2.out",
        },
        0.75
      )
      .set(
        finalCtaScreen,
        {
          opacity: 1,
          pointerEvents: "all",
        },
        1.75
      )
      .add(() => {
        finalCtaScreen.classList.add("is-active");
        destroyThree();
        destroyLenis();
      }, 1.8)
      .to(
        finalRevealLayer,
        {
          opacity: 0,
          duration: 0.45,
          ease: "power2.out",
        },
        2.15
      )
      .to(
        finalCtaPill,
        {
          opacity: 1,
          y: "-50%",
          duration: 0.8,
          ease: "power3.out",
        },
        2.25
      )
      .to(
        finalCards,
        {
          opacity: 1,
          duration: 0.8,
          stagger: 0.06,
          ease: "power3.out",
          onComplete: scheduleFinalGravity,
        },
        2.35
      );
  }

  function startFinalCountdown() {
    if (finalCountdownStarted || finalCountdownDone) return;

    const finalCountdown = document.getElementById("finalCountdown");
    const countLeft = document.getElementById("countLeft");
    const countRight = document.getElementById("countRight");
    const countText = document.getElementById("countText");

    if (!finalCountdown || !countLeft || !countRight || !countText) return;

    finalCountdownStarted = true;

    let count = 5;
    const words = ["zero", "one", "two", "three", "four", "five"];

    countLeft.textContent = count;
    countRight.textContent = count;
    countText.textContent = "This message will self destruct in five…";

    gsap.to(finalCountdown, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: "power3.out",
    });

    finalCountdownInterval = setInterval(() => {
      count--;

      countLeft.textContent = count;
      countRight.textContent = count;
      countText.textContent = `This message will self destruct in ${words[count]}…`;

      gsap.fromTo(
        [countLeft, countRight],
        { y: 16, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.35,
          ease: "power3.out",
        }
      );

      if (count <= 0) {
        clearInterval(finalCountdownInterval);
        finalCountdownInterval = null;
        finalCountdownDone = true;

        gsap.to(finalCountdown, {
          opacity: 0,
          y: 40,
          duration: 0.6,
          delay: 0.4,
          ease: "power3.inOut",
          onComplete: triggerFinalReveal,
        });
      }
    }, 1000);
  }

  function resetFinalCountdown() {
    finalCountdownStarted = false;
    finalCountdownDone = false;
    finalRevealTriggered = false;

    if (finalGravityCall) {
      finalGravityCall.kill();
      finalGravityCall = null;
    }

    if (finalCountdownInterval) {
      clearInterval(finalCountdownInterval);
      finalCountdownInterval = null;
    }

    const finalCountdown = document.getElementById("finalCountdown");
    const finalRevealLayer = document.getElementById("finalRevealLayer");
    const finalRevealSvgs = document.querySelectorAll(".final-revealer svg");
    const finalCtaScreen = document.getElementById("finalCtaScreen");
    const finalCtaPill = document.querySelector(".final-cta-pill");

    if (finalCountdown) {
      gsap.set(finalCountdown, {
        opacity: 0,
        y: 40,
      });
    }

    if (finalRevealLayer) {
      gsap.set(finalRevealLayer, {
        opacity: 0,
        pointerEvents: "none",
      });
    }

    if (finalRevealSvgs.length) {
      gsap.set(finalRevealSvgs, {
        scale: 0,
        transformOrigin: "50% 50%",
      });
    }

    if (finalCtaScreen) {
      finalCtaScreen.classList.remove("is-active");
      gsap.set(finalCtaScreen, {
        opacity: 0,
        pointerEvents: "none",
      });
    }

    if (finalCtaPill) {
      gsap.set(finalCtaPill, {
        opacity: 0,
        y: "-40%",
        rotation: 0,
      });
    }

    randomizeFinalCards();

    gsap.set(".menu-scroll-area", {
      opacity: 1,
    });
  }

  createFinalCountdown();
  createFinalRevealAndCTA();

  function resizeThreeRenderer() {
    if (!threeRenderer) return;

    const modelSize = Math.min(window.innerWidth * 0.7, 900);
    threeRenderer.setSize(modelSize, modelSize);
  }

  window.addEventListener("resize", resizeThreeRenderer);

  function onMenuScroll() {
    if (!scrollArea || !modelContainer) return;

    const scrollTop = scrollArea.scrollTop;

    const modelY =
      scrollTop - modelContainer.offsetHeight / 2 + window.innerHeight / 2;

    gsap.set(modelContainer, {
      y: modelY,
    });

    const centerY = window.innerHeight / 2;
    const revealRange = window.innerHeight * 0.38;

    menuLines.forEach((line) => {
      const span = line.querySelector("span");
      if (!span) return;

      const rect = line.getBoundingClientRect();
      const lineMidY = rect.top + rect.height / 2;
      const distance = Math.abs(lineMidY - centerY);

      const strength = gsap.utils.clamp(0, 1, 1 - distance / revealRange);

      line.classList.remove("is-active", "is-passed");

      if (lineMidY < centerY - 35) {
        line.classList.add("is-passed");
      }

      if (strength > 0.72) {
        line.classList.add("is-active");
      }

      gsap.to(span, {
        opacity: 0.12 + strength * 0.88,
        y: (1 - strength) * 16,
        filter: `blur(${(1 - strength) * 1.2}px)`,
        textShadow:
          strength > 0.65
            ? "0 0 18px rgba(255,255,255,0.45)"
            : "0 0 0 rgba(255,255,255,0)",
        duration: 0.35,
        ease: "power2.out",
        overwrite: true,
      });
    });

    const lastLine = document.querySelector('.menu-line[data-index="24"]');

    if (lastLine) {
      const rect = lastLine.getBoundingClientRect();
      const lineMidY = rect.top + rect.height / 2;

      if (lineMidY <= window.innerHeight / 2 + 90) {
        startFinalCountdown();
      }
    }
  }

  function lenisRaf(time) {
    if (lenis) {
      lenis.raf(time * 1000);
    }
  }

  function initLenis() {
    if (!scrollArea || !menuParagraphs) return;

    if (lenis) {
      lenis.destroy();
      lenis = null;
    }

    lenis = new Lenis({
      wrapper: scrollArea,
      content: menuParagraphs,
      smoothWheel: true,
      lerp: 0.075,
      wheelMultiplier: 0.75,
      touchMultiplier: 1.2,
    });

    lenis.on("scroll", onMenuScroll);

    gsap.ticker.add(lenisRaf);
    gsap.ticker.lagSmoothing(0);
  }

  function destroyLenis() {
    gsap.ticker.remove(lenisRaf);

    if (lenis) {
      lenis.destroy();
      lenis = null;
    }
  }

  function openMenu() {
    menuOpen = true;

    resetFinalCountdown();

    toggleBtn.classList.add("menu-is-open");
    menuOverlay.classList.add("is-open");

    gsap.set(menuOverlay, {
      visibility: "visible",
      pointerEvents: "all",
    });

    gsap.set(".menu-content", {
      opacity: 1,
      pointerEvents: "all",
    });

    if (scrollArea) scrollArea.scrollTop = 0;

    gsap.set(curtainDark, { y: "-100%" });
    gsap.set(curtainLime, { y: "-100%" });
    gsap.set(socialPills, { x: 30, opacity: 0 });
    gsap.set(".menu-pitch-wrap", { y: 20, opacity: 0 });
    gsap.set(".menu-line span", {
      y: 30,
      opacity: 0,
      filter: "blur(0px)",
      textShadow: "0 0 0 rgba(255,255,255,0)",
    });

    menuLines.forEach((line) => {
      line.classList.remove("is-active", "is-passed");
    });

    initThree();

    if (modelContainer) {
      gsap.set(modelContainer, {
        y: window.innerHeight / 2 - modelContainer.offsetHeight / 2,
      });
    }

    const openTl = gsap.timeline();

    openTl
      .to(curtainDark, {
        y: "0%",
        duration: 0.7,
        ease: "power4.inOut",
      })
      .to(
        curtainLime,
        {
          y: "0%",
          duration: 0.7,
          ease: "power4.inOut",
        },
        "-=0.5"
      )
      .to(
        socialPills,
        {
          x: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.08,
          ease: "power3.out",
        },
        "-=0.3"
      )
      .to(
        ".menu-pitch-wrap",
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          ease: "power3.out",
        },
        "-=0.4"
      )
      .to(
        ".menu-line span",
        {
          y: 0,
          opacity: 0.18,
          duration: 0.55,
          stagger: 0.03,
          ease: "power3.out",
          onComplete: () => {
            initLenis();
            onMenuScroll();
          },
        },
        "-=0.3"
      );
  }

  function closeMenu() {
    menuOpen = false;

    resetFinalCountdown();
    destroyLenis();

    toggleBtn.classList.remove("menu-is-open");

    const closeTl = gsap.timeline({
      onStart: () => {
        gsap.set(".menu-content", {
          pointerEvents: "none",
        });
      },
      onComplete: () => {
        destroyThree();

        menuOverlay.classList.remove("is-open");

        gsap.set(menuOverlay, {
          visibility: "hidden",
          pointerEvents: "none",
        });

        gsap.set(".menu-content", {
          opacity: 0,
          pointerEvents: "none",
        });

        if (modelContainer) {
          gsap.set(modelContainer, {
            clearProps: "transform",
          });
        }

        gsap.set(".menu-line span", {
          opacity: 0,
          y: 30,
          filter: "blur(0px)",
          textShadow: "0 0 0 rgba(255,255,255,0)",
        });

        menuLines.forEach((line) => {
          line.classList.remove("is-active", "is-passed");
        });
      },
    });

    closeTl
      .to(socialPills, {
        x: 30,
        opacity: 0,
        duration: 0.3,
        stagger: 0.04,
        ease: "power3.in",
      })
      .to(
        ".menu-pitch-wrap",
        {
          y: 20,
          opacity: 0,
          duration: 0.3,
          ease: "power3.in",
        },
        "-=0.2"
      )
      .to(
        ".menu-line span",
        {
          y: 30,
          opacity: 0,
          duration: 0.25,
          stagger: 0.02,
          ease: "power3.in",
        },
        "-=0.2"
      )
      .to(
        ".menu-content",
        {
          opacity: 0,
          duration: 0.25,
          ease: "power2.out",
        },
        "-=0.2"
      )
      .to(
        curtainLime,
        {
          y: "-100%",
          duration: 0.7,
          ease: "power4.inOut",
        },
        "-=0.1"
      )
      .to(
        curtainDark,
        {
          y: "-100%",
          duration: 0.7,
          ease: "power4.inOut",
        },
        "-=0.5"
      );
  }

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      if (menuOpen) closeMenu();
      else openMenu();
    });

    toggleBtn.addEventListener("mouseenter", () => {
      gsap.to(follower, {
        scale: 0,
        duration: 0.25,
        ease: "power3.out",
      });

      document.body.style.cursor = "pointer";
    });

    toggleBtn.addEventListener("mouseleave", () => {
      document.body.style.cursor = "default";

      if (!clickEffectReady) return;

      gsap.to(follower, {
        scale: 1,
        duration: 0.35,
        ease: "power3.out",
      });
    });
  }

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let currentX = mouseX;
  let currentY = mouseY;

  window.addEventListener("mousemove", (e) => {
    if (!clickEffectReady) return;

    mouseX = e.clientX;
    mouseY = e.clientY;

    gsap.to(follower, {
      scale: 1,
      duration: 0.45,
      ease: "power3.out",
    });
  });

  window.addEventListener("mouseleave", () => {
    if (!clickEffectReady) return;

    gsap.to(follower, {
      scale: 0,
      duration: 0.45,
      ease: "power3.out",
    });
  });

  gsap.ticker.add(() => {
    currentX += (mouseX - currentX) * 0.12;
    currentY += (mouseY - currentY) * 0.12;

    gsap.set(follower, {
      x: currentX,
      y: currentY,
    });
  });

  if (heroText) {
    heroText.addEventListener("mouseenter", () => {
      gsap.to(follower, {
        width: 130,
        height: 130,
        borderRadius: "50%",
        mixBlendMode: "difference",
        duration: 0.6,
        ease: "power4.out",
      });
    });

    heroText.addEventListener("mouseleave", () => {
      gsap.to(follower, {
        width: 130,
        height: 130,
        borderRadius: "50%",
        mixBlendMode: "normal",
        duration: 0.6,
        ease: "power4.out",
      });
    });
  }

  window.addEventListener("click", (e) => {
    if (!clickEffectReady) return;
    if (menuOpen) return;
    if (e.target.closest(".toggle-btn")) return;

    const sound = new Audio(hoverSound);
    sound.volume = 1;
    sound.currentTime = 0;
    sound.play();

    const layer = document.querySelector(".click-image-layer");
    if (!layer) return;

    activeClickImages++;

    gsap.to(".header h1", {
      opacity: 0.18,
      duration: 0.25,
      ease: "power2.out",
    });

    const img = document.createElement("img");
    img.src = clickImages[Math.floor(Math.random() * clickImages.length)];
    img.className = "click-pop-image";
    layer.appendChild(img);

    const rS = gsap.utils.random(0.95, 1.15);
    const rY = gsap.utils.random(-260, -360);
    const rX = gsap.utils.random(-40, 40);
    const rR = gsap.utils.random(-8, 8);

    gsap.set(img, {
      x: e.clientX,
      y: e.clientY,
      scale: 0.75,
      opacity: 0,
      rotation: rR,
      transformOrigin: "center center",
    });

    gsap
      .timeline({
        onComplete: () => {
          img.remove();
          activeClickImages--;

          if (activeClickImages <= 0) {
            activeClickImages = 0;

            gsap.to(".header h1", {
              opacity: 1,
              duration: 0.6,
              ease: "power3.out",
            });
          }
        },
      })
      .to(img, {
        scale: rS,
        opacity: 1,
        duration: 0.55,
        ease: "power3.out",
      })
      .to(
        img,
        {
          x: e.clientX + rX,
          y: e.clientY + rY,
          rotation: rR * 1.8,
          duration: 2.2,
          ease: "power2.out",
        },
        0
      )
      .to(
        img,
        {
          opacity: 0,
          scale: rS * 0.96,
          duration: 0.75,
          ease: "power2.out",
        },
        1.45
      );
  });
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);