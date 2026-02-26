/**
 * HouseCarousel — swipeable carousel of 5 House cards.
 *
 * Uses embla-carousel-react for touch/drag swiping.
 * Active card scales up, inactive cards are dimmed.
 * Supports keyboard navigation (left/right arrows).
 */

import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import useEmblaCarousel from "embla-carousel-react";
import { motion } from "motion/react";
import { HOUSE_LIST } from "@/config/houses.js";
import { HouseCard } from "./HouseCard.jsx";
import { fadeInUp, staggerDelay } from "@/lib/motion.js";

export function HouseCarousel({ supplies = {}, prices = {}, onJoin }) {
  const { t } = useTranslation();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
    skipSnaps: false,
  });

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    return () => emblaApi.off("select", onSelect);
  }, [emblaApi, onSelect]);

  // Keyboard navigation
  useEffect(() => {
    function onKeyDown(e) {
      if (!emblaApi) return;
      if (e.key === "ArrowLeft") emblaApi.scrollPrev();
      if (e.key === "ArrowRight") emblaApi.scrollNext();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [emblaApi]);

  return (
    <div className="w-full max-w-lg mx-auto">
      <motion.h2
        className="font-serif text-2xl font-bold text-center mb-6"
        {...fadeInUp}
      >
        {t("home.chooseHouse")}
      </motion.h2>

      <div className="overflow-hidden" ref={emblaRef} role="region" aria-label="House carousel">
        <div className="flex">
          {HOUSE_LIST.map((house, index) => (
            <div
              key={house.id}
              className="flex-[0_0_85%] min-w-0 px-3"
            >
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{
                  opacity: index === selectedIndex ? 1 : 0.6,
                  y: 0,
                  scale: index === selectedIndex ? 1 : 0.9,
                }}
                transition={{
                  ...fadeInUp.transition,
                  ...staggerDelay(index),
                  scale: { type: "spring", stiffness: 300, damping: 30 },
                }}
              >
                <HouseCard
                  house={house}
                  supply={supplies[house.id] ?? 0}
                  price={prices[house.id] ?? "—"}
                  onJoin={onJoin}
                  isActive={index === selectedIndex}
                />
              </motion.div>
            </div>
          ))}
        </div>
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-2 mt-4" role="tablist">
        {HOUSE_LIST.map((house, index) => (
          <button
            key={house.id}
            role="tab"
            aria-selected={index === selectedIndex}
            aria-label={t(house.nameKey)}
            className="relative w-3 h-3 rounded-full transition-colors"
            style={{
              backgroundColor:
                index === selectedIndex
                  ? house.colors.primary
                  : "var(--color-muted)",
            }}
            onClick={() => emblaApi?.scrollTo(index)}
          >
            {index === selectedIndex && (
              <motion.div
                layoutId="carousel-dot"
                className="absolute inset-0 rounded-full"
                style={{ backgroundColor: house.colors.primary }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
