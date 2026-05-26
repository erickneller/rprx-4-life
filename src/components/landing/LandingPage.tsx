import Header from '@/components/landing/Header';
import Footer from '@/components/landing/Footer';
import { useLandingCards } from '@/hooks/useLandingCards';
import { renderLandingCard } from './LandingCardRenderer';

const LandingPage = () => {
  const { data: cards = [], isLoading } = useLandingCards();
  const visible = cards.filter((c) => c.is_visible);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {!isLoading && visible.map((card) => (
          <div key={card.id}>{renderLandingCard(card)}</div>
        ))}
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
