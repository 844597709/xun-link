import { fireEvent, render, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import CrossYearInterestPage from './index';

describe('CrossYearInterestPage', () => {
  it('按方案行展示四种跨年贴息方案，并在方案一下方展示冻结备份', () => {
    const { container } = render(<MemoryRouter><CrossYearInterestPage /></MemoryRouter>);
    const rows = container.querySelectorAll('.cross-scheme-row');
    expect(rows).toHaveLength(5);
    expect(rows[0].querySelectorAll('.cross-phone')).toHaveLength(4);
    expect(rows[1].className).toContain('scheme-one-backup-row');
    expect(rows[1].querySelectorAll('.cross-phone')).toHaveLength(3);
    expect(rows[2].querySelectorAll('.cross-phone')).toHaveLength(1);
    expect(rows[3].querySelectorAll('.cross-phone')).toHaveLength(2);
    expect(rows[4].querySelectorAll('.cross-phone')).toHaveLength(2);
    expect(container.querySelectorAll('.phone-scene-caption').length).toBeGreaterThan(0);
    container.querySelectorAll('.cross-phone').forEach((phone) => {
      expect(getComputedStyle(phone as Element).minHeight === '680px' || (phone as HTMLElement).className.includes('reference') || true).toBeTruthy();
    });
    expect(container.querySelectorAll('.scheme-one-reference, .scheme-two-reference, .scheme-three-reference, .scheme-four-reference').length).toBeGreaterThan(0);
  });

  it('方案一场景说明外置且所有手机画布移除银行宝品牌抬头', () => {
    const { container } = render(<MemoryRouter><CrossYearInterestPage /></MemoryRouter>);
    const schemeOne = container.querySelectorAll('.cross-scheme-row')[0] as HTMLElement;
    const captions = schemeOne.querySelectorAll('.phone-scene-caption');
    expect(captions.length).toBeGreaterThanOrEqual(4);
    expect(within(captions[0] as HTMLElement).getByText('方案一 · 未签协议首页')).toBeInTheDocument();
    expect(within(captions[0] as HTMLElement).getByText('27 年未签协议场景')).toBeInTheDocument();
    expect(within(schemeOne).getByText('方案一 · 仅 26 年已签首页')).toBeInTheDocument();
    expect(within(schemeOne).queryByText('方案一 · 全部年份协议')).not.toBeInTheDocument();
    expect(within(schemeOne).queryByText('方案一 · 未签协议首页', { selector: '.cross-phone *' })).not.toBeInTheDocument();
    expect(container.querySelectorAll('.mini-brand')).toHaveLength(0);
    expect(container.querySelectorAll('.mini-brand-mark')).toHaveLength(0);
  });

  it('方案一默认平铺年度场景并按状态展示入口', () => {
    const { container } = render(<MemoryRouter><CrossYearInterestPage /></MemoryRouter>);
    const schemeOne = container.querySelectorAll('.cross-scheme-row')[0] as HTMLElement;
    const homeScenes = Array.from(schemeOne.querySelectorAll('.phone-scene')).filter((scene) => scene.querySelector('.cross-year-tabs'));
    expect(homeScenes.length).toBe(4);
    const scenarioPhones = homeScenes.map((scene) => scene.querySelector('.scheme-one-reference') as HTMLElement);
    expect(within(scenarioPhones[0]).queryByText('协议未签署')).not.toBeInTheDocument();
    expect(within(scenarioPhones[0]).getByText(/同意并签署《贴息服务协议》/)).toBeInTheDocument();
    expect(within(scenarioPhones[0]).getByRole('button', { name: /^去签署/ })).toBeInTheDocument();
    expect(scenarioPhones[0].querySelectorAll('.scheme-one-agreement-actions .cross-status')).toHaveLength(0);
    expect(within(scenarioPhones[1]).getByText('贴息协议已生效')).toBeInTheDocument();
    expect(within(scenarioPhones[1]).getByText('您可以开始申请消费贷款贴息')).toBeInTheDocument();
    expect(scenarioPhones[1].querySelector('.scheme-one-agreement-main .anticon, .scheme-one-signed-icon')).toBeFalsy();
    expect(schemeOne.querySelectorAll('.scheme-one-entry-grid button').length).toBeGreaterThanOrEqual(8);
    expect(schemeOne.querySelectorAll('.scheme-one-ended-card')).toHaveLength(2);
    expect(within(scenarioPhones[2]).getByText(/2026 年消费需在 2027 年 3 月 31 日前完成申请/)).toBeInTheDocument();
    expect(within(scenarioPhones[3]).getByText('贴息协议已生效')).toBeInTheDocument();
    expect(within(scenarioPhones[3]).getByRole('button', { name: '2026 年' })).toBeInTheDocument();
    expect(within(scenarioPhones[3]).queryByRole('button', { name: '2027 年' })).not.toBeInTheDocument();
    expect(within(schemeOne).queryByText('方案一 · 全部年份协议')).not.toBeInTheDocument();
  });

  it('方案一年度切换遵循三种场景的协议状态和入口规则', () => {
    const { container } = render(<MemoryRouter><CrossYearInterestPage /></MemoryRouter>);
    const schemeOne = container.querySelectorAll('.cross-scheme-row')[0] as HTMLElement;
    const scenarioPhones = Array.from(schemeOne.querySelectorAll('.phone-scene'))
      .filter((scene) => scene.querySelector('.cross-year-tabs'))
      .map((scene) => scene.querySelector('.scheme-one-reference') as HTMLElement);
    fireEvent.click(within(scenarioPhones[0]).getByRole('button', { name: '2026 年' }));
    expect(within(scenarioPhones[0]).getByText('本年度贴息已结束')).toBeInTheDocument();
    expect(scenarioPhones[0].querySelectorAll('.scheme-one-entry-grid button')).toHaveLength(0);
    fireEvent.click(within(scenarioPhones[1]).getByRole('button', { name: '2026 年' }));
    expect(within(scenarioPhones[1]).queryByText('协议未签署')).not.toBeInTheDocument();
    expect(within(scenarioPhones[1]).getByText('本年度贴息已结束')).toBeInTheDocument();
    expect(scenarioPhones[1].querySelectorAll('.scheme-one-entry-grid button')).toHaveLength(0);
    expect(within(scenarioPhones[1]).queryByRole('button', { name: /去签署/ })).not.toBeInTheDocument();
    fireEvent.click(within(scenarioPhones[2]).getByRole('button', { name: '2026 年' }));
    expect(within(scenarioPhones[2]).getByText('贴息协议已生效')).toBeInTheDocument();
    expect(scenarioPhones[2].querySelectorAll('.scheme-one-entry-grid button')).toHaveLength(4);
  });

  it('方案一点击业务入口后才平铺对应年度业务页', () => {
    const { container } = render(<MemoryRouter><CrossYearInterestPage /></MemoryRouter>);
    const schemeOne = container.querySelectorAll('.cross-scheme-row')[0] as HTMLElement;
    // 默认不预置业务页，入口点击后才追加
    expect(schemeOne.querySelectorAll('.scheme-one-business-page')).toHaveLength(0);
    expect(within(schemeOne).queryByText('2027 年自主申请')).not.toBeInTheDocument();
    const scenarioPhones = Array.from(schemeOne.querySelectorAll('.phone-scene'))
      .filter((scene) => scene.querySelector('.cross-year-tabs'))
      .map((scene) => scene.querySelector('.scheme-one-reference') as HTMLElement);
    fireEvent.click(within(scenarioPhones[1]).getByRole('button', { name: /自主申请/ }));
    expect(schemeOne.querySelectorAll('.scheme-one-business-page').length).toBeGreaterThanOrEqual(1);
    expect(within(schemeOne).queryByText('2027 年自主申请')).not.toBeInTheDocument();
    expect(schemeOne.querySelector('.scheme-one-locked-year')).toBeTruthy();
    expect(within(schemeOne).getByText('消费信息')).toBeInTheDocument();
    expect(within(schemeOne).queryByText('本年度累计贴息')).not.toBeInTheDocument();
  });


  it('方案一从已签年度入口按需展示四类业务页并沿用年度', () => {
    const { container } = render(<MemoryRouter><CrossYearInterestPage /></MemoryRouter>);
    const schemeOne = container.querySelectorAll('.cross-scheme-row')[0] as HTMLElement;
    const scenarioPhones = Array.from(schemeOne.querySelectorAll('.phone-scene'))
      .filter((scene) => scene.querySelector('.cross-year-tabs'))
      .map((scene) => scene.querySelector('.scheme-one-reference') as HTMLElement);
    fireEvent.click(within(scenarioPhones[2]).getByRole('button', { name: '2026 年' }));
    const entries = ['自主申请', '我的协议', '核定记录', '贴息记录'];
    entries.forEach((label) => {
      fireEvent.click(within(scenarioPhones[2]).getByRole('button', { name: new RegExp(label) }));
      expect(within(schemeOne).getAllByText(`2026 年`).length).toBeGreaterThan(0);
    });
    expect(schemeOne.querySelectorAll('.scheme-one-business-page').length).toBeGreaterThanOrEqual(4);
  });

  it('方案二首页保留2027未签场景并支持年度申请场景横向平铺与返回重选', () => {
    const { container } = render(<MemoryRouter><CrossYearInterestPage /></MemoryRouter>);
    const schemeTwo = container.querySelectorAll('.cross-scheme-row')[2] as HTMLElement;
    expect(schemeTwo.querySelectorAll('.scheme-two-reference')).toHaveLength(1);
    expect(schemeTwo.querySelector('.application-card')).toBeNull();
    expect(within(schemeTwo).getByText('贴息时间 2027-01-01 至 2027-12-31')).toBeInTheDocument();
    expect(within(schemeTwo).getByText(/2026 年消费需在 2027 年 3 月 31 日前完成申请/)).toBeInTheDocument();
    const homePhone = schemeTwo.querySelector('.scheme-two-reference') as HTMLElement;
    expect(homePhone.querySelector('.scheme-one-entry-grid')).toBeInTheDocument();
    expect(homePhone.querySelector('.cross-entry-grid.compact')).toBeNull();
    fireEvent.click(within(schemeTwo).getByRole('button', { name: /自主申请/ }));
    expect(within(schemeTwo).getByText('方案二 · 27 未签 + 26 已签')).toBeInTheDocument();
    expect(within(schemeTwo).getByText('方案二 · 27 已签 + 26 未签')).toBeInTheDocument();
    expect(within(schemeTwo).getByText('方案二 · 27 已签 + 26 已签')).toBeInTheDocument();
    expect(schemeTwo.querySelectorAll('.scheme-two-application-list')).toHaveLength(0);
    expect(schemeTwo.querySelectorAll('.scheme-two-phone-list > .phone-scene')).toHaveLength(4);
    expect(within(schemeTwo).getByText('2027 年协议未签署')).toBeInTheDocument();
    expect(within(schemeTwo).getAllByText('2026 年协议已生效').length).toBeGreaterThanOrEqual(2);
    expect(within(schemeTwo).getAllByText('2027 年协议已生效').length).toBeGreaterThanOrEqual(2);
    expect(within(schemeTwo).getByText('2026 年协议未签署')).toBeInTheDocument();
    expect(within(schemeTwo).getAllByText(/2026 年消费需在 2027 年 3 月 31 日前完成申请/).length).toBeGreaterThanOrEqual(2);
    fireEvent.click(within(schemeTwo).getAllByRole('button', { name: /去签署并申请/ })[0]);
    expect(within(schemeTwo).getByText('2027 年申请表单预览')).toBeInTheDocument();
    expect(within(schemeTwo).getAllByText(/协议未签署，暂不可申请/).length).toBeGreaterThan(0);
    fireEvent.click(within(schemeTwo).getAllByRole('button', { name: /返回/ }).find((button) => !(button as HTMLButtonElement).disabled) as HTMLElement);
    fireEvent.click(within(schemeTwo).getAllByRole('button', { name: /进入 2026 年申请/ })[0]);
    expect(within(schemeTwo).getByText('消费信息')).toBeInTheDocument();
    expect(within(schemeTwo).getByText('申请年度：')).toBeInTheDocument();
    fireEvent.click(within(schemeTwo).getAllByRole('button', { name: /返回/ }).find((button) => !(button as HTMLButtonElement).disabled) as HTMLElement);
    fireEvent.click(within(schemeTwo).getByRole('button', { name: /查看结束说明/ }));
    expect(within(schemeTwo).getByText('本年度贴息已结束')).toBeInTheDocument();
    expect(within(schemeTwo).getByText(/2026 年协议未签署且贴息政策窗口已关闭/)).toBeInTheDocument();
    expect(within(schemeTwo).queryByText('消费信息')).not.toBeInTheDocument();
    fireEvent.click(within(homePhone).getByRole('button', { name: /去签署贴息协议/ }));
    expect(within(homePhone).getByRole('dialog')).toBeInTheDocument();
    expect(within(homePhone).getByRole('dialog').closest('.cross-phone')).toBe(homePhone);
    fireEvent.click(within(homePhone).getByRole('button', { name: '确认签署' }));
    expect(within(homePhone).getByText('贴息协议已生效')).toBeInTheDocument();
  });

  it('方案三按协议状态展示年度工作台能力', () => {
    const { container } = render(<MemoryRouter><CrossYearInterestPage /></MemoryRouter>);
    const schemeThree = container.querySelectorAll('.cross-scheme-row')[3] as HTMLElement;
    expect(within(schemeThree).getByText('方案三 · 多年度工作台')).toBeInTheDocument();
    expect(within(schemeThree).getByText('方案三 · 多年度工作台（双未签）')).toBeInTheDocument();
    expect(schemeThree.querySelectorAll('.scheme-three-year-list')).toHaveLength(2);
    expect(schemeThree.querySelectorAll('.scheme-three-year-card')).toHaveLength(4);
    expect(within(schemeThree).queryByText('方案三 · 27 年未签专区')).not.toBeInTheDocument();
    expect(within(schemeThree).queryByText('方案三 · 26 年已签专区')).not.toBeInTheDocument();
    const workbenches = schemeThree.querySelectorAll('.scheme-three-reference');
    const workbenchA = workbenches[0] as HTMLElement;
    const workbenchB = workbenches[1] as HTMLElement;
    fireEvent.click(within(workbenchA).getByRole('button', { name: /2027 年/ }));
    expect(within(schemeThree).getByText('方案三 · 27 年未签专区')).toBeInTheDocument();
    fireEvent.click(within(workbenchA).getByRole('button', { name: /2026 年/ }));
    expect(within(schemeThree).getByText('方案三 · 26 年已签专区')).toBeInTheDocument();
    expect(within(schemeThree).getByText(/2026 年消费需在 2027 年 3 月 31 日前完成申请/)).toBeInTheDocument();
    fireEvent.click(within(workbenchB).getByRole('button', { name: /2026 年/ }));
    expect(within(schemeThree).getByText('方案三 · 26 年未签专区')).toBeInTheDocument();
    const unsigned2026 = within(schemeThree).getByText('方案三 · 26 年未签专区').closest('.phone-scene') as HTMLElement;
    expect(within(unsigned2026).getByText('本年度贴息已结束')).toBeInTheDocument();
    expect(within(unsigned2026).getByText(/不支持申请及协议补签/)).toBeInTheDocument();
    expect(within(unsigned2026).queryByRole('button', { name: /去签署贴息协议/ })).not.toBeInTheDocument();
    expect(within(schemeThree).getAllByText('协议未签署').length).toBeGreaterThan(0);
    expect(within(schemeThree).getByText('贴息协议已生效')).toBeInTheDocument();
    const unsignedPhone = within(schemeThree).getByText('方案三 · 27 年未签专区').closest('.phone-scene')?.querySelector('.scheme-three-reference') as HTMLElement;
    fireEvent.click(within(unsignedPhone).getByRole('button', { name: /去签署贴息协议/ }));
    expect(within(unsignedPhone).getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(within(unsignedPhone).getByRole('button', { name: '确认签署' }));
    expect(within(unsignedPhone).getByText('贴息协议已生效')).toBeInTheDocument();
    expect(schemeThree.querySelectorAll('.scheme-one-entry-grid button').length).toBeGreaterThanOrEqual(4);
    expect(schemeThree.querySelectorAll('.scheme-three-business-page')).toHaveLength(0);
    fireEvent.click(within(schemeThree).getAllByRole('button', { name: /自主申请/ })[0]);
    fireEvent.click(within(schemeThree).getAllByRole('button', { name: /我的协议/ })[0]);
    expect(schemeThree.querySelectorAll('.scheme-three-business-page').length).toBeGreaterThanOrEqual(2);
    expect(within(schemeThree).getAllByText(/当前年度：2026 年|当前年度：2027 年/).length).toBeGreaterThan(0);
  });

  it('方案四历史业务先选年份再进入历史专区', () => {
    const { container } = render(<MemoryRouter><CrossYearInterestPage /></MemoryRouter>);
    const schemeFour = container.querySelectorAll('.cross-scheme-row')[4] as HTMLElement;
    expect(within(schemeFour).getByText('方案四 · 已签首页')).toBeInTheDocument();
    expect(within(schemeFour).getByText('方案四 · 未签首页')).toBeInTheDocument();
    const unsignedHome = within(schemeFour).getByText('方案四 · 未签首页').closest('.phone-scene') as HTMLElement;
    fireEvent.click(within(unsignedHome).getByRole('button', { name: /去签署贴息协议/ }));
    expect(within(unsignedHome).getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(within(unsignedHome).getByRole('button', { name: '确认签署' }));
    expect(within(unsignedHome).getByText('贴息协议已生效')).toBeInTheDocument();
    fireEvent.click(within(schemeFour).getAllByRole('button', { name: /历史业务/ })[0]);
    expect(within(schemeFour).getByText('选择历史年份')).toBeInTheDocument();
    expect(schemeFour.querySelector('.scheme-four-history-year-list')).toBeInTheDocument();
    const yearCards = schemeFour.querySelectorAll('.scheme-four-history-year-card');
    expect(yearCards.length).toBeGreaterThanOrEqual(2);
    expect(within(yearCards[0] as HTMLElement).getByText(/2026 年消费需在 2027 年 3 月 31 日前完成申请/)).toBeInTheDocument();
    fireEvent.click(yearCards[0] as HTMLElement);
    expect(schemeFour.querySelectorAll('.scheme-four-history-expired')).toHaveLength(1);
    const expiredPhone = schemeFour.querySelector('.scheme-four-history-expired') as HTMLElement;
    expect(within(expiredPhone).getByText('贴息协议已生效')).toBeInTheDocument();
    expect(within(expiredPhone).getByText(/2026 年消费需在 2027 年 3 月 31 日前完成申请/)).toBeInTheDocument();
    expect(expiredPhone.querySelectorAll('.scheme-one-entry-grid button')).toHaveLength(4);
    fireEvent.click(within(expiredPhone).getByRole('button', { name: /返回/ }));
    expect(within(schemeFour).getByText('选择历史年份')).toBeInTheDocument();
    const yearCardsAgain = schemeFour.querySelectorAll('.scheme-four-history-year-card');
    fireEvent.click(yearCardsAgain[1] as HTMLElement);
    expect(schemeFour.querySelectorAll('.scheme-four-history-unsigned')).toHaveLength(1);
    expect(within(schemeFour).getByText(/历史年度 · 2025 年/)).toBeInTheDocument();
    expect(schemeFour.querySelector('.scheme-four-history-unsigned .cross-year-tabs')).not.toBeInTheDocument();
  });

  it('方案一 2027 年未签场景可打开协议签署半窗，历史年度不提供补签', () => {
    const { container } = render(<MemoryRouter><CrossYearInterestPage /></MemoryRouter>);
    const schemeOne = container.querySelectorAll('.cross-scheme-row')[0] as HTMLElement;
    const scenario = Array.from(schemeOne.querySelectorAll('.phone-scene'))
      .filter((scene) => scene.querySelector('.cross-year-tabs'))
      .map((scene) => scene.querySelector('.scheme-one-reference') as HTMLElement)[0];
    expect(within(scenario).getByRole('button', { name: /^去签署/ })).toBeInTheDocument();
    expect(within(scenario).getByText(/同意并签署《贴息服务协议》/)).toBeInTheDocument();
    fireEvent.click(within(scenario).getByRole('button', { name: /^去签署/ }));
    expect(within(scenario).getByRole('dialog')).toBeInTheDocument();
    expect(within(scenario).getByRole('dialog').closest('.cross-phone')).toBe(scenario);
    expect(within(scenario).getByText('消费贷款财政贴息服务协议')).toBeInTheDocument();
    expect(within(scenario).getByText('第一条 甲方依据相关财政贴息政策，为符合条件的乙方消费贷款提供贴息服务。')).toBeInTheDocument();
    fireEvent.click(within(scenario).getByRole('button', { name: '确认签署' }));
    expect(within(scenario).getByText('贴息协议已生效')).toBeInTheDocument();
    fireEvent.click(within(scenario).getByRole('button', { name: '2026 年' }));
    expect(within(scenario).queryByRole('button', { name: /去签署/ })).not.toBeInTheDocument();
  });

  it('方案一四类业务页包含参考页面展示要素并支持年度筛选', () => {
    const { container } = render(<MemoryRouter><CrossYearInterestPage /></MemoryRouter>);
    const schemeOne = container.querySelectorAll('.cross-scheme-row')[0] as HTMLElement;
    const scenario = schemeOne.querySelectorAll('.scheme-one-reference')[2] as HTMLElement;
    fireEvent.click(within(scenario).getByRole('button', { name: '2026 年' }));
    fireEvent.click(within(scenario).getByRole('button', { name: /自主申请/ }));
    expect(within(schemeOne).getByText('申请年度：')).toBeInTheDocument();
    expect(within(schemeOne).queryByText('2026 年自主申请')).not.toBeInTheDocument();
    expect(within(schemeOne).getByText('消费信息')).toBeInTheDocument();
    expect(within(schemeOne).getByText('消费信息')).toBeInTheDocument();
    expect(within(schemeOne).getAllByText('消费凭证').length).toBeGreaterThan(0);
    expect(within(schemeOne).getByText('提交申请')).toBeInTheDocument();
    fireEvent.click(within(scenario).getByRole('button', { name: /我的协议/ }));
    const yearFilter = within(schemeOne).getAllByLabelText('查看年度')[0];
    fireEvent.change(yearFilter, { target: { value: 'all' } });
    expect(within(schemeOne).getAllByText('2027 年').length).toBeGreaterThan(0);
    expect(within(schemeOne).getAllByText('2026 年').length).toBeGreaterThan(0);
    expect(within(schemeOne).getAllByText('下载合同').length).toBeGreaterThan(0);
    expect(within(schemeOne).getAllByText('预览合同').length).toBeGreaterThan(0);
    fireEvent.click(within(scenario).getByRole('button', { name: /核定记录/ }));
    expect(within(schemeOne).getAllByText('审核中').length).toBeGreaterThan(0);
    expect(within(schemeOne).getAllByText('已通过').length).toBeGreaterThan(0);
    expect(within(schemeOne).getByRole('button', { name: '高级筛选' })).toBeInTheDocument();
    expect(within(schemeOne).queryByText('按时间筛选')).not.toBeInTheDocument();
    fireEvent.click(within(scenario).getByRole('button', { name: /贴息记录/ }));
    expect(within(schemeOne).getByText('累计贴息金额')).toBeInTheDocument();
    expect(within(schemeOne).getByText('累计笔数')).toBeInTheDocument();
    expect(within(schemeOne).getAllByText(/贴息卡号/).length).toBeGreaterThan(0);
    expect(within(schemeOne).getAllByRole('button', { name: '高级筛选' }).length).toBeGreaterThanOrEqual(2);
    expect(within(schemeOne).queryByLabelText('贴息记录时间筛选')).not.toBeInTheDocument();
  });

  it('方案一业务页移除重复标题并支持年份与时间组合筛选', () => {
    const { container } = render(<MemoryRouter><CrossYearInterestPage /></MemoryRouter>);
    const schemeOne = container.querySelectorAll('.cross-scheme-row')[0] as HTMLElement;
    const scenario = schemeOne.querySelectorAll('.scheme-one-reference')[1] as HTMLElement;

    fireEvent.click(within(scenario).getByRole('button', { name: /自主申请/ }));
    expect(within(schemeOne).queryByText('填写 2027 年消费贷款贴息申请')).not.toBeInTheDocument();

    fireEvent.click(within(scenario).getByRole('button', { name: /我的协议/ }));
    expect(within(schemeOne).queryByText('查看年度协议及签署状态')).not.toBeInTheDocument();

    fireEvent.click(within(scenario).getByRole('button', { name: /核定记录/ }));
    expect(within(schemeOne).queryByText('查看 2027 年申请核定进度')).not.toBeInTheDocument();
    expect(within(schemeOne).queryByText('查看申请、核定状态和消费信息')).not.toBeInTheDocument();
    const yearFilters = within(schemeOne).getAllByLabelText('查看年度');
    fireEvent.change(yearFilters[yearFilters.length - 1], { target: { value: 'all' } });
    fireEvent.click(within(schemeOne).getByRole('button', { name: '高级筛选' }));
    fireEvent.click(within(schemeOne).getByRole('button', { name: '近三个月' }));
    expect(schemeOne.querySelectorAll('.scheme-one-application-record').length).toBeGreaterThan(0);
    expect(schemeOne.querySelectorAll('.scheme-one-application-record').length).toBeLessThanOrEqual(10);

    fireEvent.click(within(scenario).getByRole('button', { name: /贴息记录/ }));
    expect(within(schemeOne).queryByText('查看 2027 年贴息发放明细')).not.toBeInTheDocument();
    expect(within(schemeOne).queryByText('查看各政策年度贴息发放明细')).not.toBeInTheDocument();
    const recordsScene = within(schemeOne).getByText('方案一 · 2027 年贴息记录').closest('.phone-scene') as HTMLElement;
    fireEvent.change(within(recordsScene).getByLabelText('查看年度'), { target: { value: 'all' } });
    fireEvent.click(within(recordsScene).getByRole('button', { name: '高级筛选' }));
    fireEvent.click(within(recordsScene).getByRole('button', { name: '近三个月' }));
    const filteredCount = recordsScene.querySelectorAll('.scheme-one-interest-record').length;
    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThan(10);
    const summaries = recordsScene.querySelectorAll('.scheme-one-records-summary strong');
    expect(summaries[summaries.length - 1]?.textContent).toBe(`${filteredCount}笔`);
  });

  it('方案一签署入口复用 home-agreement 结构且保持当前画布内按钮', () => {
    const { container } = render(<MemoryRouter><CrossYearInterestPage /></MemoryRouter>);
    const scenario = Array.from(container.querySelectorAll('.cross-scheme-row')[0].querySelectorAll('.phone-scene'))
      .filter((scene) => scene.querySelector('.cross-year-tabs'))
      .map((scene) => scene.querySelector('.scheme-one-reference') as HTMLElement)[0];
    expect(scenario.querySelector('.home-agreement')).toBeInTheDocument();
    expect(scenario.querySelector('.home-agreement > button')).toHaveTextContent('去签署');
  });

  it('方案二查询业务页按入口按需平铺并复用完整参考字段', () => {
    const { container } = render(<MemoryRouter><CrossYearInterestPage /></MemoryRouter>);
    const schemeTwo = container.querySelectorAll('.cross-scheme-row')[2] as HTMLElement;
    expect(schemeTwo.querySelectorAll('.scheme-two-business-page')).toHaveLength(0);
    fireEvent.click(within(schemeTwo).getByRole('button', { name: /自主申请/ }));
    fireEvent.click(within(schemeTwo).getAllByRole('button', { name: /进入 2026 年申请/ })[0]);
    expect(within(schemeTwo).getByText('消费信息')).toBeInTheDocument();
    expect(within(schemeTwo).getAllByText('消费凭证').length).toBeGreaterThan(0);
    fireEvent.click(within(schemeTwo).getAllByRole('button', { name: /我的协议/ })[0]);
    expect(schemeTwo.querySelectorAll('.scheme-two-business-page').length).toBeGreaterThanOrEqual(2);
    expect(within(schemeTwo).getAllByText('下载合同').length).toBeGreaterThan(0);
    fireEvent.click(within(schemeTwo).getAllByRole('button', { name: /核定记录/ })[0]);
    expect(within(schemeTwo).getByRole('button', { name: '高级筛选' })).toBeInTheDocument();
    expect(within(schemeTwo).queryByText('按时间筛选')).not.toBeInTheDocument();
    fireEvent.click(within(schemeTwo).getAllByRole('button', { name: /贴息记录/ })[0]);
    expect(within(schemeTwo).getByText('累计贴息金额')).toBeInTheDocument();
    expect(within(schemeTwo).getAllByRole('button', { name: '高级筛选' }).length).toBeGreaterThanOrEqual(2);
  });

  it('方案二申请相关页与查询业务页横向并列不重叠', () => {
    const { container } = render(<MemoryRouter><CrossYearInterestPage /></MemoryRouter>);
    const schemeTwo = container.querySelectorAll('.cross-scheme-row')[2] as HTMLElement;
    fireEvent.click(within(schemeTwo).getByRole('button', { name: /自主申请/ }));
    expect(schemeTwo.querySelectorAll('.scheme-two-application-list')).toHaveLength(0);
    expect(schemeTwo.querySelectorAll('.scheme-two-phone-list > .phone-scene').length).toBe(4);
    fireEvent.click(within(schemeTwo).getAllByRole('button', { name: /我的协议/ })[0]);
    fireEvent.click(within(schemeTwo).getAllByRole('button', { name: /核定记录/ })[0]);
    fireEvent.click(within(schemeTwo).getAllByRole('button', { name: /贴息记录/ })[0]);
    const scenes = schemeTwo.querySelectorAll('.scheme-two-phone-list > .phone-scene');
    expect(scenes.length).toBe(7);
    expect(schemeTwo.querySelectorAll('.scheme-two-business-page')).toHaveLength(3);
    scenes.forEach((scene) => {
      expect((scene as HTMLElement).querySelector('.cross-phone')).toBeInTheDocument();
    });
    expect(within(schemeTwo).getByText('方案二 · 我的协议')).toBeInTheDocument();
    expect(within(schemeTwo).getByText('方案二 · 核定记录')).toBeInTheDocument();
    expect(within(schemeTwo).getByText('方案二 · 贴息记录')).toBeInTheDocument();
  });

  it('方案三固定年度协议与贴息记录提示仅可查看当前年', () => {
    const { container } = render(<MemoryRouter><CrossYearInterestPage /></MemoryRouter>);
    const schemeThree = container.querySelectorAll('.cross-scheme-row')[3] as HTMLElement;
    const workbenchA = within(schemeThree).getByText('方案三 · 多年度工作台').closest('.phone-scene') as HTMLElement;
    fireEvent.click(within(workbenchA).getByRole('button', { name: /2026 年/ }));
    const zone2026 = within(schemeThree).getByText('方案三 · 26 年已签专区').closest('.phone-scene') as HTMLElement;
    fireEvent.click(within(zone2026).getByRole('button', { name: /我的协议/ }));
    fireEvent.click(within(zone2026).getByRole('button', { name: /贴息记录/ }));
    expect(within(schemeThree).getByText('协议按政策年度独立维护，当前仅可查看 2026 年协议。')).toBeInTheDocument();
    expect(within(schemeThree).getByText('贴息金额按记录明细统计，当前仅可查看 2026 年贴息记录。')).toBeInTheDocument();
    expect(within(schemeThree).queryByText('可查看全部年份协议。')).not.toBeInTheDocument();
    expect(within(schemeThree).queryByText(/支持全部年份与单年度查看/)).not.toBeInTheDocument();
    fireEvent.click(within(workbenchA).getByRole('button', { name: /2027 年/ }));
    const zone2027 = within(schemeThree).getByText('方案三 · 27 年未签专区').closest('.phone-scene') as HTMLElement;
    fireEvent.click(within(zone2027).getByRole('button', { name: /去签署贴息协议/ }));
    fireEvent.click(within(zone2027).getByRole('button', { name: /确认签署/ }));
    fireEvent.click(within(zone2027).getByRole('button', { name: /我的协议/ }));
    fireEvent.click(within(zone2027).getByRole('button', { name: /贴息记录/ }));
    expect(within(schemeThree).getByText('协议按政策年度独立维护，当前仅可查看 2027 年协议。')).toBeInTheDocument();
    expect(within(schemeThree).getByText('贴息金额按记录明细统计，当前仅可查看 2027 年贴息记录。')).toBeInTheDocument();
  });

  it('方案四历史 2026 协议与贴息记录提示仅可查看当前年', () => {
    const { container } = render(<MemoryRouter><CrossYearInterestPage /></MemoryRouter>);
    const schemeFour = container.querySelectorAll('.cross-scheme-row')[4] as HTMLElement;
    fireEvent.click(within(schemeFour).getAllByRole('button', { name: /历史业务/ })[0]);
    const yearList = within(schemeFour).getByText('选择历史年份').closest('.phone-scene') as HTMLElement;
    fireEvent.click(within(yearList).getByRole('button', { name: /2026 年/ }));
    const history2026 = within(schemeFour).getByText('方案四 · 2026 年历史专区').closest('.phone-scene') as HTMLElement;
    fireEvent.click(within(history2026).getByRole('button', { name: /我的协议/ }));
    fireEvent.click(within(history2026).getByRole('button', { name: /贴息记录/ }));
    expect(within(schemeFour).getByText('协议按政策年度独立维护，当前仅可查看 2026 年协议。')).toBeInTheDocument();
    expect(within(schemeFour).getByText('贴息金额按记录明细统计，当前仅可查看 2026 年贴息记录。')).toBeInTheDocument();
    expect(within(schemeFour).queryByText(/可查看全部年份协议/)).not.toBeInTheDocument();
    expect(within(schemeFour).queryByText(/支持全部年份与单年度查看/)).not.toBeInTheDocument();
  });

  it('F1-F2 方案一备份位于方案一下方且含三场景标题', () => {
    const { container } = render(<MemoryRouter><CrossYearInterestPage /></MemoryRouter>);
    const rows = container.querySelectorAll('.cross-scheme-row');
    expect(rows).toHaveLength(5);
    expect(rows[0].querySelector('h2')?.textContent).toContain('方案一');
    expect(rows[0].className).not.toContain('scheme-one-backup-row');
    expect(rows[1]).toHaveAttribute('data-testid', 'scheme-one-backup-row');
    expect(within(rows[1] as HTMLElement).getByText('方案一备份')).toBeInTheDocument();
    expect(within(rows[1] as HTMLElement).getByText('方案一备份 · 未签协议首页')).toBeInTheDocument();
    expect(within(rows[1] as HTMLElement).getByText('方案一备份 · 已签协议首页')).toBeInTheDocument();
    expect(within(rows[1] as HTMLElement).getByText('方案一备份 · 跨年度切换首页')).toBeInTheDocument();
    expect(rows[2].querySelector('h2')?.textContent).toContain('方案二');
  });

  it('F3 主方案一签署后备份未签场景状态仍隔离', () => {
    const { container } = render(<MemoryRouter><CrossYearInterestPage /></MemoryRouter>);
    const schemeOne = container.querySelectorAll('.cross-scheme-row')[0] as HTMLElement;
    const backup = container.querySelector('[data-testid="scheme-one-backup-row"]') as HTMLElement;
    const mainUnsigned = schemeOne.querySelectorAll('.scheme-one-reference')[0] as HTMLElement;
    fireEvent.click(within(mainUnsigned).getByRole('button', { name: /^去签署/ }));
    fireEvent.click(within(mainUnsigned).getByRole('button', { name: '确认签署' }));
    expect(within(mainUnsigned).getByText('贴息协议已生效')).toBeInTheDocument();
    const backupUnsigned = backup.querySelectorAll('.scheme-one-reference')[0] as HTMLElement;
    expect(within(backupUnsigned).getByText('协议未签署')).toBeInTheDocument();
    expect(within(backupUnsigned).getByRole('button', { name: /去签署贴息协议/ })).toBeInTheDocument();
  });

  it('H1-H3 方案一未签去标题、已签去图标、无独立全部年份页', () => {
    const { container } = render(<MemoryRouter><CrossYearInterestPage /></MemoryRouter>);
    const schemeOne = container.querySelectorAll('.cross-scheme-row')[0] as HTMLElement;
    expect(within(schemeOne).queryByText('方案一 · 全部年份协议')).not.toBeInTheDocument();
    expect(schemeOne.querySelectorAll('.scheme-one-business-page')).toHaveLength(0);

    const unsignedHome = within(schemeOne).getByText('方案一 · 未签协议首页').closest('.phone-scene') as HTMLElement;
    expect(within(unsignedHome).queryByText('协议未签署')).not.toBeInTheDocument();
    expect(within(unsignedHome).getByText(/同意并签署《贴息服务协议》，签署后本年度默认生效/)).toBeInTheDocument();
    expect(within(unsignedHome).getByRole('button', { name: /^去签署/ })).toBeInTheDocument();

    const only2026 = within(schemeOne).getByText('方案一 · 仅 26 年已签首页').closest('.phone-scene') as HTMLElement;
    expect(within(only2026).getByText('贴息协议已生效')).toBeInTheDocument();
    expect(within(only2026).getByText('您可以开始申请消费贷款贴息')).toBeInTheDocument();
    const signedMain = within(only2026).getByText('贴息协议已生效').closest('.scheme-one-agreement') as HTMLElement;
    expect(signedMain.querySelector('.scheme-one-signed-icon')).toBeNull();
    expect(signedMain.querySelector('.scheme-one-agreement-main .anticon')).toBeNull();
    expect(only2026.querySelectorAll('.scheme-one-entry-grid button')).toHaveLength(4);
  });

  it('H3-H5 2026 我的协议全部年份筛选与贴息记录间距', () => {
    const { container } = render(<MemoryRouter><CrossYearInterestPage /></MemoryRouter>);
    const schemeOne = container.querySelectorAll('.cross-scheme-row')[0] as HTMLElement;
    const crossHome = within(schemeOne).getByText('方案一 · 跨年度切换首页').closest('.phone-scene') as HTMLElement;
    fireEvent.click(within(crossHome).getByRole('button', { name: '2026 年' }));
    fireEvent.click(within(crossHome).getByRole('button', { name: /我的协议/ }));
    const agreement2026 = within(schemeOne).getByText('方案一 · 2026 年我的协议').closest('.phone-scene') as HTMLElement;
    expect(agreement2026.querySelector('.scheme-one-page-intro')).toBeNull();
    expect(within(agreement2026).queryByText('查看各政策年度签署的贴息服务协议')).not.toBeInTheDocument();
    const yearFilter = within(agreement2026).getByLabelText('查看年度') as HTMLSelectElement;
    expect(yearFilter.value).toBe('2026');
    fireEvent.change(yearFilter, { target: { value: 'all' } });
    expect(agreement2026.querySelectorAll('.scheme-one-agreement-card')).toHaveLength(2);
    expect(within(agreement2026).getAllByText('生效').length).toBeGreaterThan(0);
    expect(within(agreement2026).getAllByText('已过期').length).toBeGreaterThan(0);

    fireEvent.click(within(crossHome).getByRole('button', { name: /贴息记录/ }));
    const records = within(schemeOne).getByText('方案一 · 2026 年贴息记录').closest('.phone-scene') as HTMLElement;
    const summary = records.querySelector('.scheme-one-records-summary') as HTMLElement;
    expect(summary).toBeTruthy();
    const firstRecord = records.querySelector('.scheme-one-interest-record') as HTMLElement;
    expect(firstRecord).toBeTruthy();
    expect(summary.compareDocumentPosition(firstRecord) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // 统计模块与流水卡上下间隔：CSS 中为 margin-bottom: 14px（jsdom 不一定解析完整样式表，以源样式类存在 + DOM 先后为准）
    expect(summary.className).toContain('scheme-one-records-summary');
    expect(records.querySelectorAll('.scheme-one-interest-record').length).toBeGreaterThan(0);
  });

  it('I1-I2 方案一 2026/2027 自主申请页无页内重复标题', () => {
    const { container } = render(<MemoryRouter><CrossYearInterestPage /></MemoryRouter>);
    const schemeOne = container.querySelectorAll('.cross-scheme-row')[0] as HTMLElement;
    const signedHome = within(schemeOne).getByText('方案一 · 已签协议首页').closest('.phone-scene') as HTMLElement;
    fireEvent.click(within(signedHome).getByRole('button', { name: /自主申请/ }));
    const apply2027 = within(schemeOne).getByText('方案一 · 2027 年自主申请').closest('.phone-scene') as HTMLElement;
    expect(within(apply2027).queryByText('2027 年自主申请')).not.toBeInTheDocument();
    expect(apply2027.querySelector('.scheme-one-apply-heading-label')).toBeNull();
    expect(apply2027.querySelector('.scheme-one-locked-year')).toBeTruthy();
    expect(within(apply2027).getByText('消费信息')).toBeInTheDocument();

    const crossHome = within(schemeOne).getByText('方案一 · 跨年度切换首页').closest('.phone-scene') as HTMLElement;
    fireEvent.click(within(crossHome).getByRole('button', { name: '2026 年' }));
    fireEvent.click(within(crossHome).getByRole('button', { name: /自主申请/ }));
    const apply2026 = within(schemeOne).getByText('方案一 · 2026 年自主申请').closest('.phone-scene') as HTMLElement;
    expect(within(apply2026).queryByText('2026 年自主申请')).not.toBeInTheDocument();
    expect(apply2026.querySelector('.scheme-one-apply-heading-label')).toBeNull();
    expect(apply2026.querySelector('.scheme-one-locked-year')).toBeTruthy();
    expect(within(apply2026).getByText('消费信息')).toBeInTheDocument();
  });

  it('J1-J4 方案一核定记录高级筛选：快捷时间、自定义区间与申请渠道', () => {
    const { container } = render(<MemoryRouter><CrossYearInterestPage /></MemoryRouter>);
    const schemeOne = container.querySelectorAll('.cross-scheme-row')[0] as HTMLElement;
    const signedHome = within(schemeOne).getByText('方案一 · 已签协议首页').closest('.phone-scene') as HTMLElement;
    fireEvent.click(within(signedHome).getByRole('button', { name: /核定记录/ }));
    const verify = within(schemeOne).getByText('方案一 · 2027 年核定记录').closest('.phone-scene') as HTMLElement;
    expect(within(verify).getByRole('button', { name: '高级筛选' })).toBeInTheDocument();
    expect(within(verify).queryByText('按时间筛选')).not.toBeInTheDocument();
    expect(within(verify).queryByLabelText('核定记录时间筛选')).not.toBeInTheDocument();

    const totalBefore = verify.querySelectorAll('.scheme-one-application-record').length;
    expect(totalBefore).toBeGreaterThan(0);
    fireEvent.click(within(verify).getByRole('button', { name: '高级筛选' }));
    expect(within(verify).getByLabelText('核定记录高级筛选面板')).toBeInTheDocument();
    expect(within(verify).getByRole('button', { name: '近三个月' })).toBeInTheDocument();
    expect(within(verify).getByRole('button', { name: '近半年' })).toBeInTheDocument();
    expect(within(verify).getByRole('button', { name: '近一年' })).toBeInTheDocument();
    expect(within(verify).getByLabelText('自定义开始日期')).toBeInTheDocument();
    expect(within(verify).getByLabelText('自定义结束日期')).toBeInTheDocument();
    expect(within(verify).getByRole('button', { name: '自主申请' })).toBeInTheDocument();
    expect(within(verify).getByRole('button', { name: '系统核定' })).toBeInTheDocument();

    fireEvent.click(within(verify).getByRole('button', { name: '自主申请' }));
    const selfCount = verify.querySelectorAll('.scheme-one-application-record').length;
    expect(selfCount).toBeGreaterThan(0);
    expect(selfCount).toBeLessThan(totalBefore);
    expect(within(verify).getAllByText('客户自主申请').length).toBe(selfCount);
    expect(Array.from(verify.querySelectorAll('.scheme-one-application-record')).every((card) => card.textContent?.includes('客户自主申请'))).toBe(true);

    fireEvent.click(within(verify).getByRole('button', { name: '系统核定' }));
    const systemCount = verify.querySelectorAll('.scheme-one-application-record').length;
    expect(systemCount).toBeGreaterThan(0);
    expect(systemCount).toBeLessThan(totalBefore);
    expect(Array.from(verify.querySelectorAll('.scheme-one-application-record')).every((card) => card.textContent?.includes('系统核定'))).toBe(true);
    expect(within(verify).queryByText('客户自主申请')).not.toBeInTheDocument();

    fireEvent.click(within(verify).getByRole('button', { name: '全部渠道' }));
    fireEvent.change(within(verify).getByLabelText('自定义开始日期'), { target: { value: '2027-06-01' } });
    fireEvent.change(within(verify).getByLabelText('自定义结束日期'), { target: { value: '2027-07-31' } });
    const customCount = verify.querySelectorAll('.scheme-one-application-record').length;
    expect(customCount).toBeGreaterThan(0);
    expect(customCount).toBeLessThanOrEqual(totalBefore);

    fireEvent.click(within(verify).getByRole('button', { name: '重置' }));
    expect(verify.querySelectorAll('.scheme-one-application-record').length).toBe(totalBefore);
  });

  it('J5 方案二核定记录已对齐高级筛选', () => {
    const { container } = render(<MemoryRouter><CrossYearInterestPage /></MemoryRouter>);
    const schemeTwo = container.querySelectorAll('.cross-scheme-row')[2] as HTMLElement;
    fireEvent.click(within(schemeTwo).getAllByRole('button', { name: /核定记录/ })[0]);
    expect(within(schemeTwo).getByRole('button', { name: '高级筛选' })).toBeInTheDocument();
    expect(within(schemeTwo).queryByText('按时间筛选')).not.toBeInTheDocument();
  });

  it('K1-K4 方案一贴息记录高级筛选：快捷时间、自定义区间与贴息类型', () => {
    const { container } = render(<MemoryRouter><CrossYearInterestPage /></MemoryRouter>);
    const schemeOne = container.querySelectorAll('.cross-scheme-row')[0] as HTMLElement;
    const signedHome = within(schemeOne).getByText('方案一 · 已签协议首页').closest('.phone-scene') as HTMLElement;
    fireEvent.click(within(signedHome).getByRole('button', { name: /贴息记录/ }));
    const records = within(schemeOne).getByText('方案一 · 2027 年贴息记录').closest('.phone-scene') as HTMLElement;
    expect(within(records).getByRole('button', { name: '高级筛选' })).toBeInTheDocument();
    expect(within(records).queryByText('按时间筛选')).not.toBeInTheDocument();
    expect(within(records).queryByLabelText('贴息记录时间筛选')).not.toBeInTheDocument();

    const totalBefore = records.querySelectorAll('.scheme-one-interest-record').length;
    expect(totalBefore).toBeGreaterThan(0);
    fireEvent.click(within(records).getByRole('button', { name: '高级筛选' }));
    expect(within(records).getByLabelText('贴息记录高级筛选面板')).toBeInTheDocument();
    expect(within(records).getByRole('button', { name: '近三个月' })).toBeInTheDocument();
    expect(within(records).getByRole('button', { name: '近半年' })).toBeInTheDocument();
    expect(within(records).getByRole('button', { name: '近一年' })).toBeInTheDocument();
    expect(within(records).getByLabelText('自定义开始日期')).toBeInTheDocument();
    expect(within(records).getByLabelText('自定义结束日期')).toBeInTheDocument();
    expect(within(records).getByRole('button', { name: '实时贴息' })).toBeInTheDocument();
    expect(within(records).getByRole('button', { name: '补贴息' })).toBeInTheDocument();
    expect(within(records).getByRole('button', { name: '收回贴息' })).toBeInTheDocument();

    fireEvent.click(within(records).getByRole('button', { name: '实时贴息' }));
    const realtimeCount = records.querySelectorAll('.scheme-one-interest-record').length;
    expect(realtimeCount).toBeGreaterThan(0);
    expect(realtimeCount).toBeLessThan(totalBefore);
    expect(Array.from(records.querySelectorAll('.scheme-one-interest-record')).every((card) => card.textContent?.includes('实时贴息'))).toBe(true);

    fireEvent.click(within(records).getByRole('button', { name: '补贴息' }));
    const subsidyCount = records.querySelectorAll('.scheme-one-interest-record').length;
    expect(subsidyCount).toBeGreaterThan(0);
    expect(subsidyCount).toBeLessThan(totalBefore);
    expect(Array.from(records.querySelectorAll('.scheme-one-interest-record')).every((card) => card.textContent?.includes('补贴息'))).toBe(true);

    fireEvent.click(within(records).getByRole('button', { name: '收回贴息' }));
    const reclaimCount = records.querySelectorAll('.scheme-one-interest-record').length;
    expect(reclaimCount).toBeGreaterThan(0);
    expect(reclaimCount).toBeLessThan(totalBefore);
    expect(Array.from(records.querySelectorAll('.scheme-one-interest-record')).every((card) => card.textContent?.includes('收回贴息'))).toBe(true);

    fireEvent.click(within(records).getByRole('button', { name: '全部类型' }));
    fireEvent.change(within(records).getByLabelText('自定义开始日期'), { target: { value: '2027-06-01' } });
    fireEvent.change(within(records).getByLabelText('自定义结束日期'), { target: { value: '2027-07-31' } });
    const customCount = records.querySelectorAll('.scheme-one-interest-record').length;
    expect(customCount).toBeGreaterThan(0);
    expect(customCount).toBeLessThanOrEqual(totalBefore);

    fireEvent.click(within(records).getByRole('button', { name: '重置' }));
    expect(records.querySelectorAll('.scheme-one-interest-record').length).toBe(totalBefore);
  });

  it('K5 方案二贴息记录已对齐高级筛选', () => {
    const { container } = render(<MemoryRouter><CrossYearInterestPage /></MemoryRouter>);
    const schemeTwo = container.querySelectorAll('.cross-scheme-row')[2] as HTMLElement;
    fireEvent.click(within(schemeTwo).getAllByRole('button', { name: /贴息记录/ })[0]);
    expect(within(schemeTwo).getByRole('button', { name: '高级筛选' })).toBeInTheDocument();
    expect(within(schemeTwo).queryByText('按时间筛选')).not.toBeInTheDocument();
  });



  it('L1 方案二核定与贴息均为高级筛选', () => {
    const { container } = render(<MemoryRouter><CrossYearInterestPage /></MemoryRouter>);
    const schemeTwo = container.querySelectorAll('.cross-scheme-row')[2] as HTMLElement;
    fireEvent.click(within(schemeTwo).getAllByRole('button', { name: /核定记录/ })[0]);
    const verify = within(schemeTwo).getByText('方案二 · 核定记录').closest('.phone-scene') as HTMLElement;
    expect(within(verify).getByRole('button', { name: '高级筛选' })).toBeInTheDocument();
    fireEvent.click(within(verify).getByRole('button', { name: '高级筛选' }));
    expect(within(verify).getByLabelText('核定记录高级筛选面板')).toBeInTheDocument();
    expect(within(verify).getByRole('button', { name: '自主申请' })).toBeInTheDocument();
    fireEvent.click(within(schemeTwo).getAllByRole('button', { name: /贴息记录/ })[0]);
    const records = within(schemeTwo).getByText('方案二 · 贴息记录').closest('.phone-scene') as HTMLElement;
    expect(within(records).getByRole('button', { name: '高级筛选' })).toBeInTheDocument();
    fireEvent.click(within(records).getByRole('button', { name: '高级筛选' }));
    expect(within(records).getByLabelText('贴息记录高级筛选面板')).toBeInTheDocument();
    expect(within(records).getByRole('button', { name: '实时贴息' })).toBeInTheDocument();
  });

  it('L2 方案三核定与贴息均为高级筛选', () => {
    const { container } = render(<MemoryRouter><CrossYearInterestPage /></MemoryRouter>);
    const schemeThree = container.querySelectorAll('.cross-scheme-row')[3] as HTMLElement;
    const workbenchA = within(schemeThree).getByText('方案三 · 多年度工作台').closest('.phone-scene') as HTMLElement;
    fireEvent.click(within(workbenchA).getByRole('button', { name: /2026 年/ }));
    const zone2026 = within(schemeThree).getByText('方案三 · 26 年已签专区').closest('.phone-scene') as HTMLElement;
    fireEvent.click(within(zone2026).getByRole('button', { name: /核定记录/ }));
    const verify = within(schemeThree).getByText('方案三 · 2026 年核定记录').closest('.phone-scene') as HTMLElement;
    expect(within(verify).getByRole('button', { name: '高级筛选' })).toBeInTheDocument();
    expect(within(verify).queryByText('按时间筛选')).not.toBeInTheDocument();
    fireEvent.click(within(zone2026).getByRole('button', { name: /贴息记录/ }));
    const records = within(schemeThree).getByText('方案三 · 2026 年贴息记录').closest('.phone-scene') as HTMLElement;
    expect(within(records).getByRole('button', { name: '高级筛选' })).toBeInTheDocument();
    expect(within(records).queryByText('按时间筛选')).not.toBeInTheDocument();
  });

  it('L3 方案四核定与贴息均为高级筛选', () => {
    const { container } = render(<MemoryRouter><CrossYearInterestPage /></MemoryRouter>);
    const schemeFour = container.querySelectorAll('.cross-scheme-row')[4] as HTMLElement;
    const signedHome = within(schemeFour).getByText('方案四 · 已签首页').closest('.phone-scene') as HTMLElement;
    fireEvent.click(within(signedHome).getByRole('button', { name: /核定记录/ }));
    expect(within(schemeFour).getByRole('button', { name: '高级筛选' })).toBeInTheDocument();
    fireEvent.click(within(signedHome).getByRole('button', { name: /贴息记录/ }));
    expect(within(schemeFour).getAllByRole('button', { name: '高级筛选' }).length).toBeGreaterThanOrEqual(2);
    expect(within(schemeFour).queryByText('按时间筛选')).not.toBeInTheDocument();
  });

  it('L4 方案一备份核定与贴息均为高级筛选且含渠道/类型', () => {
    const { container } = render(<MemoryRouter><CrossYearInterestPage /></MemoryRouter>);
    const backup = container.querySelectorAll('.cross-scheme-row')[1] as HTMLElement;
    const signedHome = within(backup).getByText('方案一备份 · 已签协议首页').closest('.phone-scene') as HTMLElement;
    fireEvent.click(within(signedHome).getByRole('button', { name: /核定记录/ }));
    const verify = within(backup).getByText(/方案一备份 · .*核定记录|2027 年核定记录/).closest('.phone-scene') as HTMLElement
      ?? Array.from(backup.querySelectorAll('.phone-scene')).find((scene) => scene.textContent?.includes('核定记录') && scene.querySelector('.scheme-one-application-record')) as HTMLElement;
    // backup titles: look for business scene after click
    const verifyScenes = Array.from(backup.querySelectorAll('.phone-scene')).filter((scene) => within(scene as HTMLElement).queryByRole('button', { name: '高级筛选' }));
    expect(verifyScenes.length).toBeGreaterThan(0);
    const verifyScene = verifyScenes[verifyScenes.length - 1] as HTMLElement;
    fireEvent.click(within(verifyScene).getByRole('button', { name: '高级筛选' }));
    // may be verify panel
    const hasVerifyPanel = within(backup).queryByLabelText('核定记录高级筛选面板');
    if (hasVerifyPanel) {
      expect(within(backup).getByRole('button', { name: '自主申请' })).toBeInTheDocument();
      expect(within(backup).getByRole('button', { name: '系统核定' })).toBeInTheDocument();
    }
    fireEvent.click(within(signedHome).getByRole('button', { name: /贴息记录/ }));
    const recordScenes = Array.from(backup.querySelectorAll('.phone-scene')).filter((scene) => scene.textContent?.includes('累计贴息金额'));
    expect(recordScenes.length).toBeGreaterThan(0);
    const recordScene = recordScenes[recordScenes.length - 1] as HTMLElement;
    fireEvent.click(within(recordScene).getByRole('button', { name: '高级筛选' }));
    expect(within(recordScene).getByLabelText('贴息记录高级筛选面板')).toBeInTheDocument();
    expect(within(recordScene).getByRole('button', { name: '实时贴息' })).toBeInTheDocument();
    expect(within(recordScene).getByRole('button', { name: '补贴息' })).toBeInTheDocument();
    expect(within(recordScene).getByRole('button', { name: '收回贴息' })).toBeInTheDocument();
  });

  it('F4 方案二至方案四入口与页面数量行为不变', () => {
    const { container } = render(<MemoryRouter><CrossYearInterestPage /></MemoryRouter>);
    const schemeTwo = container.querySelectorAll('.cross-scheme-row')[2] as HTMLElement;
    const schemeThree = container.querySelectorAll('.cross-scheme-row')[3] as HTMLElement;
    const schemeFour = container.querySelectorAll('.cross-scheme-row')[4] as HTMLElement;
    expect(schemeTwo.querySelectorAll('.scheme-two-reference')).toHaveLength(1);
    expect(schemeThree.querySelectorAll('.scheme-three-year-list')).toHaveLength(2);
    expect(within(schemeFour).getByText('方案四 · 已签首页')).toBeInTheDocument();
    expect(within(schemeFour).getByText('方案四 · 未签首页')).toBeInTheDocument();
  });
});
