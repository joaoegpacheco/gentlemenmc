"use client";
import React from 'react';
import { Tabs } from 'antd';
import type { TabsProps } from 'antd';
import { FormComand } from "@/components/Form/page";
import { CardComand } from "@/components/Card/page";

const onChange = (key: string) => {
  console.log(key);
};

const items: TabsProps['items'] = [
    {
        key: '1',
        label: 'Marcar',
        children: <FormComand />,
      },
      {
        key: '2',
        label: 'Ver marcações',
        children: <CardComand />,
      }
//   {
//     key: '3',
//     label: 'Tab 3',
//     children: 'Content of Tab Pane 3',
//   },
];

const TabsComponent: React.FC = () => <Tabs style={{width: "100%", padding: 20}} defaultActiveKey="1" items={items} onChange={onChange} />;

export default TabsComponent;