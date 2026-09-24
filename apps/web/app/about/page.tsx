import Link from "next/link";
import styles from "./about.module.css";

const helpArticles = [
  {
    category: "GETTING STARTED",
    title: "What is UsBooth?",
    description:
      "Understand what UsBooth is, how the virtual photobooth works, and what you can do with it.",
    slug: "what-is-usbooth",
    action: "LEARN MORE →",
    href: "/about/help/what-is-usbooth",
  },
  {
    category: "GETTING STARTED",
    title: "Create a booth",
    description:
      "Create your own room and invite someone to join your virtual photobooth.",
    slug: "creating-a-booth",
    action: "CREATE A BOOTH →",
    href: "/account?create=true",
  },
  {
    category: "GETTING STARTED",
    title: "Join a booth",
    description:
      "Have a room code or invitation? Jump directly into the booth joining interface.",
    slug: "joining-a-booth",
    action: "JOIN A BOOTH →",
    href: "/join",
  },
  {
    category: "USING USBOOTH",
    title: "How do the cameras work?",
    description:
      "Learn how the two-camera experience works and what happens when another person joins.",
    slug: "cameras",
    action: "READ GUIDE →",
    href: "/about/help/cameras",
  },
  {
    category: "USING USBOOTH",
    title: "How do I take a photo?",
    description:
      "Learn how the shutter, countdown, preview and shared capture work.",
    slug: "taking-photos",
    action: "READ GUIDE →",
    href: "/about/help/taking-photos",
  },
  {
    category: "USING USBOOTH",
    title: "Templates & customization",
    description:
      "Explore templates, layouts, filters, stickers and other ways to customize your memories.",
    slug: "templates",
    action: "VIEW TEMPLATES →",
    href: "/templates",
  },
  {
    category: "MEMORIES",
    title: "Where are my memories?",
    description:
      "Open your Memories and revisit the photos you've created through UsBooth.",
    slug: "memories",
    action: "OPEN MEMORIES →",
    href: "/memories",
  },
  {
    category: "ACCOUNT & PRIVACY",
    title: "Account & privacy",
    description:
      "Learn what your account is used for and how your memories and booth information are handled.",
    slug: "account-privacy",
    action: "READ GUIDE →",
    href: "/about/help/account-privacy",
  },
  {
    category: "TROUBLESHOOTING",
    title: "My camera isn't working",
    description:
      "Things to check if your camera is blocked, unavailable or showing a black screen.",
    slug: "camera-troubleshooting",
    action: "FIX CAMERA →",
    href: "/about/help/camera-troubleshooting",
  },
  {
    category: "TROUBLESHOOTING",
    title: "I can't join a booth",
    description:
      "A practical checklist for room codes, connection problems and browser issues.",
    slug: "joining-troubleshooting",
    action: "FIX JOINING →",
    href: "/about/help/joining-troubleshooting",
  },
];

const ratings = [
  {
    value: 1,
    label: "Not great",
  },
  {
    value: 2,
    label: "Could be better",
  },
  {
    value: 3,
    label: "It's okay",
  },
  {
    value: 4,
    label: "Pretty good",
  },
  {
    value: 5,
    label: "Love it",
  },
];

export default function AboutPage() {
  return (
    <main className={styles.page}>
      {/* HERO */}

      <section className={styles.hero}>
        <div className={styles.eyebrow}>
          ✦ &nbsp; HELP & ABOUT &nbsp; ✦
        </div>

        <h1>
          Made for the moments
          <br />
          <em>worth keeping.</em>
        </h1>

        <p>
          UsBooth is a virtual photobooth built around a simple idea:
          people should be able to make a picture together even when
          they are not in the same place.
        </p>
      </section>

      {/* QUICK ACTIONS */}

      <section className={styles.quickHelp}>
        <div className={styles.sectionHeading}>
          <span>QUICK HELP</span>

          <h2>
            Need something
            <br />
            <em>right now?</em>
          </h2>

          <p>
            Skip the reading and go directly to the part of UsBooth
            you need.
          </p>
        </div>

        <div className={styles.quickGrid}>
          <Link
            href="/join"
            className={styles.quickCard}
          >
            <span>01</span>

            <div>
              <h3>Join a booth</h3>
              <p>
                Enter a room code and join someone else's booth.
              </p>
            </div>

            <strong>→</strong>
          </Link>

          <Link
            href="/account?create=true"
            className={styles.quickCard}
          >
            <span>02</span>

            <div>
              <h3>Create a booth</h3>
              <p>
                Start a room and invite someone to create memories.
              </p>
            </div>

            <strong>→</strong>
          </Link>

          <Link
            href="/templates"
            className={styles.quickCard}
          >
            <span>03</span>

            <div>
              <h3>Explore templates</h3>
              <p>
                Browse the styles, frames and creative possibilities.
              </p>
            </div>

            <strong>→</strong>
          </Link>

          <Link
            href="/memories"
            className={styles.quickCard}
          >
            <span>04</span>

            <div>
              <h3>Open memories</h3>
              <p>
                Revisit the moments you've already created.
              </p>
            </div>

            <strong>→</strong>
          </Link>
        </div>
      </section>

      {/* ABOUT */}

      <section className={styles.story}>
        <div className={styles.storyHeading}>
          <span>ABOUT US</span>

          <h2>
            Two phones.
            <br />
            <em>One moment.</em>
          </h2>
        </div>

        <div className={styles.storyCopy}>
          <p>
            UsBooth is a web-based photobooth for people who want to
            create something together. The experience is designed
            around shared moments rather than complicated editing
            tools.
          </p>

          <p>
            The idea started with a simple problem: sometimes the
            person you want in the photograph isn't standing next to
            you. UsBooth is our attempt to make that distance feel a
            little smaller.
          </p>

          <p>
            We are still building and improving the product. That
            means some features are evolving, and some ideas we have
            for the future are not available yet.
          </p>
        </div>
      </section>

      {/* VALUES */}

      <section className={styles.values}>
        <div className={styles.sectionHeading}>
          <span>WHAT MATTERS TO US</span>

          <h2>
            Simple things,
            <br />
            <em>done properly.</em>
          </h2>
        </div>

        <div className={styles.valueGrid}>
          <article>
            <span className={styles.number}>01</span>

            <h3>Connection</h3>

            <p>
              The product should make it easier to create something
              with another person, not make the experience more
              complicated.
            </p>
          </article>

          <article>
            <span className={styles.number}>02</span>

            <h3>Privacy</h3>

            <p>
              Your memories should feel personal. We aim to keep the
              experience respectful of the photos and information
              people trust us with.
            </p>
          </article>

          <article>
            <span className={styles.number}>03</span>

            <h3>Simplicity</h3>

            <p>
              Open a booth, connect your cameras, take the picture and
              keep the memory. That is the heart of UsBooth.
            </p>
          </article>
        </div>
      </section>

      {/* HELP */}

      <section className={styles.help}>
        <div className={styles.sectionHeading}>
          <span>HELP & SUPPORT</span>

          <h2>
            Need a little
            <br />
            <em>help?</em>
          </h2>

          <p>
            Find an answer below. When there's somewhere useful to
            go, we'll take you there directly.
          </p>
        </div>

        <div className={styles.helpGrid}>
          {helpArticles.map((article) => (
            <Link
              key={article.slug}
              href={article.href}
              className={styles.helpCard}
            >
              <span>{article.category}</span>

              <h3>{article.title}</h3>

              <p>{article.description}</p>

              <strong>
                {article.action}
              </strong>
            </Link>
          ))}
        </div>
      </section>

      {/* RATING */}

      <section className={styles.rating}>
        <div>
          <span>YOUR FEEDBACK</span>

          <h2>
            How are we
            <br />
            <em>doing?</em>
          </h2>

          <p>
            We would rather hear what you actually think than show
            you made-up numbers. Pick a rating and it will open an
            email to the UsBooth team with your rating.
          </p>
        </div>

        <div className={styles.ratingOptions}>
          {ratings.map((rating) => (
            <a
              key={rating.value}
              href={`mailto:usboothphotographs@gmail.com?subject=UsBooth%20Website%20Rating%3A%20${rating.value}%2F5&body=I%20would%20rate%20UsBooth%20${rating.value}%2F5.%0A%0AWhy%3A%0A`}
              className={styles.ratingButton}
              title={rating.label}
            >
              <span>★</span>
              <strong>{rating.value}</strong>
              <small>{rating.label}</small>
            </a>
          ))}
        </div>

        <div className={styles.ratingNote}>
          Want to tell us more?{" "}
          <a href="mailto:usboothphotographs@gmail.com?subject=UsBooth%20Feedback">
            Send detailed feedback →
          </a>
        </div>
      </section>

      {/* CONTACT */}

      <section className={styles.contact}>
        <span>SAY HELLO</span>

        <h2>Still have a question?</h2>

        <p>
          Can't find what you're looking for? We're happy to hear
          from you.
        </p>

        <Link href="/contact">
          Contact Us →
        </Link>
      </section>

      <div className={styles.back}>
        <Link href="/">
          ← Back to UsBooth
        </Link>
      </div>
    </main>
  );
}
