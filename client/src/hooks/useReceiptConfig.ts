import { useState, useEffect } from 'react';

export interface ReceiptConfig {
  storeName: string;
  storePhone: string;
  storeAddress: string;
  footerMessage: string;
  receiptSize: string;
  copiesToPrint: number;
  printLogo: boolean;
  printBarcode: boolean;
  showLoyaltyInfo: boolean;
  autoPrintReceipt: boolean;
}

const defaultConfig: ReceiptConfig = {
  storeName: 'Grocery Store',
  storePhone: '(555) 123-4567',
  storeAddress: '123 Main Street, City, State 12345',
  footerMessage: 'Thank you for shopping with us!\nHave a great day!',
  receiptSize: '80mm',
  copiesToPrint: 1,
  printLogo: true,
  printBarcode: false,
  showLoyaltyInfo: true,
  autoPrintReceipt: false
};

export const useReceiptConfig = () => {
  const [receiptConfig, setReceiptConfig] = useState<ReceiptConfig>(defaultConfig);

  // Load configuration from localStorage on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('receiptConfig');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        setReceiptConfig({ ...defaultConfig, ...parsedConfig });
      } catch (error) {
        console.error('Error loading receipt configuration:', error);
      }
    }
  }, []);

  const updateReceiptConfig = (field: keyof ReceiptConfig, value: any) => {
    setReceiptConfig(prev => ({ ...prev, [field]: value }));
  };

  const saveReceiptConfig = () => {
    try {
      localStorage.setItem('receiptConfig', JSON.stringify(receiptConfig));
      console.log('Receipt configuration saved successfully');
      return true;
    } catch (error) {
      console.error('Error saving receipt configuration:', error);
      return false;
    }
  };

  const getReceiptProps = () => ({
    storeName: receiptConfig.storeName,
    storeAddress: receiptConfig.storeAddress,
    storePhone: receiptConfig.storePhone,
    footerMessage: receiptConfig.footerMessage,
    showLoyaltyInfo: receiptConfig.showLoyaltyInfo,
  });

  return {
    receiptConfig,
    updateReceiptConfig,
    saveReceiptConfig,
    getReceiptProps,
  };
};