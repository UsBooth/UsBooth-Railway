import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "./help.module.css";

type ArticleAction = {
  label: string;
  href: string;
};

type Article = {
  category: string;
  title: string;
  intro: string;
  action?: ArticleAction;
  sections: {
    heading: string;
    paragraphs: string[];
  }[];
};

const articles: Record<string, Article> = {
  "what-is-usbooth": {
    category: "GETTING STARTED",
    title: "What is UsBooth?",
    intro:
      "UsBooth is a virtual photobooth that lets people create a shared photograph even when they are not in the same place.",
    action: {
      label: "EXPLORE USBOOTH →",
      href: "/",
    },
    sections: [
      {
        heading: "The idea",
        paragraphs: [
          "A normal photobooth puts everyone in front of the same camera. UsBooth adapts that idea for people using separate devices.",
          "You create or join a booth, connect your camera and wait for the other participant. Once both sides are connected, you can capture the moment together.",
        ],
      },
      {
        heading: "What you can do",
        paragraphs: [
          "Create private booths, invite another person, capture photographs together and customize the resulting memory using available templates and styles.",
          "UsBooth is still being developed, so some ideas and features may change over time.",
        ],
      },
    ],
  },

  "creating-a-booth": {
    category: "GETTING STARTED",
    title: "How do I create a booth?",
    intro:
      "Creating a booth gives you a room that another person can join.",
    action: {
      label: "CREATE A BOOTH →",
      href: "/account?create=true",
    },
    sections: [
      {
        heading: "Create your room",
        paragraphs: [
          "Open My Booths and choose Create Booth. Give the booth a name and select the available settings you want to use.",
          "After creation, UsBooth gives the booth its own room information that can be shared with the person you want to invite.",
        ],
      },
      {
        heading: "Invite someone",
        paragraphs: [
          "Share the booth link or room code with the other participant. They can use Join a Room to enter.",
        ],
      },
    ],
  },

  "joining-a-booth": {
    category: "GETTING STARTED",
    title: "How do I join a booth?",
    intro:
      "You can join a booth using the room information shared with you.",
    action: {
      label: "JOIN A BOOTH →",
      href: "/join",
    },
    sections: [
      {
        heading: "Using a room code",
        paragraphs: [
          "Open Join a Room and enter the room code you were given.",
          "Once the room is found, follow the instructions to enter the booth.",
        ],
      },
      {
        heading: "After joining",
        paragraphs: [
          "Allow camera access when your browser asks. Once both participants are connected, the booth can establish the shared camera session.",
        ],
      },
    ],
  },

  cameras: {
    category: "USING USBOOTH",
    title: "How do the cameras work?",
    intro:
      "UsBooth uses your camera and the other participant's camera to create the shared booth experience.",
    action: {
      label: "OPEN MY BOOTHS →",
      href: "/account",
    },
    sections: [
      {
        heading: "Camera permissions",
        paragraphs: [
          "Your browser must be allowed to access your camera. If you previously blocked access, open your browser's site permissions and allow camera access for UsBooth.",
        ],
      },
      {
        heading: "Two-camera experience",
        paragraphs: [
          "Your camera appears on your side of the booth while the other participant's camera appears on the opposite side.",
          "The connection is established through the booth session and real-time signaling system.",
        ],
      },
    ],
  },

  "taking-photos": {
    category: "USING USBOOTH",
    title: "How do I take a photo?",
    intro:
      "Once both cameras are ready, the shutter controls the shared capture.",
    action: {
      label: "OPEN MY BOOTHS →",
      href: "/account",
    },
    sections: [
      {
        heading: "Before capturing",
        paragraphs: [
          "Make sure both cameras are visible and that both participants are ready.",
        ],
      },
      {
        heading: "Capture",
        paragraphs: [
          "Press the shutter to start the capture sequence. Both sides are collected for the shared memory.",
          "After the capture, you can continue using the booth and take another photograph.",
        ],
      },
    ],
  },

  templates: {
    category: "USING USBOOTH",
    title: "Templates & customization",
    intro:
      "Templates change how your captured photos are presented.",
    action: {
      label: "BROWSE TEMPLATES →",
      href: "/templates",
    },
    sections: [
      {
        heading: "Templates",
        paragraphs: [
          "Choose a template from the Templates section to change the visual treatment of your memories.",
          "Depending on the template, the composition, frame, background and filter can change.",
        ],
      },
      {
        heading: "Customization",
        paragraphs: [
          "After capturing a photo, available customization controls let you adjust the look before saving the memory.",
        ],
      },
    ],
  },

  memories: {
    category: "MEMORIES",
    title: "Where are my memories?",
    intro:
      "Your saved captures appear in Memories so you can revisit them later.",
    action: {
      label: "OPEN MEMORIES →",
      href: "/memories",
    },
    sections: [
      {
        heading: "Saving a memory",
        paragraphs: [
          "After completing a capture and customization, save the result as a memory.",
        ],
      },
      {
        heading: "Privacy",
        paragraphs: [
          "Memories should be treated as personal content. Check the privacy option associated with a memory before sharing it.",
        ],
      },
    ],
  },

  "account-privacy": {
    category: "ACCOUNT & PRIVACY",
    title: "Account & privacy",
    intro:
      "Your account allows UsBooth to associate your booths and memories with you.",
    action: {
      label: "OPEN MY ACCOUNT →",
      href: "/account",
    },
    sections: [
      {
        heading: "Your account",
        paragraphs: [
          "Your account is used to keep track of your UsBooth experience, including the booths and memories associated with your account.",
        ],
      },
      {
        heading: "Your information",
        paragraphs: [
          "Only provide information that is necessary for using the service. If you have a privacy question or want to understand how something is handled, contact the UsBooth team.",
        ],
      },
    ],
  },

  "camera-troubleshooting": {
    category: "TROUBLESHOOTING",
    title: "My camera isn't working",
    intro:
      "Most camera problems come from browser permissions or another application using the camera.",
    action: {
      label: "OPEN A BOOTH →",
      href: "/account",
    },
    sections: [
      {
        heading: "Try these first",
        paragraphs: [
          "Check that your camera is physically available and not being used by another application.",
          "Check your browser's site permissions and make sure UsBooth has camera access.",
          "Refresh the booth after changing the permission.",
        ],
      },
      {
        heading: "Still not working?",
        paragraphs: [
          "Try another supported browser or device. If the issue continues, contact UsBooth and tell us your browser, device and what happened.",
        ],
      },
    ],
  },

  "joining-troubleshooting": {
    category: "TROUBLESHOOTING",
    title: "I can't join a booth",
    intro:
      "If a booth cannot be joined, check the room information and your connection first.",
    action: {
      label: "JOIN A BOOTH →",
      href: "/join",
    },
    sections: [
      {
        heading: "Check the room",
        paragraphs: [
          "Make sure the booth link or room code is correct and that the room still exists.",
        ],
      },
      {
        heading: "Check your browser",
        paragraphs: [
          "Make sure you are signed in when the booth requires an account and that your browser is not blocking required site functionality.",
        ],
      },
      {
        heading: "If it still fails",
        paragraphs: [
          "Take note of the error message and contact UsBooth support with the device, browser and approximate time the problem occurred.",
        ],
      },
    ],
  },
};

export default async function HelpArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = articles[slug];

  if (!article) {
    notFound();
  }

  return (
    <main className={styles.page}>
      <div className={styles.top}>
        <Link href="/about" className={styles.back}>
          ← Help & About
        </Link>

        <span className={styles.logo}>
          USBOOTH<span>♥</span>
        </span>
      </div>

      <article className={styles.article}>
        <div className={styles.category}>
          {article.category}
        </div>

        <h1>{article.title}</h1>

        <p className={styles.intro}>
          {article.intro}
        </p>

        {article.action && (
          <div className={styles.primaryAction}>
            <Link href={article.action.href}>
              {article.action.label}
            </Link>
          </div>
        )}

        <div className={styles.content}>
          {article.sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>

              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>
          ))}
        </div>

        <div className={styles.support}>
          <h3>Still need help?</h3>

          <p>
            If your question isn't answered here, we'd be happy to
            hear from you.
          </p>

          <Link href="/contact">
            Contact Us →
          </Link>
        </div>
      </article>
    </main>
  );
}
