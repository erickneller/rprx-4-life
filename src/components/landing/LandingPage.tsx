import Header from '@/components/landing/Header';
import Hero from '@/components/landing/Hero';
import ProblemSection from '@/components/landing/ProblemSection';
import SolutionSnapshot from '@/components/landing/SolutionSnapshot';
import Features from '@/components/landing/Features';
import HowItWorks from '@/components/landing/HowItWorks';
import Testimonials from '@/components/landing/Testimonials';
import Stats from '@/components/landing/Stats';
import ProductDemo from '@/components/landing/ProductDemo';
import Pricing from '@/components/landing/Pricing';
import ComparisonTable from '@/components/landing/ComparisonTable';
import Integrations from '@/components/landing/Integrations';
import SecuritySection from '@/components/landing/SecuritySection';
import FAQ from '@/components/landing/FAQ';
import FinalCTA from '@/components/landing/FinalCTA';
import Footer from '@/components/landing/Footer';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <ProblemSection />
        <SolutionSnapshot />
        <Features />
        <HowItWorks />
        <Testimonials />
        <Stats />
        <ProductDemo />
        <Pricing />
        <ComparisonTable />
        <Integrations />
        <SecuritySection />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
