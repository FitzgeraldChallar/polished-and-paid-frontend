import Link from "next/link";
import Header from "../../components/storefront/Header";
import Footer from "../../components/storefront/Footer";
import { ArrowRight, Heart, Sparkles, Gem, Star } from "lucide-react";
import styles from "./about.module.css";

export default function AboutPage() {
  return (
    <>
      <Header />

      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroGlow} />
          <div className={styles.heroInner}>
            <div className={styles.heroCopy}>
              <span className={styles.kicker}>THE POLISHED &amp; PAID STORY</span>
              <h1>
                Beauty should feel
                <br />
                like <em>you.</em>
              </h1>
              <p>
                A beautifully curated destination for beauty, fragrance,
                self-care, wellness and lifestyle essentials — selected to
                make everyday rituals feel a little more extraordinary.
              </p>
              <div className={styles.heroRule}>
                <span />
                <i>Polished &amp; Paid</i>
                <span />
              </div>
            </div>

            <div className={styles.heroScript} aria-hidden="true">
              Look good.
              <br />
              Feel good.
              <br />
              Live better.
              <small>♡</small>
            </div>
          </div>
        </section>

        <section className={styles.intro}>
          <div className={styles.introVisual}>
            <div className={styles.imageFrame}>
              <img
                src="https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=1400&q=88"
                alt="Beauty lifestyle"
              />
              <div className={styles.imageSheen} />
            </div>
            <div className={styles.imageBadge}>
              <Gem size={18} strokeWidth={1.35} />
              <strong>THE EDIT</strong>
              <span>EST. 2026</span>
            </div>
          </div>

          <div className={styles.introCopy}>
            <span className={styles.kicker}>THE POLISHED &amp; PAID EDIT</span>
            <h2>
              Little luxuries.
              <br />
              Everyday <em>rituals.</em>
            </h2>
            <p>
              We believe the things you reach for every day deserve to feel
              beautiful. Polished &amp; Paid brings together products that make
              getting ready, winding down and taking care of yourself feel
              considered rather than ordinary.
            </p>
            <p>
              From beauty and fragrance to wellness and lifestyle, our edit is
              designed around discovery — with a distinctly polished point of
              view and a touch of indulgence.
            </p>
            <Link href="/shop" className={styles.darkButton}>
              <span>Shop the Edit</span>
              <ArrowRight size={16} strokeWidth={1.7} />
            </Link>
          </div>
        </section>

        <section className={styles.valuesSection}>
          <div className={styles.sectionIntro}>
            <span className={styles.kicker}>WHY POLISHED &amp; PAID</span>
            <h2>Beautifully considered.</h2>
            <p>
              Everything begins with the feeling we want your shopping
              experience to leave you with.
            </p>
          </div>

          <div className={styles.valuesGrid}>
            <article className={styles.valueCard}>
              <div className={styles.valueIcon}><Sparkles size={22} strokeWidth={1.35} /></div>
              <span className={styles.valueNumber}>01</span>
              <h3>Thoughtfully chosen</h3>
              <p>A considered selection across beauty, wellness and lifestyle.</p>
            </article>
            <article className={styles.valueCard}>
              <div className={styles.valueIcon}><Heart size={22} strokeWidth={1.35} /></div>
              <span className={styles.valueNumber}>02</span>
              <h3>Made for your everyday</h3>
              <p>Beautiful products that belong in real routines, real homes and real lives.</p>
            </article>
            <article className={styles.valueCard}>
              <div className={styles.valueIcon}><Star size={22} strokeWidth={1.35} /></div>
              <span className={styles.valueNumber}>03</span>
              <h3>Always a little lovely</h3>
              <p>Because shopping should feel inspiring, effortless and personal.</p>
            </article>
          </div>
        </section>

        <section className={styles.signature}>
          <div className={styles.signatureLine} />
          <div className={styles.signatureCenter}>
            <span>BEAUTY</span><b>•</b><span>FRAGRANCE</span><b>•</b><span>WELLNESS</span><b>•</b><span>LIFESTYLE</span>
          </div>
          <div className={styles.signatureLine} />
        </section>

        <section className={styles.cta}>
          <div className={styles.ctaOrb} />
          <div className={styles.ctaContent}>
            <span className={styles.kicker}>POLISHED &amp; PAID</span>
            <h2>
              Find your next
              <br />
              <em>favorite.</em>
            </h2>
            <p>
              Discover the pieces that make your routine feel more beautiful,
              personal and unmistakably yours.
            </p>
            <Link href="/shop" className={styles.lightButton}>
              <span>Explore Everything</span>
              <ArrowRight size={16} strokeWidth={1.7} />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

