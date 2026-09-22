import { render } from '@testing-library/react';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
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
      expect(sections[sections.length - 1]?.textContent).toContain('审批进度');
      expect(sections.filter((section) => section.querySelector('.ant-card-head-title')?.textContent === '审批进度')).toHaveLength(1);
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
});
