import MoneyIllustration from '../components/illustrations/MoneyIllustration';
import RewardsIllustration from '../components/illustrations/RewardsIllustration';
import InvestingIllustration from '../components/illustrations/InvestingIllustration';
import SecurityIllustration from '../components/illustrations/SecurityIllustration';

export type Slide = {
  key: string;
  title: string;
  subtitle: string;
  Illustration: React.ComponentType<{ size?: number }>;
};

export const slides: Slide[] = [
  {
    key: 'money',
    title: 'Master Your Money',
    subtitle: 'Powerful tools to grow, manage, and understand your finances.',
    Illustration: MoneyIllustration,
  },
  {
    key: 'rewards',
    title: 'Earn as You Spend',
    subtitle: 'Earn stock and crypto rewards automatically with everyday purchases.',
    Illustration: RewardsIllustration,
  },
  {
    key: 'investing',
    title: 'Smarter Investing',
    subtitle: 'Trade stocks, ETFs, and crypto — or let your portfolio run on autopilot.',
    Illustration: InvestingIllustration,
  },
  {
    key: 'security',
    title: 'Bank-Level Security',
    subtitle: 'Your money and data are protected with encryption trusted by millions.',
    Illustration: SecurityIllustration,
  },
];
