export type Ga4EventParams = Record<string, string | number | boolean | undefined>;

const getGa4Config = (): { measurementId: string; apiSecret: string } | null => {
  const measurementId = process.env.GA4_MEASUREMENT_ID;
  const apiSecret = process.env.GA4_MP_API_SECRET;
  if (!measurementId || !apiSecret) {
    return null;
  }
  return { measurementId, apiSecret };
};

export const sendGa4Event = async (
  clientId: string,
  name: string,
  params?: Ga4EventParams,
): Promise<void> => {
  const config = getGa4Config();
  if (!config || !clientId) {
    return;
  }

  const url = new URL('https://www.google-analytics.com/mp/collect');
  url.searchParams.set('measurement_id', config.measurementId);
  url.searchParams.set('api_secret', config.apiSecret);

  const body = {
    client_id: clientId,
    events: [
      {
        name,
        params: params ?? {},
      },
    ],
  };

  try {
    await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    /* analytics must not block webhook processing */
  }
};
