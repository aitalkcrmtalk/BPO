export type PlanTier = "free" | "starter" | "pro" | "enterprise";

export interface PlanDefinition {
  tier: PlanTier;
  name: string;
  price: string;
  description: string;
  automations: number;
  documents: number;
  users: number;
  features: string[];
  highlighted?: boolean;
}

export const PLANS: PlanDefinition[] = [
  {
    tier: "free",
    name: "Free",
    price: "R$ 0",
    description: "Para experimentar o Projeto-BPO sem custo.",
    automations: 1,
    documents: 20,
    users: 1,
    features: ["1 automação ativa", "20 documentos/mês", "1 usuário", "Suporte por email"],
  },
  {
    tier: "starter",
    name: "Starter",
    price: "R$ 299/mês",
    description: "Para pequenos escritórios iniciando a automação.",
    automations: 5,
    documents: 200,
    users: 3,
    features: ["5 automações", "200 documentos/mês", "3 usuários", "Integrações básicas"],
  },
  {
    tier: "pro",
    name: "Pro",
    price: "R$ 799/mês",
    description: "Para operações de médio porte com fluxo intenso.",
    automations: 20,
    documents: 2000,
    users: 10,
    features: [
      "20 automações",
      "2.000 documentos/mês",
      "10 usuários",
      "Integrações avançadas",
      "Suporte prioritário",
    ],
    highlighted: true,
  },
  {
    tier: "enterprise",
    name: "Enterprise",
    price: "Sob consulta",
    description: "Para BPOs que precisam de escala e SLA dedicado.",
    automations: 999,
    documents: 999999,
    users: 999,
    features: [
      "Automações ilimitadas",
      "Documentos ilimitados",
      "Usuários ilimitados",
      "SLA dedicado",
      "Onboarding assistido",
    ],
  },
];

export function planByTier(tier: PlanTier): PlanDefinition {
  return PLANS.find((p) => p.tier === tier) ?? PLANS[0];
}