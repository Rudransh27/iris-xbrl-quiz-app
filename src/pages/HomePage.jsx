import React from "react";
import { useLayoutEffect } from "react";
import HeroEntryCard from "../components/HeroEntryCard";
import CoursesSection from '../components/CoursesHeroSection';
export default function HomePage() {
   useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <div>
      <HeroEntryCard />
      <CoursesSection/>
    </div>
  );
}
