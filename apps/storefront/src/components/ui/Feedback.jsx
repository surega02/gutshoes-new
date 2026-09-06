import React from "react";

const Feedback = ({children, type = "error", id}) =>
  children ? (
    <p
      id={id}
      className={`notice ${type}`}
      role={type === "error" ? "alert" : "status"}
      aria-live={type === "error" ? "assertive" : "polite"}
    >
      {children}
    </p>
  ) : null;

export default Feedback;
