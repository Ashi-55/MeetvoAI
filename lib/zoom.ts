const ZOOM_OAUTH_BASE = "https://zoom.us/oauth/token";

export interface ZoomTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

/**
 * Server-to-server OAuth token for Zoom API (account credentials flow).
 * Requires ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET.
 */
export async function getZoomAccessToken(): Promise<string> {
  const accountId = process.env.ZOOM_ACCOUNT_ID;
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;
  if (!accountId || !clientId || !clientSecret) {
    throw new Error(
      "Missing ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, or ZOOM_CLIENT_SECRET"
    );
  }
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64"
  );
  const body = new URLSearchParams({
    grant_type: "account_credentials",
    account_id: accountId,
  });
  const res = await fetch(ZOOM_OAUTH_BASE, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Zoom OAuth failed: ${res.status} ${text}`);
  }
  const json = (await res.json()) as ZoomTokenResponse;
  return json.access_token;
}
