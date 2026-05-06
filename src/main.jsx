import React from "react";
import ReactDOM from "react-dom/client";
import gsap from "gsap";
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

  if (toggleBtn) {
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
        width: 170,
        height: 95,
        mixBlendMode: "difference",
        duration: 0.6,
        ease: "power4.out",
      });
    });

    heroText.addEventListener("mouseleave", () => {
      gsap.to(follower, {
        width: 120,
        height: 70,
        mixBlendMode: "normal",
        duration: 0.6,
        ease: "power4.out",
      });
    });
  }

  window.addEventListener("click", (e) => {
    if (!clickEffectReady) return;

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
    const randomImage =
      clickImages[Math.floor(Math.random() * clickImages.length)];

    img.src = randomImage;
    img.className = "click-pop-image";
    layer.appendChild(img);

    const randomScale = gsap.utils.random(0.95, 1.15);
    const randomY = gsap.utils.random(-260, -360);
    const randomX = gsap.utils.random(-40, 40);
    const randomRotation = gsap.utils.random(-8, 8);

    gsap.set(img, {
      x: e.clientX,
      y: e.clientY,
      scale: 0.75,
      opacity: 0,
      rotation: randomRotation,
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
        scale: randomScale,
        opacity: 1,
        duration: 0.55,
        ease: "power3.out",
      })
      .to(
        img,
        {
          x: e.clientX + randomX,
          y: e.clientY + randomY,
          rotation: randomRotation * 1.8,
          duration: 2.2,
          ease: "power2.out",
        },
        0
      )
      .to(
        img,
        {
          opacity: 0,
          scale: randomScale * 0.96,
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