import {useEffect, useState} from "react";

function useAdminResource(loader) {
  const [state, setState] = useState({loading: true, error: "", data: null});
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setState((previous) => ({...previous, loading: true, error: ""}));
    loader()
      .then((response) => {
        if (active) setState({loading: false, error: "", data: response.data});
      })
      .catch((error) => {
        if (active)
          setState({
            loading: false,
            error: error.message || "Server admin tidak dapat dijangkau.",
            data: null,
          });
      });
    return () => {
      active = false;
    };
  }, [attempt]);
  return {...state, retry: () => setAttempt((value) => value + 1)};
}

export default useAdminResource;
