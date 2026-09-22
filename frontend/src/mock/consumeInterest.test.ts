import { describe, expect, it } from 'vitest';
import {
  cancelConsumeInterestApplication,
  getConsumeInterestApplications,
  getConsumeInterestClientData,
  getInterestRecords,
  signInterestAgreement,
  submitConsumeInterestApplication,
} from './consumeInterest';

describe('消费贴息客户端 Mock 服务', () => {
  it('返回客户、三种首页所需配置、贷款和业务记录', async () => {
    const response = await getConsumeInterestClientData();
    expect(response.code).toBe(0);
    expect(response.data.customer.nickname).toBe('张先生');
    expect(response.data.loans.some((item) => item.selectable)).toBe(true);
    expect(response.data.loans.some((item) => !item.selectable)).toBe(true);
    expect(response.data.applications.some((item) => item.source === 'self')).toBe(true);
    expect(response.data.applications.some((item) => item.source === 'system')).toBe(true);
    expect(response.data.config.maxProofCount).toBe(6);
  });

  it('支持按状态和日期筛选核对记录及贴息记录', async () => {
    const reviewing = await getConsumeInterestApplications({ status: 'reviewing' });
    expect(reviewing.data.list.every((item) => item.status === 'reviewing')).toBe(true);
    const recent = await getInterestRecords({ from: '2026-06-01' });
    expect(recent.data.total).toBe(2);
    expect(recent.data.list.every((item) => item.date >= '2026-06-01')).toBe(true);
  });

  it('签署协议后更新为已签署状态', async () => {
    const signed = await signInterestAgreement();
    expect(signed.code).toBe(0);
    expect(signed.data.status).toBe('effective');
    const client = await getConsumeInterestClientData();
    expect(client.data.home.agreementStatus).toBe('signed');
  });

  it('提交自主申请生成审核中记录并支持取消', async () => {
    const submitted = await submitConsumeInterestApplication({ account: '招商银行（尾号 6688）', consumeDate: '2026-09-07', transactionNo: 'TX-TEST', purpose: '家居消费', loanIds: ['loan-1'], description: '测试申请', vouchers: [{ id: 'test-invoice', type: 'invoice', imageUrl: 'data:image/png;base64,test', fileName: 'test.png', amount: 1000 }] });
    expect(submitted.data.application.status).toBe('reviewing');
    const cancelled = await cancelConsumeInterestApplication(submitted.data.application.id);
    expect(cancelled.data.status).toBe('cancelled');
    const list = await getConsumeInterestApplications({ status: 'cancelled' });
    expect(list.data.list.some((item) => item.id === submitted.data.application.id)).toBe(true);
  });
});
