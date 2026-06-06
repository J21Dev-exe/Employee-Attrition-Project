/* =========================================================
   INITIAL SETUP
   ========================================================= */
const scroller = document.getElementById("scroller");
const titleWrap = document.getElementById("titleWrap");
const title = document.getElementById("title");
const bio = document.getElementById("bio");
const hint = document.querySelector(".hint");
const nav = document.getElementById("nav");
const nextBtn = document.getElementById("nextBtn");
const navLinks = [...document.querySelectorAll(".nav-link")];
const sections = [...document.querySelectorAll(".snap-section")];

const FULL_TITLE = "WORKFORCE\nINTELLIGENCE";

let stage = 0;          // 0 = hero, 1 = bio, 2 = compact + sections
let busy = false;
let typingToken = 0;

/* =========================================================
   HELPERS
   ========================================================= */
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function renderTitle(text) {
  title.innerHTML = text.replace(/\n/g, "<br>");
}

async function typeTitle(text = FULL_TITLE, speed = 55) {
  const token = ++typingToken;
  title.innerHTML = "";

  for (let i = 1; i <= text.length; i++) {
    if (token !== typingToken) return;
    renderTitle(text.slice(0, i));
    await wait(speed);
  }
}

async function eraseTitle(text = FULL_TITLE, speed = 28) {
  const token = ++typingToken;

  for (let i = text.length; i >= 0; i--) {
    if (token !== typingToken) return;
    renderTitle(text.slice(0, i));
    await wait(speed);
  }

  title.innerHTML = "";
}

function showBio() {
  bio.classList.add("show");
  document.body.classList.add("bio-active");
}

function hideBio() {
  bio.classList.remove("show");
  document.body.classList.remove("bio-active");
}

function setActiveNav(id) {
  navLinks.forEach((link) => {
    const target = link.getAttribute("href").replace("#", "");
    link.classList.toggle("active", target === id);
  });
}

/* =========================================================
   STAGE CONTROL
   ========================================================= */
async function setStage(nextStage) {
  if (busy || nextStage < 0 || nextStage > 2 || nextStage === stage) return;

  busy = true;
  stage = nextStage;

  // STAGE 0: hero typing centered
  if (stage === 0) {
    document.body.classList.remove("compact");
    titleWrap.classList.remove("compact");
    scroller.style.overflowY = "hidden";

    hideBio();
    hint.style.opacity = "1";
    nav.classList.remove("show");
    nextBtn.classList.remove("show");

    scroller.scrollTo({ top: 0, behavior: "auto" });
    await typeTitle();
  }

  // STAGE 1: bio arrives and stays on hero
  // STAGE 1: title + bio
  if (stage === 1) {

    document.body.classList.remove("compact");
    titleWrap.classList.remove("compact");

    scroller.style.overflowY = "hidden";

    nav.classList.remove("show");
    nextBtn.classList.remove("show");

    renderTitle(FULL_TITLE);

    await wait(300);
    showBio();

  }

  // STAGE 2: reverse typing + compact title + navbar + sections
  if (stage === 2) {

    hideBio();

    hint.style.opacity = "0";

    await eraseTitle();
    await wait(250);

    document.body.classList.add("compact");
    titleWrap.classList.add("compact");

    nav.classList.add("show");
    nextBtn.classList.add("show");

    scroller.style.overflowY = "auto";

    renderTitle(FULL_TITLE);

    // move to the next section smoothly
    requestAnimationFrame(() => {
      scroller.scrollTop = window.innerHeight;
    });
  }

  busy = false;
}

/* =========================================================
   WHEEL / SCROLL LOGIC
   ========================================================= */
window.addEventListener(
  "wheel",
  (e) => {
    // Before compact mode: create the fake staged scroll
    if (stage < 2) {
      e.preventDefault();

      if (e.deltaY > 0) {

        if (stage === 0) {
          setStage(1);
        }
        else if (stage === 1) {
          setStage(2);
        }

      } else {
        if (stage === 1) {
          setStage(0);
        }
        else if (stage === 2) {
          setStage(1);
        }
      }
      return;
    }

    // After compact mode: allow normal section scrolling.
    // If user is at top and scrolls upward, go back to hero mode.
    if (stage === 2 && scroller.scrollTop <= 6 && e.deltaY < 0) {
      e.preventDefault();
      setStage(1);
    }
  },
  { passive: false }
);

/* =========================================================
   NAVIGATION
   ========================================================= */
nav.addEventListener("click", (e) => {

  const link = e.target.closest(".nav-link");
  if (!link) return;

  e.preventDefault();

  const targetId = link.getAttribute("href").replace("#", "");
  const target = document.getElementById(targetId);

  if (!target) return;

  if (stage < 2) {
    setStage(2);

    setTimeout(() => {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }, 800);
  }
  else {
    target.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

});

document.querySelectorAll(".footer-links a").forEach(link => {

  link.addEventListener("click", (e) => {

    e.preventDefault();

    const target = document.querySelector(
      link.getAttribute("href")
    );

    if (target) {
      target.scrollIntoView({
        behavior: "smooth"
      });
    }

  });

});

/* =========================================================
   ACTIVE NAV ON SCROLL
   ========================================================= */
scroller.addEventListener("scroll", () => {
  if (stage < 2) return;

  const probeY = scroller.scrollTop + window.innerHeight * 0.35;

  let current = "hero";
  for (const section of sections) {
    if (probeY >= section.offsetTop) {
      current = section.id;
    }
  }

  setActiveNav(current);
});

/* =========================================================
   TOUCH / SWIPE SUPPORT
   ========================================================= */
let touchStartY = 0;

window.addEventListener("touchstart", (e) => {
  touchStartY = e.changedTouches[0].clientY;
}, { passive: true });

window.addEventListener("touchend", (e) => {
  if (busy) return;

  const endY = e.changedTouches[0].clientY;
  const diff = touchStartY - endY;

  if (stage < 2) {
    if (Math.abs(diff) > 25) {
      setStage(diff > 0 ? stage + 1 : stage - 1);
    }
  } else if (stage === 2 && scroller.scrollTop <= 6 && diff < -25) {
    setStage(1);
  }
}, { passive: true });

/* =========================================================
   KEYBOARD SUPPORT
   ========================================================= */
window.addEventListener("keydown", (e) => {
  if (busy) return;

  if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") {
    if (stage < 2) {
      e.preventDefault();
      setStage(stage + 1);
    }
  }

  if (e.key === "ArrowUp" || e.key === "PageUp") {
    if (stage > 0 && stage < 2) {
      e.preventDefault();
      setStage(stage - 1);
    } else if (stage === 2 && scroller.scrollTop <= 6) {
      e.preventDefault();
      setStage(1);
    }
  }
});

/* =========================================================
   STARTUP
   ========================================================= */
window.addEventListener("load", async () => {

  document.body.classList.remove("compact");

  scroller.style.overflowY = "hidden";

  hideBio();

  renderTitle("");

  await typeTitle();

  stage = 0;

});