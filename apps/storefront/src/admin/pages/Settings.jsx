import React from "react";
import {api} from "../../api";
import useAdminResource from "../hooks/useAdminResource";
import {serverList} from "../lib/helpers";
import Empty from "../components/Empty";
import PageHead from "../components/PageHead";
import ResourceState from "../components/ResourceState";
import SettingsForm from "../components/SettingsForm";

function SettingsPage() {
  const resource = useAdminResource(api.adminConfigurations);
  const items = serverList(resource.data);
  return (
    <>
      <PageHead section="settings" />
      <ResourceState {...resource} />
      {!resource.loading &&
        !resource.error &&
        (items.length ? (
          <SettingsForm items={items} reload={resource.retry} />
        ) : (
          <Empty text="Belum ada konfigurasi toko di database." />
        ))}
    </>
  );
}

export default SettingsPage;
