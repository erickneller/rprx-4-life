import type { ReactNode } from 'react';
import Hero from './Hero';
import ProblemSection from './ProblemSection';
import SolutionSnapshot from './SolutionSnapshot';
import Features from './Features';
import HowItWorks from './HowItWorks';
import Testimonials from './Testimonials';
import Stats from './Stats';
import ProductDemo from './ProductDemo';
import Pricing from './Pricing';
import ComparisonTable from './ComparisonTable';
import Integrations from './Integrations';
import SecuritySection from './SecuritySection';
import FAQ from './FAQ';
import FinalCTA from './FinalCTA';
import type { LandingCardRow } from '@/lib/landingCards';

export function renderLandingCard(card: LandingCardRow): ReactNode {
  const c = card.content as any;
  switch (card.component_key) {
    case 'Hero': return <Hero content={c} />;
    case 'ProblemSection': return <ProblemSection content={c} />;
    case 'SolutionSnapshot': return <SolutionSnapshot content={c} />;
    case 'Features': return <Features content={c} />;
    case 'HowItWorks': return <HowItWorks content={c} />;
    case 'Testimonials': return <Testimonials content={c} />;
    case 'Stats': return <Stats content={c} />;
    case 'ProductDemo': return <ProductDemo content={c} />;
    case 'Pricing': return <Pricing content={c} />;
    case 'ComparisonTable': return <ComparisonTable content={c} />;
    case 'Integrations': return <Integrations content={c} />;
    case 'SecuritySection': return <SecuritySection content={c} />;
    case 'FAQ': return <FAQ content={c} />;
    case 'FinalCTA': return <FinalCTA content={c} />;
    default: return null;
  }
}
