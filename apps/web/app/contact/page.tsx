import Link from "next/link";
import styles from "./contact.module.css";

const GMAIL_GENERAL =
  "https://mail.google.com/mail/?view=cm&fs=1&to=usboothphotographs@gmail.com&su=UsBooth%20Question";

const GMAIL_SUPPORT =
  "https://mail.google.com/mail/?view=cm&fs=1&to=usboothphotographs@gmail.com&su=UsBooth%20Technical%20Support";

export default function ContactPage() {
  return (
    <main className={styles.page}>
      <header className={styles.nav}>
        <Link
          href="/"
          className={styles.logo}
        >
          USBOOTH<span>♥</span>
        </Link>

        <nav>
          <Link href="/">Home</Link>
          <Link href="/memories">Memories</Link>
          <Link href="/templates">Templates</Link>
          <Link href="/account">My Booths</Link>
        </nav>
      </header>

      <section className={styles.hero}>
        <p>✦ &nbsp; SAY HELLO &nbsp; ✦</p>

        <h1>
          We'd love to
          <br />
          <em>hear from you.</em>
        </h1>

        <p className={styles.lead}>
          Questions, ideas, feedback, or a story
          about a moment you made with UsBooth —
          send it our way.
        </p>
      </section>

      <section className={styles.panel}>
        <div>
          <span>GENERAL</span>

          <h2>Have a question?</h2>

          <p>
            For product questions, feedback,
            ideas, or anything you would like
            to share with us.
          </p>

          <a
            href={GMAIL_GENERAL}
            target="_blank"
            rel="noopener noreferrer"
          >
            usboothphotographs@gmail.com ↗
          </a>
        </div>

        <div>
          <span>TECHNICAL</span>

          <h2>Something isn't working?</h2>

          <p>
            Tell us what happened, what device
            you're using, and what you expected
            to happen. We'll get back to you as
            soon as we can.
          </p>

          <a
            href={GMAIL_SUPPORT}
            target="_blank"
            rel="noopener noreferrer"
          >
            usboothphotographs@gmail.com ↗
          </a>
        </div>
      </section>

      <div className={styles.back}>
        <Link href="/">
          ← Back to UsBooth
        </Link>
      </div>

      <footer>
        <span>
          USBOOTH<span>♥</span>
        </span>

        <small>
          Two phones. One moment.
        </small>
      </footer>
    </main>
  );
}
