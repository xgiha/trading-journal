
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  total: number;
  page: number;
  setPage: (page: number) => void;
}

export default function Pagination({
  total,
  page,
  setPage,
}: PaginationProps) {
  const goPrev = () => setPage(page > 0 ? page - 1 : page);
  const goNext = () => setPage(page < total - 1 ? page + 1 : page);

  return (
    <div className="flex items-center justify-center gap-6 py-2">
      {/* Left Arrow */}
      <ChevronLeft
        onClick={goPrev}
        className={`h-5 w-5 cursor-pointer text-muted-foreground transition hover:text-foreground ${
          page === 0 ? "opacity-10" : "opacity-60"
        } ${page === 0 ? "pointer-events-none" : ""}`}
      />

      {/* Dots */}
      <div className="flex items-center gap-3">
        {Array.from({ length: total }).map((_, i) => {
          const isActive = i === page;
          return (
            <motion.div
              key={i}
              className={`relative cursor-pointer ${
                isActive ? "bg-primary" : "bg-muted-foreground/30"
              }`}
              onClick={() => setPage(i)}
              animate={{
                width: isActive ? 24 : 8,
                height: 8,
                borderRadius: 9999,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
            >
              {/* Ripple effect for active dot */}
              {isActive && (
                <AnimatePresence>
                  <motion.span
                    key="ripple"
                    className="absolute inset-0 rounded-full bg-primary/30"
                    initial={{ scale: 0.8, opacity: 0.6 }}
                    animate={{ scale: 1.6, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                  />
                </AnimatePresence>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Right Arrow */}
      <ChevronRight
        onClick={goNext}
        className={`h-5 w-5 cursor-pointer text-muted-foreground transition hover:text-foreground ${
          page === total - 1 ? "opacity-10" : "opacity-60"
        } ${page === total - 1 ? "pointer-events-none" : ""}`}
      />
    </div>
  );
}
