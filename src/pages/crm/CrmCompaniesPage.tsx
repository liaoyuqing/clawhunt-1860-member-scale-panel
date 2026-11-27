import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Tag } from "tdesign-react";
import { fetchCrmCompanies } from "../../services/member-scale-api";
import { readLifecycleParam } from "../../utils/crm-url";
import { stageLabel } from "../../utils/lifecycle-order";
import type { CrmCompanyRow } from "../../types/member-scale";

export function CrmCompaniesPage() {
  const [params] = useSearchParams();
  const lifecycle = useMemo(() => readLifecycleParam(params.toString()), [params]);
  const [rows, setRows] = useState<CrmCompanyRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchCrmCompanies(lifecycle).then((data) => {
      if (cancelled) return;
      setRows(data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [lifecycle]);

  const filterText = lifecycle ? stageLabel(lifecycle) : "全部状态";

  return (
    <main className="page">
      <header className="crm-head">
        <h2 className="member-scale__title">CRM 企业列表</h2>
        <p className="member-scale__sub" data-testid="crm-filter">
          当前筛选：{filterText}
          {lifecycle ? <code className="crm-param">lifecycle={lifecycle}</code> : null}
        </p>
        <Link to="/" className="crm-back">
          返回驾驶舱面板
        </Link>
      </header>
      {loading ? (
        <p data-testid="crm-loading">正在加载企业列表…</p>
      ) : (
        <table className="crm-table" data-testid="crm-table">
          <thead>
            <tr>
              <th>企业</th>
              <th>行业</th>
              <th>席位</th>
              <th>生命周期</th>
              <th>到期日</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} data-testid={"crm-row-" + row.id}>
                <td>{row.name}</td>
                <td>{row.industry}</td>
                <td>{row.seats}</td>
                <td>
                  <Tag size="small" variant="light">
                    {stageLabel(row.lifecycle)}
                  </Tag>
                </td>
                <td>{row.expireAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="crm-count" data-testid="crm-count">
        共 {rows.length} 家
      </p>
    </main>
  );
}
