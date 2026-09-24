"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type User = {
  id: string;
  email: string;
  displayName: string;
  username?: string | null;
};

const flow = [
  { number: "01", title: "Create a booth", text: "Choose Solo or set up a shared room for the people joining you.", icon: "✦" },
  { number: "02", title: "Connect", text: "Open the booth on your devices and allow camera access.", icon: "◉" },
  { number: "03", title: "Capture", text: "Pose, click the shutter, switch it up, and take the next shot.", icon: "◎" },
  { number: "04", title: "Customize", text: "Choose a design and make the finished memory feel like yours.", icon: "✎" },
  { number: "05", title: "Keep it", text: "Save it to Memories or download the final photo.", icon: "♡" },
];

export default function Home() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include", cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return;
        const data = await response.json();
        if (data?.user) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  const createHref = user ? "/account?create=true" : "/register";
  const joinHref = user ? "/join" : "/login?next=/join";

  return (
    <main className="landing landing-v2">
      <section className="home-hero">
        <div className="home-hero-glow glow-one" aria-hidden="true" />
        <div className="home-hero-glow glow-two" aria-hidden="true" />

        <div className="home-hero-copy">
          <p className="home-kicker">✦ YOUR VIRTUAL PHOTO BOOTH ✦</p>
          <h1>
            Make a little
            <br />
            <em>moment of it.</em>
          </h1>
          <p className="home-lede">
            UsBooth turns your phone cameras into a shared photo booth —
            whether you're taking pictures by yourself or making memories together.
          </p>

          <div className="home-actions">
            <Link href={createHref} className="home-cta home-cta-primary">
              CREATE A BOOTH <span>↗</span>
            </Link>
            <Link href={joinHref} className="home-cta home-cta-secondary">
              JOIN A ROOM
            </Link>
          </div>

          <div className="home-trust-row">
            <span>♡ Private rooms</span>
            <span>✦ Multiple shots</span>
            <span>◌ Save your memories</span>
          </div>
        </div>

        <div className="home-hero-art" aria-label="UsBooth photo booth preview">
          <div className="home-orbit orbit-a" />
          <div className="home-orbit orbit-b" />
          <div className="home-spark spark-a">✦</div>
          <div className="home-spark spark-b">✧</div>

          <div className="home-photo-card home-photo-back">
            <div className="home-mini-photo blue" />
            <span>ONE MOMENT</span>
          </div>

          <div className="home-photo-card home-photo-main">
            <div className="home-photo-scene">
              <div className="home-scene-sun" />
              <div className="home-scene-person person-a" />
              <div className="home-scene-person person-b" />
            </div>
            <div className="home-handwriting">you + me + today ♡</div>
          </div>

          <div className="home-camera-pill">
            <span>●</span>
            READY TO CAPTURE
          </div>
        </div>
      </section>

      <section className="home-intro-section">
        <div className="home-section-heading">
          <p className="home-kicker">✦ HOW IT WORKS ✦</p>
          <h2>
            From camera
            <br />
            <em>to keepsake.</em>
          </h2>
          <p>
            You don't need a manual. UsBooth guides you through the whole
            thing, right where you need it.
          </p>
        </div>

        <div className="home-flow-grid">
          {flow.map((item) => (
            <article className="home-flow-card" key={item.number}>
              <div className="home-flow-icon">{item.icon}</div>
              <span>{item.number}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-modes-section">
        <div className="home-section-heading center">
          <p className="home-kicker">✦ PICK YOUR MOMENT ✦</p>
          <h2>
            However you want
            <br />
            <em>to capture it.</em>
          </h2>
        </div>

        <div className="home-mode-grid">
          <article className="home-mode-card solo">
            <div className="home-mode-icon">◉</div>
            <p>SOLO MODE</p>
            <h3>Just you.</h3>
            <span>
              Take multiple shots yourself and fill your chosen photo
              layout one frame at a time.
            </span>
            <Link href={createHref}>CREATE SOLO BOOTH ↗</Link>
          </article>

          <article className="home-mode-card together">
            <div className="home-mode-icon">♡</div>
            <p>TOGETHER MODE</p>
            <h3>You + your people.</h3>
            <span>
              Connect cameras, pose together, and turn each shutter click
              into another shared frame.
            </span>
            <Link href={createHref}>CREATE SHARED BOOTH ↗</Link>
          </article>
        </div>
      </section>

      <section className="home-explainer">
        <div className="home-explainer-copy">
          <p className="home-kicker">✦ WHEN YOU'RE INSIDE A BOOTH ✦</p>
          <h2>
            No guessing.
            <br />
            <em>Just capture.</em>
          </h2>
          <p>
            Start your camera, choose your design, and use the shutter when
            you're ready. After each shot, change your expression or pose and
            take the next one. When you're done, UsBooth brings everything
            together into your final memory.
          </p>
          <div className="home-tip-list">
            <div><b>01</b><span>Allow camera access when prompted.</span></div>
            <div><b>02</b><span>Keep your device steady while the countdown runs.</span></div>
            <div><b>03</b><span>Use the next shot to change the mood.</span></div>
          </div>
        </div>

        <div className="home-explainer-card">
          <div className="home-card-topline"><span>USBOOTH</span><span>CAPTURE 03</span></div>
          <div className="home-card-frame">
            <div className="home-card-placeholder">YOUR<br /><em>NEXT<br />FRAME</em></div>
          </div>
          <div className="home-card-bottomline">
            <span>CHANGE IT UP ♡</span>
            <strong>03 / 04</strong>
          </div>
        </div>
      </section>

      <section className="home-design-section">
        <div className="home-section-heading center">
          <p className="home-kicker">✦ MAKE IT YOURS ✦</p>
          <h2>
            Your photo,
            <br />
            <em>your little details.</em>
          </h2>
          <p>
            Pick a template, then make the final memory personal. New template
            designs are coming soon.
          </p>
        </div>

        <div className="home-design-grid">
          <div className="home-design-card"><span>01</span><strong>Choose a design</strong><small>Pick the look that fits the moment.</small></div>
          <div className="home-design-card"><span>02</span><strong>Add your details</strong><small>Captions, names and other personal touches.</small></div>
          <div className="home-design-card"><span>03</span><strong>Save the memory</strong><small>Keep it in Memories or take it with you.</small></div>
        </div>

        <Link href="/templates" className="home-outline-cta">
          EXPLORE TEMPLATES ↗
        </Link>
      </section>

      <section className="home-final-cta">
        <p className="home-kicker">✦ READY WHEN YOU ARE ✦</p>
        <h2>
          Let's make
          <br />
          <em>something worth keeping.</em>
        </h2>
        <p>It starts with one click.</p>
        <Link href={createHref} className="home-cta home-cta-primary">
          CREATE YOUR FIRST BOOTH <span>↗</span>
        </Link>
      </section>

      <footer className="home-footer">
        <div>
          <Link href="/" className="home-footer-logo">USBOOTH<span>✦</span></Link>
          <p>Your little virtual photo booth.</p>
        </div>
        <div className="home-footer-links">
          <Link href="/account">Booths</Link>
          <Link href="/memories">Memories</Link>
          <Link href="/templates">Templates</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/pricing">Pricing</Link>
        </div>
        <small>© {new Date().getFullYear()} UsBooth · Made for little moments.</small>
      </footer>
    </main>
  );
}
