import { Footer } from './components/Footer';
import { Hero } from './components/Hero';
import { InviteSection } from './components/InviteSection';
import { Stamps } from './components/Stamps';

export function App() {
  return (
    <main className="page">
      <Hero />
      <Stamps />
      <InviteSection />
      <Footer />
    </main>
  );
}
