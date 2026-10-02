"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Heart, Sparkles } from "lucide-react";

const slides = [
  {
    eyebrow: "Welcome to",
    title: "POLISHED AND PAID",
    subtitle: "Your one-stop shop for beauty, wellness, fashion, lifestyle and so much more.",
    slogan: <>Look Good<br />Feel Good<br />Live Better</>,
    image: "https://images.unsplash.com/photo-1632765854612-9b02b6ec2b15?auto=format&fit=crop&w=1800&q=90",
    position: "center 18%",
    accent: "#d98d98",
  },
  {
    eyebrow: "Beauty begins here",
    title: "FEEL BEAUTIFUL",
    subtitle: "Discover beauty, self-care and everyday essentials carefully selected for you.",
    slogan: <>Love Your<br />Look<br />Every Day</>,
    image: "https://images.unsplash.com/photo-1736462832716-c97363de240e?auto=format&fit=crop&w=1800&q=90",
    position: "center 18%",
    accent: "#c77c89",
  },
  {
    eyebrow: "Your lifestyle destination",
    title: "LIVE BEAUTIFULLY",
    subtitle: "Beauty, fragrance, wellness, fashion and lifestyle essentials all in one place.",
    slogan: <>Your Style<br />Your Beauty<br />Your Way</>,
    image: "https://images.unsplash.com/photo-1767249624242-9739782c5156?auto=format&fit=crop&w=1800&q=90",
    position: "center 23%",
    accent: "#b86676",
  },
];

export default function Hero() {
  const [activeSlide, setActiveSlide] = useState(0);
  const slide = slides[activeSlide];

  function nextSlide() {
    setActiveSlide((value) => (value + 1) % slides.length);
  }
  function previousSlide() {
    setActiveSlide((value) => (value - 1 + slides.length) % slides.length);
  }

  useEffect(() => {
    const timer = window.setInterval(nextSlide, 7000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="pp-hero">
      <div className="pp-hero-inner">
        <div className="pp-copy">
          <div className="pp-copy-content">
            <div className="pp-eyebrow">{slide.eyebrow}</div>
            <h1>{slide.title}</h1>
            <p>{slide.subtitle}</p>
            <a href="/shop" className="pp-cta" style={{ background: slide.accent, borderColor: slide.accent }}>
              <span>Shop Now</span><ArrowRight size={17} strokeWidth={1.7} />
            </a>
          </div>
          <button type="button" className="pp-nav pp-nav-left" onClick={previousSlide} aria-label="Previous slide">
            <ArrowLeft size={19} strokeWidth={1.35} />
          </button>
        </div>

        <div className="pp-visual">
          <div className="pp-color-wash" />
          <div className="pp-model-wrap">
            <img key={slide.image} src={slide.image} alt="Polish & Pay beauty model" className="pp-model" style={{ objectPosition: slide.position }} />
          </div>
          <div className="pp-fade-left" />
          <div className="pp-fade-top" />
          <div className="pp-slogan">
            <Sparkles size={15} strokeWidth={1.2} className="pp-slogan-sparkle" />
            <div>{slide.slogan}</div>
            <Heart size={18} strokeWidth={1.2} className="pp-slogan-heart" />
          </div>
          <button type="button" className="pp-nav pp-nav-right" onClick={nextSlide} aria-label="Next slide">
            <ArrowRight size={19} strokeWidth={1.35} />
          </button>
        </div>
      </div>

      <div className="pp-indicators">
        {slides.map((_, index) => (
          <button key={index} type="button" onClick={() => setActiveSlide(index)} className={`pp-indicator ${activeSlide === index ? "active" : ""}`} aria-label={`Go to slide ${index + 1}`} />
        ))}
      </div>

      <div className="pp-hero-bottom">
        <span>Beauty</span><i /> <span>Wellness</span><i /> <span>Self-Care</span><i /> <span>Lifestyle</span>
      </div>

      <style jsx>{`
        .pp-hero{position:relative;overflow:hidden;background:#f9e9e5;border-bottom:1px solid rgba(33,27,28,.08)}
        .pp-hero-inner{display:grid;grid-template-columns:47% 53%;min-height:475px;height:min(475px,calc(100vh - 150px));max-height:560px}
        .pp-copy{position:relative;z-index:5;display:flex;align-items:center;padding:48px 38px 48px 7%;background:radial-gradient(circle at 70% 45%,#fff 0%,#fff7f4 38%,#f8e5df 100%)}
        .pp-copy-content{max-width:650px}.pp-eyebrow{margin-bottom:2px;color:#1f191a;font:400 clamp(48px,4.8vw,76px)/.72 "Sacramento",cursive}.pp-copy h1{margin:0;color:#181314;font:500 clamp(44px,4.35vw,72px)/.94 "Playfair Display",serif;letter-spacing:-.065em;white-space:nowrap}.pp-copy p{max-width:560px;margin:20px 0 28px;color:#55484a;font:400 14px/1.65 "DM Sans",sans-serif}.pp-cta{display:inline-flex;align-items:center;justify-content:center;gap:13px;min-width:165px;height:55px;padding:0 24px;color:#fff;text-decoration:none;font:700 10px/1 "DM Sans",sans-serif;letter-spacing:.14em;text-transform:uppercase;box-shadow:0 12px 30px rgba(151,75,89,.16);transition:transform .2s ease,filter .2s ease}.pp-cta:hover{transform:translateY(-2px);filter:brightness(.95)}
        .pp-visual{position:relative;overflow:hidden;background:#d9b8aa}.pp-color-wash{position:absolute;inset:0;background:linear-gradient(135deg,#d5b0a8,#e7c6ba 50%,#b9a4a0);z-index:0}.pp-model-wrap{position:absolute;inset:0;z-index:1}.pp-model{width:100%;height:100%;display:block;object-fit:cover;filter:saturate(1.04) contrast(1.02);animation:heroIn .7s ease both}@keyframes heroIn{from{opacity:.55;transform:scale(1.04)}to{opacity:1;transform:scale(1)}}.pp-fade-left{position:absolute;inset:0 auto 0 0;width:29%;z-index:3;background:linear-gradient(90deg,#f8e8e4,rgba(248,232,228,.7),transparent)}.pp-fade-top{position:absolute;inset:0 0 auto;height:22%;z-index:3;background:linear-gradient(180deg,rgba(25,17,18,.14),transparent)}
        .pp-slogan{position:absolute;top:45px;right:7%;z-index:6;color:#fff;text-align:center;font:400 clamp(38px,3.5vw,57px)/.78 "Sacramento",cursive;text-shadow:0 2px 12px rgba(35,20,20,.28)}.pp-slogan-sparkle{display:block;margin:0 auto 7px}.pp-slogan-heart{display:block;margin:15px auto 0}.pp-nav{position:absolute;top:50%;z-index:10;width:40px;height:40px;display:flex;align-items:center;justify-content:center;padding:0;border:0;background:rgba(255,255,255,.3);color:#211b1c;transform:translateY(-50%);transition:background .2s ease,transform .2s ease}.pp-nav:hover{background:rgba(255,255,255,.72)}.pp-nav-left{left:24px}.pp-nav-right{right:24px;color:#fff;background:rgba(33,27,28,.18)}.pp-nav-right:hover{color:#211b1c}.pp-indicators{position:absolute;bottom:47px;left:50%;z-index:10;display:flex;gap:8px;transform:translateX(-50%)}.pp-indicator{width:21px;height:3px;border:0;background:rgba(33,27,28,.28);padding:0}.pp-indicator.active{width:42px;background:#211b1c}.pp-hero-bottom{position:absolute;left:0;right:0;bottom:0;z-index:8;height:34px;display:flex;align-items:center;justify-content:center;gap:17px;background:rgba(255,250,248,.88);backdrop-filter:blur(8px);color:#6e5d60;font:700 8px/1 "DM Sans",sans-serif;letter-spacing:.18em;text-transform:uppercase}.pp-hero-bottom i{width:3px;height:3px;border-radius:50%;background:#d98d98}
        @media(max-width:1000px){.pp-hero-inner{grid-template-columns:48% 52%;min-height:430px}.pp-copy{padding-left:5%}.pp-copy h1{font-size:50px}.pp-eyebrow{font-size:56px}.pp-copy p{font-size:12px}.pp-slogan{font-size:40px}}
        @media(max-width:720px){.pp-hero-inner{display:flex;height:auto;min-height:0;flex-direction:column}.pp-copy{min-height:300px;padding:45px 22px 38px;text-align:center}.pp-copy-content{margin:auto}.pp-eyebrow{font-size:48px}.pp-copy h1{font-size:39px;white-space:normal}.pp-copy p{margin:15px auto 23px;max-width:480px}.pp-cta{margin:auto}.pp-visual{min-height:400px}.pp-model{object-position:center 18%!important}.pp-fade-left{top:0;bottom:auto;width:100%;height:22%;background:linear-gradient(180deg,#f8e8e4,transparent)}.pp-slogan{top:28px;right:50%;transform:translateX(50%);font-size:40px}.pp-nav-left{left:12px}.pp-nav-right{right:12px}}
        @media(max-width:430px){.pp-copy{min-height:285px}.pp-eyebrow{font-size:43px}.pp-copy h1{font-size:34px}.pp-visual{min-height:360px}.pp-slogan{font-size:35px}.pp-hero-bottom{gap:9px;font-size:6px}}
      `}</style>
    </section>
  );
}
