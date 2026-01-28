import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const FAQ = () => {
  const faqs = [
    {
      question: 'What are the "Four Horsemen" of financial pressure?',
      answer: 'The Four Horsemen are the four compounding forces that silently drain wealth over time: Interest (debt costs), Taxes (inefficient tax strategies), Insurance Costs (misaligned coverage), and Education Costs (including opportunity costs of financial illiteracy). Our assessment helps you identify which is impacting you most.',
    },
    {
      question: 'Is RPRx trying to sell me financial products?',
      answer: 'No. RPRx is a diagnostic platform focused on awareness and education. We don\'t sell insurance, investments, or any financial products. We help you understand your situation so you can have better conversations with qualified professionals.',
    },
    {
      question: 'How is RPRx different from budgeting apps?',
      answer: 'While budgeting apps track where your money goes, RPRx identifies systemic pressure points—the underlying forces causing financial leakage. Think of us as a diagnostic tool that reveals the "why" behind your financial challenges, not just the "what."',
    },
    {
      question: 'Can RPRx replace my financial advisor?',
      answer: 'No, and that\'s by design. RPRx is meant to work alongside your existing advisors, not replace them. We provide clarity and awareness that helps you have more productive conversations with licensed professionals.',
    },
    {
      question: 'How long does the assessment take?',
      answer: 'The RPRx Financial Success Assessment takes just 3-5 minutes to complete. It\'s designed to gather meaningful insights without overwhelming you with complex questions.',
    },
    {
      question: 'Is my data secure?',
      answer: 'Absolutely. We use bank-level 256-bit SSL encryption, are SOC 2 compliant, and never sell your data. Your financial information is stored securely and accessed only by you.',
    },
  ];

  return (
    <section id="faq" className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            FAQ
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground">
            Got questions? We've got answers.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border border-border rounded-xl px-6 bg-card"
              >
                <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline py-5">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
