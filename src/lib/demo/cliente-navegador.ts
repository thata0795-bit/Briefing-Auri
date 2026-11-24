/* eslint-disable @typescript-eslint/no-explicit-any */
/** Substituto do cliente do Supabase no navegador, na demonstração. */
const indisponivel = async () => ({ data: null, error: { message: "Indisponível na demonstração.", status: 400 } });

export function criarClienteNavegadorDemo(): any {
  return {
    storage: { from: () => ({ upload: async () => ({ data: {}, error: null }) }) },
    auth: {
      signInWithOtp: indisponivel,
      signInWithPassword: indisponivel,
      resetPasswordForEmail: indisponivel,
      updateUser: indisponivel,
      mfa: {
        listFactors: async () => ({ data: { totp: [], all: [] }, error: null }),
        enroll: indisponivel,
        challengeAndVerify: indisponivel,
        unenroll: indisponivel,
      },
    },
  };
}
