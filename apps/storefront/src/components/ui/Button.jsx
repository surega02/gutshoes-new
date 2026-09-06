import React from "react";

const Button = ({children, variant = "primary", className = "", ...props}) => (
  <button className={`button button--${variant} ${className}`} {...props}>
    {children}
  </button>
);

export default Button;
