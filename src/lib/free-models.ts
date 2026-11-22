export const FREE_ROUTER = 'openrouter/free';

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
