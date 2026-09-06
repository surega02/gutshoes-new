import React from "react";
import {titles} from "../config";
import Button from "./Button";
import Icon from "./Icon";

function PageHead({section, action, onAction}) {
  const [title, description] = titles[section] || titles.dashboard;
  return (
    <div className="adm-page-head">
      <div>
        <p className="adm-eyebrow">ADMIN / {title.toUpperCase()}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action && (
        <Button onClick={onAction}>
          <Icon name="plus" /> {action}
        </Button>
      )}
    </div>
  );
}

export default PageHead;
