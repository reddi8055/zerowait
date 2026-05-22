import React from "react";
import { cn } from "../../lib/utils";
import { ChevronUp, ChevronDown } from "lucide-react";

export function HeroSection7({ className }) {
  const floatingAssets = [
    {
      src: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=600&auto=format&fit=crop",
      className: "top-[15%] left-[5%] md:top-[20%] md:left-[10%] w-32 sm:w-48 md:w-56 animate-float-1",
      alt: "Gourmet Burger"
    },
    {
      src: "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?q=80&w=600&auto=format&fit=crop",
      className: "bottom-[20%] left-[8%] md:bottom-[15%] md:left-[15%] w-28 sm:w-40 md:w-48 animate-float-2 delay-[100ms]",
      alt: "Dumpling Basket"
    },
    {
      src: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=600&auto=format&fit=crop",
      className: "top-[25%] right-[5%] md:top-[15%] md:right-[12%] w-36 sm:w-52 md:w-64 animate-float-3 delay-[300ms]",
      alt: "Hot Pizza"
    },
    {
      src: "https://images.unsplash.com/photo-1628294895950-9805252327bc?q=80&w=600&auto=format&fit=crop",
      className: "top-[10%] right-[30%] w-12 sm:w-16 md:w-20 animate-float-4 delay-[500ms] rounded-full",
      alt: "Mint Garnish"
    },
    {
      src: "https://images.unsplash.com/photo-1607301405390-d831c242f59b?q=80&w=600&auto=format&fit=crop",
      className: "bottom-[15%] right-[10%] md:bottom-[20%] md:right-[20%] w-20 sm:w-28 md:w-32 animate-float-5 delay-[200ms] rounded-full",
      alt: "Fresh Tomato"
    }
  ];

  return (
    <section className={cn(
      "relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-orange-50/20 via-background to-background overflow-hidden",
      className
    )}>
      {/* Background abstract radial glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] md:w-[800px] h-[600px] md:h-[800px] bg-orange-400/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 right-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-orange-500/5 rounded-full blur-3xl pointer-events-none translate-x-1/3 -translate-y-1/3" />

      {/* Floating Elements (Anti-Gravity) */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {floatingAssets.map((asset, index) => (
          <img
            key={index}
            src={asset.src}
            alt={asset.alt}
            className={cn(
              "absolute object-cover rounded-3xl shadow-2xl shadow-orange-900/10",
              asset.className
            )}
            style={{ animationDelay: asset.className.match(/delay-\[([^\]]+)\]/)?.[1] || '0ms' }}
          />
        ))}
      </div>

      {/* Top scroll indicator */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10">
        <a href="#top" className="flex flex-col items-center text-muted-foreground hover:text-primary transition-colors gap-1 group">
          <ChevronUp className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
          <span className="text-xs font-medium uppercase tracking-widest">Scroll Up</span>
        </a>
      </div>

      {/* Main Content */}
      <div className="relative z-10 container px-4 md:px-6 flex flex-col items-center text-center">
        <div className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-4 py-1.5 text-sm font-semibold text-orange-600 mb-8 shadow-sm">
          ✨ The future of dining is here
        </div>
        
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-gray-900 mb-6 drop-shadow-sm">
          Zero Wait.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-400">Maximum Taste.</span>
        </h1>
        
        <p className="max-w-2xl text-lg sm:text-xl text-gray-600 mb-10 leading-relaxed font-medium">
          Pre-book your favorite table, pre-order your custom meal, and handle payments in advance. Walk in, sit down, and enjoy hot, fresh food served instantly upon arrival.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <button className="inline-flex items-center justify-center rounded-full bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 text-base font-semibold shadow-xl shadow-orange-500/25 transition-all hover:-translate-y-0.5 active:translate-y-0">
            Find Restaurants
          </button>
          <button className="inline-flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 px-8 py-4 text-base font-semibold shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0">
            How it Works
          </button>
        </div>
      </div>

      {/* Bottom scroll indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10">
        <a href="#dashboard" className="flex flex-col items-center text-muted-foreground hover:text-primary transition-colors gap-2 group">
          <span className="text-xs font-medium uppercase tracking-widest text-gray-500 group-hover:text-orange-500 transition-colors">Continue to Dashboard</span>
          <div className="animate-bounce-slow mt-2 bg-white rounded-full p-2 shadow-md border border-gray-100 group-hover:border-orange-200 transition-colors">
            <ChevronDown className="w-5 h-5 text-orange-500" />
          </div>
        </a>
      </div>
    </section>
  );
}
