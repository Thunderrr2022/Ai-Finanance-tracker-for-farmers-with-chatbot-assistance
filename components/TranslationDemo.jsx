"use client";

import { useLanguage } from '@/context/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TranslationDemo() {
  const { t, language } = useLanguage();
  
  return (
    <div className="max-w-4xl mx-auto my-8 px-4">
      <h2 className="text-2xl font-bold mb-6 text-center">
        {t('common.language')}: {language.toUpperCase()}
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('common.dashboard')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li><strong>{t('dashboard.totalBalance')}:</strong> $5,000.00</li>
              <li><strong>{t('dashboard.income')}:</strong> $3,000.00</li>
              <li><strong>{t('dashboard.expenses')}:</strong> $1,500.00</li>
              <li><strong>{t('dashboard.budget')}:</strong> $2,000.00</li>
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>{t('common.transactions')}</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left pb-2">{t('transactions.date')}</th>
                  <th className="text-left pb-2">{t('transactions.description')}</th>
                  <th className="text-right pb-2">{t('transactions.amount')}</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2">2023-04-01</td>
                  <td className="py-2">{t('transactions.income')}</td>
                  <td className="text-right py-2 text-green-600">+$1,000.00</td>
                </tr>
                <tr>
                  <td className="py-2">2023-04-02</td>
                  <td className="py-2">{t('transactions.expense')}</td>
                  <td className="text-right py-2 text-red-600">-$250.00</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{t('farmAssistant.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm mb-4">"{t('farmAssistant.askQuestion')}"</p>
              <div className="flex">
                <input 
                  type="text" 
                  className="flex-1 p-2 rounded-l-lg border border-gray-300" 
                  placeholder={t('farmAssistant.askQuestion')}
                  disabled
                />
                <button className="bg-green-600 text-white px-4 py-2 rounded-r-lg">{t('farmAssistant.send')}</button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 