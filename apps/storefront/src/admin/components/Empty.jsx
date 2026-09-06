import React from "react";
import Icon from "./Icon";

const Empty = ({
  title = "Tidak ada data",
  text = "Coba ubah pencarian atau filter yang digunakan.",
}) => (
  <div className="adm-empty">
    <Icon name="search" size={30} />
    <h3>{title}</h3>
    <p>{text}</p>
  </div>
);

export default Empty;
