import {
  clientAccountInputSchema,
  clientAccountOnboardingInputSchema,
} from "./client-management.contracts.ts";
import { buildClientUserCredentialData } from "./client-users.repository.server.ts";

type ClientAccountOnboardingAccount = ReturnType<typeof clientAccountInputSchema.parse>;

export async function createClientAccountOnboardingWithPersistence<T>(
  input: unknown,
  actorId: string,
  persist: (
    account: ClientAccountOnboardingAccount,
    primaryAdmin: Awaited<ReturnType<typeof buildClientUserCredentialData>>,
    actorId: string,
  ) => Promise<T>,
) {
  const { primaryAdmin: inputAdmin, ...account } = clientAccountOnboardingInputSchema.parse(input);
  const primaryAdmin = await buildClientUserCredentialData(inputAdmin);
  return persist(account, primaryAdmin, actorId);
}
