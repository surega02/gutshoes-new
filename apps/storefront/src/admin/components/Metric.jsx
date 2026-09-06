import React from "react";

function Metric({label, value, delta, attention}) {
  return (
    <article className={`adm-metric ${attention ? "attention" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{delta}</small>
    </article>
  );
}

export default Metric;
