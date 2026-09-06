import React from "react";

const Button = ({children, kind = "primary", ...props}) => (
  <button className={`adm-button ${kind}`} {...props}>
    {children}
  </button>
);

export default Button;
