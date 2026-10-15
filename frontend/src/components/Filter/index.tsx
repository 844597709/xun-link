import { useState } from 'react';
import { Button, DatePicker, Form, Input, Select, Space } from 'antd';
import type { Dayjs } from 'dayjs';

export type FilterValue = string | number | Dayjs | [Dayjs, Dayjs] | string[] | undefined;

export interface FilterConfig {
  key: string;
  label: string;
  type: 'input' | 'select' | 'datePicker';
  options?: Array<{ label: string; value: string | number }>;
  optionsResolver?: (values: Record<string, FilterValue>) => Array<{ label: string; value: string | number }>;
  placeholder?: string;
  showSearch?: boolean;
  multiple?: boolean;
  required?: boolean;
  width?: number | string;
}

interface FilterProps {
  configs: FilterConfig[];
  onSearch: (values: Record<string, FilterValue>) => void;
}

export default function Filter({ configs, onSearch }: FilterProps) {
  const [form] = Form.useForm<Record<string, FilterValue>>();
  const [filterValues, setFilterValues] = useState<Record<string, FilterValue>>({});
  const hasStageStatusField = configs.some((config) => config.key === 'stageStatus');
  const hasInstitutionProductPair = configs.some((config) => config.key === 'institutionName') && configs.some((config) => config.key === 'productCode');

  const renderField = (config: FilterConfig) => {
    if (config.type === 'select') {
      const options = config.optionsResolver ? config.optionsResolver(filterValues) : config.options;
      return <Select allowClear mode={config.multiple ? 'multiple' : undefined} showSearch={config.showSearch} optionFilterProp="label" options={options} placeholder={config.placeholder ?? `请选择${config.label}`} style={{ width: config.width }} />;
    }
    if (config.type === 'datePicker') {
      const placeholder = config.placeholder ?? '请选择日期范围';
      return <DatePicker.RangePicker placeholder={[placeholder, placeholder]} style={{ width: '100%' }} />;
    }
    return <Input allowClear placeholder={config.placeholder ?? `请输入${config.label}`} style={{ width: config.width }} />;
  };

  return (
    <Form form={form} layout="inline" onValuesChange={(changedValues, allValues) => {
      setFilterValues(allValues);
      if ((hasStageStatusField && Object.prototype.hasOwnProperty.call(changedValues, 'transactionStage')) ||
        (hasInstitutionProductPair && Object.prototype.hasOwnProperty.call(changedValues, 'institutionName'))) {
        if (hasStageStatusField && Object.prototype.hasOwnProperty.call(changedValues, 'transactionStage')) form.setFieldValue('stageStatus', undefined);
        if (hasInstitutionProductPair && Object.prototype.hasOwnProperty.call(changedValues, 'institutionName')) {
          form.setFieldValue('productCode', undefined);
          setFilterValues({ ...allValues, productCode: undefined });
        }
      }
    }} onFinish={(values) => onSearch(values)} className="filter-form">
      <Space wrap size={[16, 12]}>
        {configs.map((config) => (
          <Form.Item key={config.key} name={config.key} label={config.label} rules={config.required ? [{ required: true, message: `请选择${config.label}` }] : undefined}>
            {renderField(config)}
          </Form.Item>
        ))}
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">搜索</Button>
            <Button onClick={() => { form.resetFields(); setFilterValues({}); onSearch({}); }}>重置</Button>
          </Space>
        </Form.Item>
      </Space>
    </Form>
  );
}
