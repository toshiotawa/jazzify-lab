export interface FAQItem {
  id: number;
  question: string;
  answer: string;
  link?: { href: string; text: string; external?: boolean };
  extraLinks?: { href: string; text: string; external?: boolean }[];
}

export interface NavLink {
  id: string;
  label: string;
}
