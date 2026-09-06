"use client";

import { useEffect, useState } from "react";

interface PresentationControllerProps {
  onSectionChange?: (index: number) => void;
  sectionCount?: number;
}

export default function PresentationController({
  onSectionChange,
  sectionCount = 5,
}: PresentationControllerProps) {
  const [isPresenting, setIsPresenting] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const togglePresentation = () => {
    setIsPresenting((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.setAttribute("data-stage-mode", "true");
        document.documentElement.requestFullscreen?.().catch(() => {});
      } else {
        document.documentElement.removeAttribute("data-stage-mode");
        document.exitFullscreen?.().catch(() => {});
      }
      return next;
    });
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => {
      const next = (prev + 1) % sectionCount;
      onSectionChange?.(next);
      return next;
    });
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => {
      const next = (prev - 1 + sectionCount) % sectionCount;
      onSectionChange?.(next);
      return next;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle presentation with 'P' key
      if (e.key === "p" || e.key === "P") {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        togglePresentation();
        return;
      }

      if (!isPresenting) return;

      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        nextSlide();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        prevSlide();
      } else if (e.key === "Escape") {
        setIsPresenting(false);
        document.documentElement.removeAttribute("data-stage-mode");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPresenting, sectionCount]);

  useEffect(() => {
    return () => {
      document.documentElement.removeAttribute("data-stage-mode");
    };
  }, []);

  // Invisible keyboard controller (No floating buttons or overlays)
  return null;
}
