import { CTABanner } from "@/components/landing/CTABanner";
import { Categories } from "@/components/landing/Categories";
import { Footer } from "@/components/landing/Footer";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Navbar } from "@/components/landing/Navbar";
import { WhyMeetvo } from "@/components/landing/WhyMeetvo";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <Hero />
      <HowItWorks />
      <Categories />
      <WhyMeetvo />
      <CTABanner />
      <Footer />
    </>
  );
}
