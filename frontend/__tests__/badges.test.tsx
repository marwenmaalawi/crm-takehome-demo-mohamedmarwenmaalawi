import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ProblemAssessment } from '@crm/contracts';
import { ProblemBadges } from '@/components/badges';

const overdue: ProblemAssessment = {
  isProblem: true,
  flags: ['OVERDUE'],
  overdueDays: 12,
  stalledDays: null,
  reasons: ['En retard de 12 j'],
};

const healthy: ProblemAssessment = {
  isProblem: false,
  flags: [],
  overdueDays: null,
  stalledDays: null,
  reasons: [],
};

describe('ProblemBadges', () => {
  it('renders the overdue flag with its reason as a tooltip', () => {
    render(<ProblemBadges problem={overdue} locale="fr" />);
    expect(screen.getByText('En retard')).toBeInTheDocument();
    expect(screen.getByTitle('En retard de 12 j')).toBeInTheDocument();
  });

  it('renders nothing for a healthy opportunity by default', () => {
    const { container } = render(<ProblemBadges problem={healthy} locale="fr" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a "Sain" badge for a healthy opportunity when showHealthy is set', () => {
    render(<ProblemBadges problem={healthy} locale="fr" showHealthy />);
    expect(screen.getByText('Sain')).toBeInTheDocument();
  });
});
