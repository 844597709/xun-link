import { render } from '@testing-library/react';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import type { BatchDeductionDetail } from '../types';
import ApprovalDetailDrawer from '../components/ApprovalDetailDrawer';
import { approvalRecords, claimApproval, getApprovalRecords } from './approval';

describe('审批管理待审列表 Mock 服务', () => {
  it('返回分页数据且前三条覆盖指定详情类型', async () => {
    const response = await getApprovalRecords({ page: 1, pageSize: 10 });
    expect(response.code).toBe(0);
    expect(response.data.total).toBe(24);
    expect(response.data.list.slice(0, 3).map((item) => item.detailType)).toEqual([
      'product-maintenance', 'manual-repayment', 'debt-restructuring',
    ]);
  });

  it('支持类型、案件子类型、发起人和审批状态组合筛选', async () => {
    const response = await getApprovalRecords({ page: 1, pageSize: 10, type: '营运管理', caseSubtype: '手动还款审批', initiator: '李明', approvalStatus: '已通过' });
    expect(response.data.list.every((item) => item.type === '营运管理' && item.caseSubtype === '手动还款审批' && item.initiator.includes('李明') && item.approvalStatus === '已通过')).toBe(true);
  });

  it('认领后更新审批人和审批时间轴', async () => {
    const response = await claimApproval(1);
    expect(response.data.approver).toBe('当前用户-审核专员');
    expect(response.data.timeline.find((item) => item.title === '审批认领')?.status).toBe('已认领');
  });
  it('四类详情均将审批进度渲染为最后一个详情模块', () => {
    const detailTypes = ['product-maintenance', 'manual-repayment', 'debt-restructuring', 'agile-restructuring'] as const;
    const { rerender, unmount } = render(createElement(ApprovalDetailDrawer, { record: approvalRecords[0], open: true, onClose: () => undefined, onClaim: () => undefined }));

    detailTypes.forEach((detailType) => {
      const record = approvalRecords.find((item) => item.detailType === detailType);
      expect(record).toBeDefined();
      rerender(createElement(ApprovalDetailDrawer, { record, open: true, onClose: () => undefined, onClaim: () => undefined }));
      const drawers = document.querySelectorAll('.approval-detail-drawer');
      const drawer = drawers.item(drawers.length - 1);
      const sections = Array.from(drawer?.querySelectorAll('.approval-detail-scroll > .approval-detail-section') ?? []);
      expect(sections).toHaveLength(5);
      expect(sections[0]?.querySelector('.ant-card-head')).toBeNull();
      expect(sections[1]?.querySelector('.ant-card-head')).toBeNull();
      expect(sections[2]?.querySelector('.ant-card-head')).toBeNull();
      expect(sections[3]?.querySelector('.ant-card-head-title')?.textContent).toBe('详情内容');
      expect(sections[4]?.querySelector('.ant-card-head-title')?.textContent).toBe('审批进程');
      expect(sections[4]?.textContent).toContain('审批进程');
      expect(sections.filter((section) => section.querySelector('.ant-card-head-title')?.textContent === '审批进程')).toHaveLength(1);
    });

    unmount();
  });

  it('手动还款详情按应还、实还顺序包含两张汇总表', () => {
    const record = approvalRecords.find((item) => item.detailType === 'manual-repayment');
    expect(record).toBeDefined();
    const { unmount } = render(createElement(ApprovalDetailDrawer, { record, open: true, onClose: () => undefined, onClaim: () => undefined }));
    const summaryBlocks = Array.from(document.querySelectorAll('.approval-summary-block'));

    expect(summaryBlocks).toHaveLength(2);
    expect(summaryBlocks[0].textContent).toContain('应还试算汇总');
    expect(summaryBlocks[1].textContent).toContain('实还试算汇总');

    unmount();
  });

  it('第3、4行案件子类型和灵动重组详情内容符合新规则', () => {
    const debtRecord = approvalRecords[2];
    const agileRecord = approvalRecords[3];
    expect(debtRecord.caseSubtype).toBe('债务重组');
    expect(debtRecord.detailType).toBe('debt-restructuring');
    expect(agileRecord.caseSubtype).toBe('灵动重组');
    expect(agileRecord.detailType).toBe('agile-restructuring');

    const { rerender, unmount } = render(createElement(ApprovalDetailDrawer, { record: agileRecord, open: true, onClose: () => undefined, onClaim: () => undefined }));
    const drawer = document.querySelector('.approval-detail-drawer');
    const sections = Array.from(drawer?.querySelectorAll('.approval-detail-scroll > .approval-detail-section') ?? []);
    const detailContent = sections[3];
    const text = detailContent?.textContent ?? '';
    expect(detailContent?.querySelector('.approval-state-compare')).toBeNull();
    expect(detailContent?.querySelector('.approval-reason')).toBeNull();
    expect(text).not.toContain('原状态');
    expect(text).not.toContain('新状态');
    expect(text).toContain('新还款方式');
    expect(text).toContain('按月付息按计划还本');
    expect(text).toContain('新复息利息');
    expect(text).toContain('失效日期');
    expect(text).toContain('申请原因');
    expect(text).toContain('附件材料');
    expect(text).toContain('还款方案');
    expect(text.indexOf('新复息利息')).toBeLessThan(text.indexOf('失效日期'));
    expect(text.indexOf('失效日期')).toBeLessThan(text.indexOf('申请原因'));
    expect(text.indexOf('申请原因')).toBeLessThan(text.indexOf('附件材料'));
    expect(detailContent?.querySelector('.approval-scheme-title')).toBeNull();
    expect(text).not.toContain('已有方案-方案A');
    expect(detailContent?.querySelector('.approval-table-scroll')).not.toBeNull();
    const detailTitles = Array.from(detailContent?.querySelectorAll(':scope > .ant-card-body > .approval-detail-section .ant-card-head-title') ?? []).map((node) => node.textContent);
    expect(detailTitles).toEqual(['基础信息', '调整信息', '还款方案', '新贷款计划']);
    rerender(createElement(ApprovalDetailDrawer, { record: debtRecord, open: true, onClose: () => undefined, onClaim: () => undefined }));
    expect(document.querySelector('.approval-detail-drawer')?.textContent).toContain('已有方案-方案A');
    unmount();
  });

  it('第6、7条为内管审批批扣操作并展示对应详情', () => {
    const stopRecord = approvalRecords[5];
    const restoreRecord = approvalRecords[6];
    expect(stopRecord.type).toBe('内管审批');
    expect(stopRecord.caseSubtype).toBe('批扣操作');
    expect(stopRecord.detailType).toBe('batch-deduction');
    expect((stopRecord.detail as BatchDeductionDetail).recovery?.strategy).toBe('固定天数后恢复');
    expect(restoreRecord.type).toBe('内管审批');
    expect(restoreRecord.caseSubtype).toBe('批扣操作');
    expect(restoreRecord.detailType).toBe('batch-deduction');

    const { rerender, unmount } = render(createElement(ApprovalDetailDrawer, { record: stopRecord, open: true, onClose: () => undefined, onClaim: () => undefined }));
    let drawer = document.querySelector('.approval-detail-drawer');
    let titles = Array.from(drawer?.querySelectorAll('.ant-card-head-title') ?? []).map((node) => node.textContent);
    expect(titles).toEqual(['详情内容', '基础信息', '恢复批扣信息', '借据列表', '审批进程']);
    expect(drawer?.textContent).toContain('停止批扣');
    expect(drawer?.textContent).toContain('恢复批扣策略');

    rerender(createElement(ApprovalDetailDrawer, { record: restoreRecord, open: true, onClose: () => undefined, onClaim: () => undefined }));
    drawer = document.querySelector('.approval-detail-drawer');
    titles = Array.from(drawer?.querySelectorAll('.ant-card-head-title') ?? []).map((node) => node.textContent);
    expect(titles).toEqual(['详情内容', '基础信息', '借据列表', '审批进程']);
    expect(drawer?.textContent).toContain('恢复批扣');
    expect(drawer?.textContent).not.toContain('恢复批扣策略');
    expect(Array.from(drawer?.querySelectorAll('th') ?? []).map((node) => node.textContent)).toEqual([
      '机构号', '机构名称', '客户号', '客户名称', '借据号', '借据金额', '借据余额', '借据状态',
    ]);
    unmount();
  });
});
