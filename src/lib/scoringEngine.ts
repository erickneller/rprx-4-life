export type HorsemanType = 'interest' | 'taxes' | 'insurance' | 'education';

export interface HorsemanScores {
  interest: number;
  taxes: number;
  insurance: number;
  education: number;
}

export interface QuestionOption {
  value: string;
  label: string;
  score: number;
  midpoint?: number;
}

export interface QuestionResponse {
  questionId: string;
  value: string;
  horsemanWeights: Record<string, number>;
  options: QuestionOption[];
  category: string;
}

export function calculateHorsemanScores(responses: QuestionResponse[]): HorsemanScores {
  const scores: HorsemanScores = {
    interest: 0,
    taxes: 0,
    insurance: 0,
    education: 0,
  };

  const counts: HorsemanScores = {
    interest: 0,
    taxes: 0,
    insurance: 0,
    education: 0,
  };

  responses.forEach((response) => {
    // Skip cash flow questions
    if (response.category === 'cash_flow') return;

    const selectedOption = response.options.find(
      (opt) => opt.value === response.value
    );
    if (!selectedOption) return;

    const questionScore = selectedOption.score;

    // Apply weights to each horseman
    Object.entries(response.horsemanWeights).forEach(([horseman, weight]) => {
      if (horseman in scores && weight > 0) {
        const key = horseman as HorsemanType;
        scores[key] += questionScore * weight;
        counts[key] += weight;
      }
    });
  });

  // Calculate averages
  (Object.keys(scores) as HorsemanType[]).forEach((horseman) => {
    if (counts[horseman] > 0) {
      scores[horseman] = Math.round(scores[horseman] / counts[horseman]);
    }
  });

  return scores;
}

export function determinePrimaryHorseman(scores: HorsemanScores): HorsemanType {
  let maxScore = -1;
  let primary: HorsemanType = 'interest';

  (Object.entries(scores) as [HorsemanType, number][]).forEach(([horseman, score]) => {
    if (score > maxScore) {
      maxScore = score;
      primary = horseman;
    }
  });

  return primary;
}

export function getHorsemanLabel(horseman: HorsemanType): string {
  const labels: Record<HorsemanType, string> = {
    interest: 'Interest & Debt',
    taxes: 'Tax Efficiency',
    insurance: 'Insurance Costs',
    education: 'Education Funding',
  };
  return labels[horseman];
}

export function getHorsemanShortLabel(horseman: HorsemanType): string {
  const labels: Record<HorsemanType, string> = {
    interest: 'Interest',
    taxes: 'Taxes',
    insurance: 'Insurance',
    education: 'Education',
  };
  return labels[horseman];
}
