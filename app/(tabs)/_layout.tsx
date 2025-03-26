import { Tabs } from 'expo-router';
import React from 'react';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { MyTabBar } from '@/components/tab_bar/Tabs';

export default function TabLayout() {

  return (
    <Tabs
      tabBar={props => <MyTabBar {...props} />}
  
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          // tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="tools"
        options={{
          title: 'Tools',
          // tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
        }}
      />
            <Tabs.Screen
        name="setting"
        options={{
          title: 'setting',
        }}
      />
    </Tabs>
  );
}
