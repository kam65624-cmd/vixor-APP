export function hasValidBearerSecret(
  authorizationHeader: string | undefined,
  ...secrets: Array<string | undefined>
): boolean {
  return Boolean(
    authorizationHeader &&
    secrets.some((secret) => Boolean(secret) && authorizationHeader === `Bearer ${secret}`),
  );
}

export function isCronRequestAuthorized(
  authorizationHeader: string | undefined,
  cronSecret: string | undefined,
  nodeEnv: string | undefined,
): boolean {
  if (cronSecret) return hasValidBearerSecret(authorizationHeader, cronSecret);
  return isNonProductionEnvironment(nodeEnv);
}

export function isNonProductionEnvironment(nodeEnv: string | undefined): boolean {
  return nodeEnv === "development" || nodeEnv === "test";
}

export function isWebhookSecretBypassAllowed(
  nodeEnv: string | undefined,
  allowNoAuth: boolean,
): boolean {
  return isNonProductionEnvironment(nodeEnv) && allowNoAuth;
}
