import React from "react";
import {rupiah} from "../../data";
import {statusTone} from "../lib/helpers";
import Badge from "./Badge";
import Icon from "./Icon";

function OrdersTable({rows, onOpen}) {
  return (
    <div className="adm-table-wrap">
      <table>
        <thead>
          <tr>
            <th>Pesanan</th>
            <th>Pelanggan</th>
            <th>Pembayaran</th>
            <th>Status</th>
            <th className="num">Total</th>
            <th>
              <span className="sr-only">Aksi</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((o) => (
            <tr key={o.id}>
              <td>
                <strong>{o.id}</strong>
                <small>{o.time}</small>
              </td>
              <td>{o.customer}</td>
              <td>
                <Badge tone={statusTone(o.payment)}>{o.payment}</Badge>
              </td>
              <td>
                <Badge tone={statusTone(o.status)}>{o.status}</Badge>
              </td>
              <td className="num">
                <strong>{rupiah(o.total)}</strong>
              </td>
              <td>
                <button
                  className="adm-row-action"
                  onClick={() => onOpen?.(o)}
                  aria-label={`Buka ${o.id}`}
                >
                  <Icon name="arrow" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default OrdersTable;
