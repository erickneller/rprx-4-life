import { useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { SliderQuestion } from './SliderQuestion';
import { SingleChoiceQuestion } from './SingleChoiceQuestion';
import { YesNoQuestion } from './YesNoQuestion';
import { RangeSelectQuestion } from './RangeSelectQuestion';
import type { AssessmentQuestion } from '@/lib/assessmentTypes';

interface QuestionCardProps {
  question: AssessmentQuestion;
  value: string | undefined;
  onChange: (value: string) => void;
}

export function QuestionCard({ question, value, onChange }: QuestionCardProps) {
  // Auto-select first option for slider questions so Next is enabled immediately
  useEffect(() => {
    if (question.question_type === 'slider' && !value && question.options.length > 0) {
      onChange(question.options[0].value);
    }
  }, [question.id]);

  const renderQuestionInput = () => {
    switch (question.question_type) {
      case 'slider':
        return (
          <SliderQuestion
            options={question.options}
            value={value}
            onChange={onChange}
          />
        );
      case 'single_choice':
        return (
          <SingleChoiceQuestion
            options={question.options}
            value={value}
            onChange={onChange}
          />
        );
      case 'yes_no':
        return (
          <YesNoQuestion
            options={question.options}
            value={value}
            onChange={onChange}
          />
        );
      case 'range_select':
        return (
          <RangeSelectQuestion
            options={question.options}
            value={value}
            onChange={onChange}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="pb-4">
        <h2 className="text-xl md:text-2xl font-semibold text-foreground leading-relaxed">
          {question.question_text}
        </h2>
      </CardHeader>
      <CardContent>{renderQuestionInput()}</CardContent>
    </Card>
  );
}
