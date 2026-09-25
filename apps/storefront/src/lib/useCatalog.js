import {useEffect, useState} from "react";
import {api} from "../api";
import {mapCatalogProduct} from "./catalog";

// Keep each response attached to its query or slug, including during retries.
function useCatalogRequest(kind, key) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({});
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setState((previous) => ({...previous, key, attempt, loading: true, error: undefined}));
    const request = kind === "product"
      ? api.product(key, {signal: controller.signal})
      : api.catalog(JSON.parse(key), {signal: controller.signal});
    request.then((response) => {
      if (active) setState({key, attempt, response, filters: response.filters, loading: false});
    }).catch((error) => {
      if (active) setState((previous) => ({...previous, key, attempt, response: undefined, error, loading: false}));
    });
    return () => { active = false; controller.abort(); };
  }, [kind, key, attempt]);
  const current = state.key === key && state.attempt === attempt;
  return {
    response: current && !state.loading ? state.response : undefined,
    filters: state.filters,
    loading: !current || state.loading,
    error: current ? state.error : undefined,
    retry: () => setAttempt((value) => value + 1),
  };
}

export function useCatalog(params) {
  const result = useCatalogRequest("catalog", JSON.stringify(params));
  return {...result, products: (result.response?.data || []).map(mapCatalogProduct),
    meta: result.response?.meta};
}

export function useProduct(slug) {
  const result = useCatalogRequest("product", slug);
  return {...result, product: result.response?.data ? mapCatalogProduct(result.response.data) : null};
}
