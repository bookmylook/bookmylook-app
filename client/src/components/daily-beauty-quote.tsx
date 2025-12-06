import { useEffect, useState } from "react";

interface BeautyQuote {
  text: string;
  author: string;
}

const beautyQuotes: BeautyQuote[] = [
  {
    text: "Beauty begins the moment you decide to be yourself.",
    author: "Coco Chanel"
  },
  {
    text: "Invest in your skin. It is going to represent you for a very long time.",
    author: "Linden Tyler"
  },
  {
    text: "You are imperfect, permanently and inevitably flawed. And you are beautiful.",
    author: "Amy Bloom"
  },
  {
    text: "Beauty is about enhancing what you have. Let yourself shine through!",
    author: "Janelle Monae"
  },
  {
    text: "Confidence breeds beauty.",
    author: "Estee Lauder"
  },
  {
    text: "The most beautiful makeup of a woman is passion. But cosmetics are easier to buy.",
    author: "Yves Saint Laurent"
  },
  {
    text: "Beauty is power; a smile is its sword.",
    author: "John Ray"
  },
  {
    text: "True beauty radiates from within and lights up the world around you.",
    author: "Unknown"
  },
  {
    text: "Self-care is not selfish. You cannot serve from an empty vessel.",
    author: "Eleanor Brown"
  },
  {
    text: "Beauty is not in the face; beauty is a light in the heart.",
    author: "Kahlil Gibran"
  },
  {
    text: "Take time to pamper yourself. You deserve to feel beautiful every day.",
    author: "Unknown"
  },
  {
    text: "Glow up from the inside out. Your inner light is your most beautiful feature.",
    author: "Unknown"
  },
  {
    text: "Beauty is about being comfortable in your own skin and embracing your uniqueness.",
    author: "Unknown"
  },
  {
    text: "Your beauty routine is a ritual of self-love and self-respect.",
    author: "Unknown"
  },
  {
    text: "Sparkle like you mean it! Every day is a runway waiting for your fabulous entrance!",
    author: "Unknown"
  },
  {
    text: "Life's too short for boring hair and basic makeup! Slay today!",
    author: "Unknown"
  },
  {
    text: "Confidence + Good vibes + Beautiful skin = Unstoppable YOU!",
    author: "Beauty Guru"
  },
  {
    text: "Glam it up! Life is your canvas, and you're the masterpiece!",
    author: "Makeup Artist"
  },
  {
    text: "Treat yourself like the queen you are! Royal treatment = Royal glow!",
    author: "Self-Care Advocate"
  },
  {
    text: "Beauty sleep? Nah! Beauty ENERGY is where it's at! Wake up and glow!",
    author: "Modern Beauty"
  }
];

export default function DailyBeautyQuote() {
  const [currentQuote, setCurrentQuote] = useState<BeautyQuote | null>(null);

  const getDailyQuote = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    
    // Pure daily rotation - only changes once per day
    const daysSinceEpoch = Math.floor(today.getTime() / (1000 * 60 * 60 * 24));
    const quoteIndex = (daysSinceEpoch + year + month * 31 + day * 7) % beautyQuotes.length;
    
    console.log(`Daily Quote Index: ${quoteIndex}, Total Quotes: ${beautyQuotes.length}`);
    console.log(`Selected Quote: "${beautyQuotes[quoteIndex].text}" - ${beautyQuotes[quoteIndex].author}`);
    
    return beautyQuotes[quoteIndex];
  };



  useEffect(() => {
    // Load daily quote
    setCurrentQuote(getDailyQuote());
  }, []);

  if (!currentQuote) return null;

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
      <div className="text-center mb-3">
        <span className="text-xs italic text-gray-500">
          Daily Beauty Inspiration
        </span>
      </div>
      <blockquote className="text-center text-lg leading-relaxed text-gray-800 mb-4">
        "{currentQuote.text}"
      </blockquote>
      <div className="text-center">
        <span className="text-sm font-medium text-gray-600">
          — {currentQuote.author}
        </span>
      </div>
    </div>
  );
}