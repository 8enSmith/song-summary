import { z } from 'zod';

export const FREE_ROUTER = 'openrouter/free';

const MODELS_URL = 'https://openrouter.ai/api/v1/models?sort=most-popular';

export type CatalogModel = {
  id: string;
  hugging_face_id?: string | null;
  architecture?: { output_modalities?: string[] | null } | null;
  reasoning?: {
    mandatory?: boolean | null;
    default_enabled?: boolean | null;
  } | null;
};

const MIN_PARAMS_BILLIONS = 8;
const RANKED_MODEL_COUNT = 2;
const PARAM_SIZE = /(?<![a-z\d.])(\d+(?:\.\d+)?)b(?![a-z])/i;

const statedSizeInBillions = ({ hugging_face_id, id }: CatalogModel) => {
  const match = (hugging_face_id || id).match(PARAM_SIZE);
  return match ? Number(match[1]) : undefined;
};

const isUsableFreeModel = (model: CatalogModel) => {
  const size = statedSizeInBillions(model);
  return (
    model.id.endsWith(':free') &&
    (model.architecture?.output_modalities ?? []).includes('text') &&
    model.reasoning?.mandatory !== true &&
    (size === undefined || size >= MIN_PARAMS_BILLIONS)
  );
};

const reasonsByDefault = (model: CatalogModel) =>
  model.reasoning?.default_enabled === true ? 1 : 0;

export const pickFreeModels = (catalog: CatalogModel[]): string[] => [
  ...catalog
    .filter(isUsableFreeModel)
    .sort((a, b) => reasonsByDefault(a) - reasonsByDefault(b))
    .slice(0, RANKED_MODEL_COUNT)
    .map(({ id }) => id),
  FREE_ROUTER,
];

const catalogSchema = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      hugging_face_id: z.string().nullish(),
      architecture: z
        .object({ output_modalities: z.array(z.string()).nullish() })
        .nullish(),
      reasoning: z
        .object({
          mandatory: z.boolean().nullish(),
          default_enabled: z.boolean().nullish(),
        })
        .nullish(),
    })
  ),
});

export type FetchCatalog = (
  url: string,
  init: { signal: AbortSignal }
) => Promise<Response>;

type FreeModelsOptions = {
  fetchCatalog?: FetchCatalog;
  now?: () => number;
  ttlMs?: number;
  timeoutMs?: number;
};

const fetchWithoutNextCache: FetchCatalog = (url, init) =>
  fetch(url, { ...init, cache: 'no-store' });

export const createFreeModels = ({
  fetchCatalog = fetchWithoutNextCache,
  now = Date.now,
  ttlMs = 3_600_000,
  timeoutMs = 3_000,
}: FreeModelsOptions = {}) => {
  let cached: { ids: string[]; expiresAt: number } | undefined;

  const loadPicks = async () => {
    const response = await fetchCatalog(MODELS_URL, {
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) {
      throw new Error(`Model catalogue request failed: ${response.status}`);
    }
    return pickFreeModels(catalogSchema.parse(await response.json()).data);
  };

  return async (): Promise<string[]> => {
    if (cached && now() < cached.expiresAt) {
      return cached.ids;
    }
    try {
      const ids = await loadPicks();
      cached = { ids, expiresAt: now() + ttlMs };
      return ids;
    } catch (error) {
      console.error('Falling back to the free model router:', error);
      return [FREE_ROUTER];
    }
  };
};

export const getFreeModels = createFreeModels();
