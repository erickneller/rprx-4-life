import { useEffect, useRef } from 'react';
import { useAssessmentStore } from '@/store/healthAssessmentStore';
import { WelcomeScreen } from '@/components/health-assessment/WelcomeScreen';
import { ProgressBar } from '@/components/health-assessment/ProgressBar';
import { Step1BasicProfile } from '@/components/health-assessment/Step1BasicProfile';
import { Step2HealthHabits } from '@/components/health-assessment/Step2HealthHabits';
import { Step3Screenings } from '@/components/health-assessment/Step3Screenings';
import { Step4Goals } from '@/components/health-assessment/Step4Goals';
import { Step5Contact } from '@/components/health-assessment/Step5Contact';
import { PhysicalSnapshotReport } from '@/components/health-assessment/PhysicalSnapshotReport';

const isEmbedded = () => {
  if (typeof window === 'undefined') return false;
  try {
    if (window.parent !== window) return true;
  } catch {
    return true;
  }
  return new URLSearchParams(window.location.search).has('embed');
};

const HealthAssessment = () => {
  const currentStep = useAssessmentStore((state) => state.currentStep);
  const rootRef = useRef<HTMLDivElement>(null);

  // Toggle embed mode class on <html>
  useEffect(() => {
    if (!isEmbedded()) return;
    document.documentElement.classList.add('embed');
    return () => document.documentElement.classList.remove('embed');
  }, []);

  // Report height to parent window when embedded
  useEffect(() => {
    if (!isEmbedded() || !rootRef.current) return;
    const el = rootRef.current;
    let lastHeight = 0;
    let rafId = 0;

    const postHeight = () => {
      rafId = 0;
      const height = Math.ceil(el.getBoundingClientRect().height);
      if (height && height !== lastHeight) {
        lastHeight = height;
        try {
          window.parent.postMessage({ type: 'rprx:height', height }, '*');
        } catch {
          /* noop */
        }
      }
    };

    const schedule = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(postHeight);
    };

    // Initial measurement after layout settles
    schedule();
    const t = setTimeout(schedule, 100);

    const ro = new ResizeObserver(schedule);
    ro.observe(el);
    window.addEventListener('load', schedule);

    return () => {
      ro.disconnect();
      window.removeEventListener('load', schedule);
      clearTimeout(t);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  // Force a fresh measurement on every step change
  useEffect(() => {
    if (!isEmbedded() || !rootRef.current) return;
    const el = rootRef.current;
    requestAnimationFrame(() => {
      const height = Math.ceil(el.getBoundingClientRect().height);
      try {
        window.parent.postMessage({ type: 'rprx:height', height }, '*');
      } catch {
        /* noop */
      }
    });
  }, [currentStep]);

  return (
    <div ref={rootRef}>
      {currentStep === 0 && <WelcomeScreen />}
      {currentStep > 0 && currentStep < 6 && (
        <div>
          <ProgressBar currentStep={currentStep} totalSteps={5} />
          {currentStep === 1 && <Step1BasicProfile />}
          {currentStep === 2 && <Step2HealthHabits />}
          {currentStep === 3 && <Step3Screenings />}
          {currentStep === 4 && <Step4Goals />}
          {currentStep === 5 && <Step5Contact />}
        </div>
      )}
      {currentStep === 6 && <PhysicalSnapshotReport />}
    </div>
  );
};

export default HealthAssessment;
