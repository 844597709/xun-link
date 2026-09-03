import { Button, DatePicker, Form, Input, Select, Space } from 'antd';
import type { Dayjs } from 'dayjs';

export type FilterValue = string | number | Dayjs | [Dayjs, Dayjs] | undefined;

export interface FilterConfig {
  key: string;
  label: string;
  type: 'input' | 'select' | 'datePicker';
  options?: Array<{ label: string; value: string | number }>;
  placeholder?: string;
  showSearch?: boolean;
}

interface FilterProps {
  configs: FilterConfig[];
  onSearch: (values: Record<string, FilterValue>) => void;
}

export default function Filter({ configs, onSearch }: FilterProps) {
  const [form] = Form.useForm<Record<string, FilterValue>>();

  const renderField = (config: FilterConfig) => {
    if (config.type === 'select') {
      return <Select allowClear showSearch={config.showSearch} optionFilterProp="label" options={config.options} placeholder={config.placeholder ?? `请选择${config.label}`} />;
    }
    if (config.type === 'datePicker') {
      return <DatePicker.RangePicker style={{ width: '100%' }} />;
    }
    return <Input allowClear placeholder={config.placeholder ?? `请输入${config.label}`} />;
  };

  return (
    <Form form={form} layout="inline" onFinish={(values) => onSearch(values)} className="filter-form">
      <Space wrap size={[16, 12]}>
        {configs.map((config) => (
          <Form.Item key={config.key} name={config.key} label={config.label}>
            {renderField(config)}
          </Form.Item>
        ))}
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">搜索</Button>
            <Button onClick={() => { form.resetFields(); onSearch({}); }}>重置</Button>
          </Space>
        </Form.Item>
      </Space>
    </Form>
  );
}
