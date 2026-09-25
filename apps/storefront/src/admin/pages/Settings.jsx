import React from "react";
import {api} from "../../api";
import useAdminResource from "../hooks/useAdminResource";
import {serverList} from "../lib/helpers";
import Empty from "../components/Empty";
import PageHead from "../components/PageHead";
import ResourceState from "../components/ResourceState";
import SettingsForm from "../components/SettingsForm";
import WarehouseForm from "../components/WarehouseForm";

function SettingsPage() {
  const resource = useAdminResource(api.adminConfigurations);
  const warehouse = useAdminResource(api.adminWarehouse);
  const items = serverList(resource.data);
  return (
    <>
      <PageHead section="settings" />
      <ResourceState {...resource} />
      {!resource.loading &&
        !resource.error &&
        (items.length ? (
          <><SettingsForm items={items} reload={resource.retry} />{warehouse.data && <WarehouseForm warehouse={warehouse.data} reload={warehouse.retry} />}</>
        ) : (
          <Empty text="Belum ada konfigurasi toko di database." />
        ))}
    </>
  );
}

export default SettingsPage;
