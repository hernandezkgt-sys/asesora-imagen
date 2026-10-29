// Cómo se guarda un outfit: los números de sus prendas más el estilismo.
// Lo comparten el Probador y la Asesora.

export const ESTILO_INICIAL = { fajar: 'suelta', capa: 'abierta', mangas: 'normales' };
export const PIEZAS_VACIAS = { top: null, abajo: null, capa: null, zapatos: null, accesorios: [] };

// Convierte los números de prenda guardados en las prendas completas.
export function armarOutfit(piezas, estilo, porId) {
  return {
    top: porId.get(piezas.top) ?? null,
    abajo: porId.get(piezas.abajo) ?? null,
    capa: porId.get(piezas.capa) ?? null,
    zapatos: porId.get(piezas.zapatos) ?? null,
    accesorios: (piezas.accesorios ?? []).map((id) => porId.get(id)).filter(Boolean),
    estilo: { ...ESTILO_INICIAL, ...estilo },
  };
}

export const outfitVacio = (piezas) =>
  Object.values(piezas).every((valor) => (Array.isArray(valor) ? !valor.length : !valor));
