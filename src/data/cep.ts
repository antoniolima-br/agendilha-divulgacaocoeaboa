export interface ViaCepData {
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
}

/** Transport only: callers retain validation, manual-entry rules and request ownership. */
export async function fetchCepAddress(
  digits: string,
  options: { signal?: AbortSignal; checkHttpStatus?: boolean } = {},
): Promise<ViaCepData> {
  const url = `https://viacep.com.br/ws/${digits}/json/`;
  const response = options.signal
    ? await fetch(url, { signal: options.signal })
    : await fetch(url);
  if (options.checkHttpStatus !== false && !response.ok) {
    throw new Error("Falha ao consultar CEP");
  }
  return response.json();
}
