import { Button, Skeleton } from "tdesign-react";

export function PanelLoading() {
  return (
    <section className="member-scale member-scale--loading" data-testid="panel-loading">
      <Skeleton theme="text" animation="gradient" />
      <div className="kpi-grid">
        {[0, 1, 2, 3].map((index) => (
          <div className="kpi-card kpi-card--skeleton" key={index}>
            <Skeleton theme="text" animation="gradient" />
          </div>
        ))}
      </div>
      <Skeleton theme="text" animation="gradient" />
    </section>
  );
}

export function PanelError({
  message,
  onRetry,
  retryCount,
}: {
  message: string;
  onRetry: () => void;
  retryCount: number;
}) {
  return (
    <section className="member-scale member-scale--error" data-testid="panel-error">
      <div className="panel-error__box" role="alert">
        <h3 className="panel-error__title">会员数据加载失败</h3>
        <p className="panel-error__message">{message}</p>
        <p className="panel-error__attempt" data-testid="panel-error-attempt">
          已重试 {retryCount} 次
        </p>
        <Button theme="primary" variant="outline" onClick={onRetry} data-testid="panel-retry">
          重新加载
        </Button>
      </div>
    </section>
  );
}

export function PanelEmptyHint() {
  return (
    <p className="panel-empty" data-testid="panel-empty-hint">
      当前筛选条件下没有在册会员企业：指标卡显示 0 家，状态分布条形长度均为 0，趋势折线在 0 线上。
    </p>
  );
}
