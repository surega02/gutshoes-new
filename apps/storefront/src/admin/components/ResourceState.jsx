import React from "react";
import Button from "./Button";

function ResourceState({loading, error, retry}) {
  if (loading)
    return (
      <div className="adm-resource-state" role="status">
        Memuat data operasional…
      </div>
    );
  if (error)
    return (
      <div className="adm-resource-state error" role="alert">
        <span>{error}</span>
        <Button kind="secondary" onClick={retry}>
          Coba lagi
        </Button>
      </div>
    );
  return null;
}

export default ResourceState;
