// tRPC não é utilizado neste projeto — o backend é Firebase.
// Este arquivo é mantido para evitar erros de importação residuais.
export const trpc = {
  Provider: ({ children }: { children: React.ReactNode }) => children,
  createClient: () => ({}),
} as any;

export function createTRPCClient() {
  return {};
}
