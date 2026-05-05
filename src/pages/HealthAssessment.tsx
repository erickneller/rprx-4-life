import { useEffect } from 'react';
import { useAssessmentStore } from '@/store/healthAssessmentStore';
import { WelcomeScreen } from '@/components/health-assessment/WelcomeScreen';
import { ProgressBar } from '@/components/health-assessment/ProgressBar';
import { Step1BasicProfile } from '@/components/health-assessment/Step1BasicProfile';
import { Step2HealthHabits } from '@/components/health-assessment/Step2HealthHabits';
import { Step3Screenings } from '@/components/health-assessment/Step3Screenings';
import { Step4Goals } from '@/components/health-assessment/Step4Goals';
import { Step5Contact } from '@/components/health-assessment/Step5Contact';
import { ResultsScreen } from '@/components/health-assessment/ResultsScreen';

const HealthAssessment = () => {
  const currentStep = useAssessmentStore((state) => state.currentStep);

  // Report height to parent window when embedded in an iframe (e.g. GoHighLevel)
  useEffect(() => {
    if (typeof window === 'undefined' || window.parent === window) return;

    const postHeight = () => {
      const height = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      );
      window.parent.postMessage({ type: 'rprx:height', height }, '*');
    };

    postHeight();
    const ro = new ResizeObserver(() => postHeight());
    ro.observe(document.body);
    window.addEventListener('load', postHeight);

    return () => {
      ro.disconnect();
      window.removeEventListener('load', postHeight);
    };
  }, [currentStep]);

  return (
    <div className="min-h-screen">
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
      {currentStep === 6 && <ResultsScreen />}
    </div>
  );
};

export default HealthAssessment;
