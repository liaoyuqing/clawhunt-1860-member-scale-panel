import { Card, Tag } from "tdesign-react";
import { describeDelta, DELTA_TONE_CLASS } from "../../../../utils/delta";
import type { KpiItem } from "../../../../types/member-scale";

export interface KpiCardsProps {
  items: readonly KpiItem[];
}

export function KpiCards({ items }: KpiCardsProps) {
  return (
    <div className="kpi-grid" data-testid="kpi-grid">
      {items.map((item) => {
        const delta = describeDelta(item.deltaPct, item.polarity);
        return (
          <div key={item.key} className="kpi-cell" data-testid={"kpi-" + item.key}>
            <Card bordered className="kpi-card">
              <div className="kpi-card__label">
                {item.label}
                {item.polarity === "negative" ? (
                  <Tag size="small" variant="light" theme="warning" className="kpi-card__tag">
                    负向指标
                  </Tag>
                ) : null}
              </div>
              <div className="kpi-card__value">
                <span className="kpi-card__number" data-testid="kpi-value">
                  {item.value}
                </span>
                <span className="kpi-card__unit">{item.unit}</span>
              </div>
              <div className="kpi-card__footer">
                <span
                  className={"delta " + DELTA_TONE_CLASS[delta.tone]}
                  data-testid="kpi-delta"
                  data-dir={delta.dir}
                  title={"环比上期 " + delta.text}
                >
                  {delta.dir === "flat" ? null : (
                    <span className={"delta__arrow delta__arrow--" + delta.dir}>{delta.arrow}</span>
                  )}
                  <span className="delta__text">{delta.text}</span>
                </span>
                <span className="kpi-card__hint">环比上期</span>
              </div>
              <p className="kpi-card__hint-line">{item.hint}</p>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
