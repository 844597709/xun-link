import { Alert, Button, Card, DatePicker, Descriptions, Input, Modal, Select, Space, Table, Tag, message } from 'antd';
import type { TableColumnsType } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import type { Key } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DataTable from '../../../../components/DataTable';
import Filter, { type FilterValue } from '../../../../components/Filter';
import ListActionDrawer from '../../../../components/ListActionDrawer';
import OperationCell from '../../../../components/OperationCell';
import { getStopBatchDeductionExecutions, restoreBatchDeduction, stopBatchDeduction } from '../../../../mock';
import type { StopBatchDeductionExecutionRecord, StopBatchDeductionListParams, StopBatchDeductionRecoveryStrategy } from '../../../../types';
import { executionFilterConfigs, money, normalizeFilters, tagColor } from '../shared';

const recoveryStrategyOptions: { label: StopBatchDeductionRecoveryStrategy; value: StopBatchDeductionRecoveryStrategy }[] = [
  { label: '手动恢复', value: '手动恢复' },
  { label: '固定日期恢复', value: '固定日期恢复' },
  { label: '固定天数恢复', value: '固定天数恢复' },
  { label: '还款日恢复', value: '还款日恢复' },
];

type ConfirmAction = 'stop' | 'restore';

function statusTag(value: string) {
  return <Tag color={tagColor(value)}>{value}</Tag>;
}

function recordDescriptions(record: StopBatchDeductionExecutionRecord) {
  return <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small" items={[
    { key: 'institutionCode', label: '机构号', children: record.institutionCode },
    { key: 'institutionName', label: '机构名称', children: record.institutionName },
    { key: 'customerNo', label: '客户号', children: record.customerNo },
    { key: 'customerName', label: '客户名称', children: record.customerName },
    { key: 'loanNo', label: '借据号', children: record.loanNo },
    { key: 'loanAmount', label: '借据金额', children: money(record.loanAmount) },
    { key: 'loanBalance', label: '借据余额', children: money(record.loanBalance) },
    { key: 'loanStatus', label: '借据状态', children: statusTag(record.loanStatus) },
    { key: 'fiveLevelCategory', label: '五级分类', children: statusTag(record.fiveLevelCategory) },
    { key: 'impairmentFlag', label: '减值标志', children: statusTag(record.impairmentFlag) },
    { key: 'writeOffFlag', label: '核销标志', children: statusTag(record.writeOffFlag) },
    { key: 'interestStopFlag', label: '停息标志', children: statusTag(record.interestStopFlag) },
    { key: 'stopDeductionFlag', label: '停扣标志', children: statusTag(record.stopDeductionFlag) },
    { key: 'coreProduct', label: '核心产品', children: record.coreProduct },
  ]} />;
}

export default function StopBatchDeductionExecution() {
  const [data, setData] = useState<StopBatchDeductionExecutionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState<Record<string, unknown>>({});
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [viewRecord, setViewRecord] = useState<StopBatchDeductionExecutionRecord | null>(null);
  const [confirmIds, setConfirmIds] = useState<number[] | null>(null);
  const [confirmRecords, setConfirmRecords] = useState<StopBatchDeductionExecutionRecord[]>([]);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [recoveryStrategy, setRecoveryStrategy] = useState<StopBatchDeductionRecoveryStrategy>('手动恢复');
  const [recoveryDate, setRecoveryDate] = useState<Dayjs | null>(null);
  const [recoveryDays, setRecoveryDays] = useState('');
  const requestId = useRef(0);

  const loadData = useCallback(async (page: number, pageSize: number, nextQuery: Record<string, unknown>) => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError('');
    try {
      const response = await getStopBatchDeductionExecutions({ page, pageSize, ...nextQuery } as StopBatchDeductionListParams);
      if (currentRequest !== requestId.current) return;
      setData(response.data.list);
      setPagination({ current: response.data.page, pageSize: response.data.pagesize, total: response.data.total });
    } catch {
      if (currentRequest === requestId.current) {
        setError('数据加载失败，请重试');
        message.error('数据加载失败');
      }
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(1, pagination.pageSize, {}); }, [loadData]);

  const handleSearch = (values: Record<string, FilterValue>) => {
    const normalized = normalizeFilters(values);
    setQuery(normalized);
    setSelectedRowKeys([]);
    setPagination((current) => ({ ...current, current: 1 }));
    void loadData(1, pagination.pageSize, normalized);
  };

  const handlePageChange = (page: number, pageSize: number) => {
    setPagination((current) => ({ ...current, current: page, pageSize }));
    setSelectedRowKeys([]);
    void loadData(page, pageSize, query);
  };

  const selectedRecords = useMemo(() => data.filter((record) => selectedRowKeys.includes(record.id)), [data, selectedRowKeys]);
  const selectedAction = useMemo<ConfirmAction | null>(() => {
    if (!selectedRecords.length) return null;
    const allStopped = selectedRecords.every((record) => record.stopDeductionFlag === '是');
    const allNotStopped = selectedRecords.every((record) => record.stopDeductionFlag === '否');
    return allStopped ? 'restore' : allNotStopped ? 'stop' : null;
  }, [selectedRecords]);
  const openConfirm = (records = selectedRecords, action?: ConfirmAction) => {
    if (!records.length) {
      message.warning('请先选择需要操作的借据');
      return;
    }
    const allStopped = records.every((record) => record.stopDeductionFlag === '是');
    const allNotStopped = records.every((record) => record.stopDeductionFlag === '否');
    const nextAction = action ?? (allStopped ? 'restore' : allNotStopped ? 'stop' : null);
    if (!nextAction || (nextAction === 'stop' && !allNotStopped) || (nextAction === 'restore' && !allStopped)) {
      message.warning('请选择停扣状态一致的借据后再批量操作');
      return;
    }
    setConfirmIds(records.map((record) => record.id));
    setConfirmRecords(records);
    setConfirmAction(nextAction);
  };

  const closeConfirm = (force = false) => {
    if (submitting && !force) return;
    setConfirmIds(null);
    setConfirmRecords([]);
    setConfirmAction(null);
  };

  const resetRecoveryForm = () => {
    setRecoveryStrategy('手动恢复');
    setRecoveryDate(null);
    setRecoveryDays('');
  };

  const handleConfirm = async () => {
    if (!confirmIds?.length || !confirmAction || submitting) return;
    if (confirmAction === 'stop') {
      const today = dayjs().startOf('day');
      if (recoveryStrategy === '固定日期恢复' && (!recoveryDate || recoveryDate.isBefore(today, 'day'))) {
        message.error('请选择当日或之后的恢复批扣日期');
        return;
      }
      if (recoveryStrategy === '固定天数恢复' && !/^[1-9]\d*$/.test(recoveryDays)) {
        message.error('恢复批扣天数必须为正整数');
        return;
      }
    }
    setSubmitting(true);
    try {
      if (confirmAction === 'restore') {
        const response = await restoreBatchDeduction({ ids: confirmIds });
        if (response.code !== 0 || !response.data) {
          message.error(response.message);
          return;
        }
        const { successIds, failedIds } = response.data;
        if (failedIds.length) message.warning(`成功 ${successIds.length} 笔，失败 ${failedIds.length} 笔，请重试失败借据`);
        else message.success(response.message);
        setSelectedRowKeys((current) => current.filter((key) => !successIds.includes(Number(key))));
      } else {
        const submitParams = {
          ids: confirmIds,
          recoveryStrategy,
          ...(recoveryStrategy === '固定日期恢复' && recoveryDate ? { recoveryDate: recoveryDate.format('YYYY-MM-DD') } : {}),
          ...(recoveryStrategy === '固定天数恢复' ? { recoveryDays: Number(recoveryDays) } : {}),
        };
        const response = await stopBatchDeduction(submitParams);
        if (response.code !== 0 || !response.data) {
          message.error(response.message);
          return;
        }
        const { successIds, failedIds } = response.data;
        if (failedIds.length) message.warning(`成功 ${successIds.length} 笔，失败 ${failedIds.length} 笔，请重试失败借据`);
        else message.success(response.message);
        setSelectedRowKeys((current) => current.filter((key) => !successIds.includes(Number(key))));
      }
      closeConfirm(true);
      await loadData(pagination.current, pagination.pageSize, query);
    } catch {
      message.error(confirmAction === 'restore' ? '批量恢复失败，请稍后重试' : '批量停扣失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmColumns: TableColumnsType<StopBatchDeductionExecutionRecord> = [
    { title: '机构号', dataIndex: 'institutionCode', width: 90 },
    { title: '机构名称', dataIndex: 'institutionName', width: 110 },
    { title: '客户号', dataIndex: 'customerNo', width: 105 },
    { title: '客户名称', dataIndex: 'customerName', width: 95 },
    { title: '借据号', dataIndex: 'loanNo', width: 145 },
    { title: '借据金额', dataIndex: 'loanAmount', width: 120, render: money },
    { title: '借据余额', dataIndex: 'loanBalance', width: 120, render: money },
    { title: '借据状态', dataIndex: 'loanStatus', width: 90, render: statusTag },
  ];

  const columns: TableColumnsType<StopBatchDeductionExecutionRecord> = [
    { title: '机构号', dataIndex: 'institutionCode', width: 90 },
    { title: '机构名称', dataIndex: 'institutionName', width: 110 },
    { title: '客户号', dataIndex: 'customerNo', width: 105 },
    { title: '客户名称', dataIndex: 'customerName', width: 95 },
    { title: '借据号', dataIndex: 'loanNo', width: 145 },
    { title: '借据金额', dataIndex: 'loanAmount', width: 120, render: money },
    { title: '借据余额', dataIndex: 'loanBalance', width: 120, render: money },
    { title: '借据状态', dataIndex: 'loanStatus', width: 90, render: statusTag },
    { title: '五级分类', dataIndex: 'fiveLevelCategory', width: 90, render: statusTag },
    { title: '减值标志', dataIndex: 'impairmentFlag', width: 90, render: statusTag },
    { title: '核销标志', dataIndex: 'writeOffFlag', width: 90, render: statusTag },
    { title: '停息标志', dataIndex: 'interestStopFlag', width: 90, render: statusTag },
    { title: '停扣标志', dataIndex: 'stopDeductionFlag', width: 90, render: statusTag },
    {
      title: '操作',
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <OperationCell
          items={[
            { key: 'view', label: '查看' },
            record.stopDeductionFlag === '是'
              ? { key: 'restore', label: '恢复' }
              : { key: 'stop', label: '停扣' },
          ]}
          onAction={(key) => {
            if (key === 'view') setViewRecord(record);
            if (key === 'stop') openConfirm([record], 'stop');
            if (key === 'restore') openConfirm([record], 'restore');
          }}
        />
      ),
    },
  ];

  return <div className="page-container stop-batch-deduction-page">
    <Card className="filter-card"><Filter configs={executionFilterConfigs} onSearch={handleSearch} /></Card>
    {error && <Alert type="error" showIcon message={error} action={<Button size="small" onClick={() => void loadData(pagination.current, pagination.pageSize, query)}>重试</Button>} className="page-alert" />}
    <Card className="table-card">
      <div className="table-toolbar"><Space><Button type="primary" disabled={!selectedRecords.length || selectedAction === 'restore'} onClick={() => openConfirm(selectedRecords, 'stop')}>批量停扣</Button><Button disabled={!selectedRecords.length || selectedAction === 'stop'} onClick={() => openConfirm(selectedRecords, 'restore')}>批量恢复</Button>{selectedRecords.length > 0 && <span>已选择 {selectedRecords.length} 笔</span>}</Space></div>
      <DataTable columns={columns} dataSource={data} loading={loading} pagination={pagination} onPageChange={handlePageChange} rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }} />
    </Card>
    <ListActionDrawer open={viewRecord !== null} title="批扣操作执行 - 查看" onClose={() => setViewRecord(null)} width="min(760px, 100vw)" footer={<Button type="primary" onClick={() => setViewRecord(null)}>关闭</Button>}>
      {viewRecord && recordDescriptions(viewRecord)}
    </ListActionDrawer>
    <Modal title={confirmAction === 'restore' ? '确认批量恢复' : '确认批量停扣'} open={confirmIds !== null} onCancel={() => closeConfirm()} width="min(1120px, 100vw)" maskClosable={!submitting} closable={!submitting} confirmLoading={submitting} okText={confirmAction === 'restore' ? '确认恢复' : '确认停扣'} cancelText="取消" onOk={() => void handleConfirm()}>
      <p>本次将对已选中的 <strong>{confirmIds?.length ?? 0}</strong> 笔借据执行{confirmAction === 'restore' ? '恢复批扣' : '停止批扣'}。</p>
      <Table<StopBatchDeductionExecutionRecord> rowKey="id" size="small" bordered columns={confirmColumns} dataSource={confirmRecords} pagination={false} scroll={{ x: 'max-content', y: 280 }} />
      {confirmAction === 'stop' && <>
        <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
          <strong>恢复批扣策略</strong>
          <Select aria-label="恢复批扣策略" value={recoveryStrategy} options={recoveryStrategyOptions} onChange={(value: StopBatchDeductionRecoveryStrategy) => {
            setRecoveryStrategy(value);
            if (value !== '固定日期恢复') setRecoveryDate(null);
            if (value !== '固定天数恢复') setRecoveryDays('');
          }} style={{ width: 180 }} disabled={submitting} />
          {recoveryStrategy === '固定日期恢复' && <DatePicker aria-label="恢复批扣日期" value={recoveryDate} minDate={dayjs().startOf('day')} disabledDate={(current) => current.isBefore(dayjs().startOf('day'), 'day')} onChange={setRecoveryDate} placeholder="请选择恢复批扣日期" disabled={submitting} />}
          {recoveryStrategy === '固定天数恢复' && <Input aria-label="恢复批扣天数" value={recoveryDays} inputMode="numeric" placeholder="请输入正整数" onChange={(event) => { if (/^\d*$/.test(event.target.value)) setRecoveryDays(event.target.value); }} disabled={submitting} style={{ width: 180 }} />}
        </div>
        <p style={{ marginTop: 12, color: '#8c8c8c' }}>确认后将更新借据停扣标志，已停止批扣的借据不可重复操作。</p>
      </>}
      {confirmAction === 'restore' && <p style={{ marginTop: 12, color: '#8c8c8c' }}>确认恢复后，借据将在批扣操作执行列表重新显示“停扣”操作。</p>}
    </Modal>
  </div>;
}
