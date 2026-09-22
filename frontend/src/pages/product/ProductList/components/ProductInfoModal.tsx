import { Descriptions, Drawer, Form, Input, InputNumber, Select, Space, Button } from 'antd';
import { useEffect } from 'react';
import type { ProductEditValues, ProductRecord } from '../../../../types';
import { creditTypeOptions, loanTypeOptions, updateProduct } from '../../../../mock/product';

interface ProductInfoModalProps {
  open: boolean;
  mode: 'view' | 'edit';
  product: ProductRecord | null;
  onClose: () => void;
  onSaved: () => void;
}

const loanSubTypeOptions = ['个人经营贷款', '小微企业贷款', '个人消费贷款', '住房抵押贷款'].map((value) => ({ label: value, value }));

export default function ProductInfoModal({ open, mode, product, onClose, onSaved }: ProductInfoModalProps) {
  const [form] = Form.useForm<ProductEditValues>();

  useEffect(() => {
    if (open && product) form.setFieldsValue({
      productName: product.productName,
      loanType: product.loanType,
      loanSubType: product.loanSubType,
      creditType: product.creditType,
      maxCreditLimit: product.maxCreditLimit,
    });
    if (!open) form.resetFields();
  }, [form, open, product]);

  const handleFinish = async (values: ProductEditValues) => {
    if (!product) return;
    const response = await updateProduct(product.id, values);
    if (response.code !== 0) {
      form.setFields([{ name: 'productName', errors: [response.message] }]);
      return;
    }
    onSaved();
  };

  if (!product) return null;
  return (
    <Drawer
      open={open}
      title={mode === 'view' ? '查看产品信息' : '编辑产品信息'}
      width="min(720px, 100vw)"
      destroyOnClose
      onClose={onClose}
      footer={<Space><Button onClick={onClose}>取消</Button>{mode === 'edit' ? <Button type="primary" onClick={() => void form.submit()}>保存</Button> : null}</Space>}
    >
      {mode === 'view' ? (
        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="机构号">{product.institutionCode}</Descriptions.Item>
          <Descriptions.Item label="机构名称">{product.institutionName}</Descriptions.Item>
          <Descriptions.Item label="产品号">{product.productCode}</Descriptions.Item>
          <Descriptions.Item label="产品名称">{product.productName}</Descriptions.Item>
          <Descriptions.Item label="贷款类型">{product.loanType}</Descriptions.Item>
          <Descriptions.Item label="贷款细分类型">{product.loanSubType}</Descriptions.Item>
          <Descriptions.Item label="额度类型">{product.creditType}</Descriptions.Item>
          <Descriptions.Item label="客户最大授信额度">{product.maxCreditLimit.toLocaleString('zh-CN')} 元</Descriptions.Item>
          <Descriptions.Item label="正常利率区间">{product.normalRateMin.toFixed(2)}% - {product.normalRateMax.toFixed(2)}%</Descriptions.Item>
          <Descriptions.Item label="还款方式" span={2}>{product.repaymentMethods.map((item) => `${item.name}（${item.code}）`).join('、')}</Descriptions.Item>
        </Descriptions>
      ) : (
        <Form form={form} layout="vertical" onFinish={(values) => void handleFinish(values)}>
          <div className="product-modal-readonly-grid">
            <Form.Item label="机构号"><Input value={product.institutionCode} disabled /></Form.Item>
            <Form.Item label="机构名称"><Input value={product.institutionName} disabled /></Form.Item>
            <Form.Item label="产品号"><Input value={product.productCode} disabled /></Form.Item>
          </div>
          <Form.Item name="productName" label="产品名称" rules={[{ required: true, message: '请输入产品名称' }]}><Input /></Form.Item>
          <div className="product-modal-grid">
            <Form.Item name="loanType" label="贷款类型" rules={[{ required: true, message: '请选择贷款类型' }]}><Select options={loanTypeOptions} /></Form.Item>
            <Form.Item name="loanSubType" label="贷款细分类型" rules={[{ required: true, message: '请选择贷款细分类型' }]}><Select options={loanSubTypeOptions} /></Form.Item>
            <Form.Item name="creditType" label="额度类型" rules={[{ required: true, message: '请选择额度类型' }]}><Select options={creditTypeOptions} /></Form.Item>
            <Form.Item name="maxCreditLimit" label="客户最大授信额度" rules={[{ required: true, message: '请输入客户最大授信额度' }]}><InputNumber min={1} precision={2} style={{ width: '100%' }} addonAfter="元" /></Form.Item>
          </div>
          <Descriptions bordered column={2} size="small" title="只读信息">
            <Descriptions.Item label="正常利率区间">{product.normalRateMin.toFixed(2)}% - {product.normalRateMax.toFixed(2)}%</Descriptions.Item>
            <Descriptions.Item label="还款方式">{product.repaymentMethods.map((item) => `${item.name}（${item.code}）`).join('、')}</Descriptions.Item>
          </Descriptions>
        </Form>
      )}
    </Drawer>
  );
}
