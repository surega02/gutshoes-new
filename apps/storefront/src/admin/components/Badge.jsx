import React from "react";

const Badge = ({children, tone}) => (
  <span className={`adm-badge ${tone || ""}`}>{children}</span>
);

export default Badge;
