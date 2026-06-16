import React, { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { getUnreadNotificationsCount } from '../../services/bookingService';
import { useSocketContext } from '../../contexts/SocketContext';

export default function TabLayout() {
  const { t } = useTranslation();
  const { socket } = useSocketContext();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const fetchUnreadCount = async () => {
    try {
      const data = await getUnreadNotificationsCount();
      setUnreadCount(data.count || 0);
    } catch {
      // Ignore errors
    }
  };

  useEffect(() => {
    fetchUnreadCount();

    const interval = setInterval(fetchUnreadCount, 15000);

    if (socket) {
      const handleUpdate = () => {
        fetchUnreadCount();
      };
      
      socket.on('notification:received', handleUpdate);
      socket.on('booking:status-changed', handleUpdate);
      socket.on('booking:created', handleUpdate);
      socket.on('booking:cancelled', handleUpdate);

      return () => {
        socket.off('notification:received', handleUpdate);
        socket.off('booking:status-changed', handleUpdate);
        socket.off('booking:created', handleUpdate);
        socket.off('booking:cancelled', handleUpdate);
        clearInterval(interval);
      };
    }

    return () => clearInterval(interval);
  }, [socket]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#306D29',
        tabBarInactiveTintColor: '#6b7280',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1.5,
          borderTopColor: 'rgba(13, 83, 14, 0.1)',
          paddingBottom: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: '#FBF5DD',
          borderBottomWidth: 1.5,
          borderBottomColor: 'rgba(13, 83, 14, 0.1)',
        },
        headerTitleStyle: {
          fontWeight: '700',
          color: '#0D530E',
          fontSize: 18,
        },
      }}
    >
      <Tabs.Screen
        name="search"
        options={{
          title: t('nav.search', 'Search'),
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🔍</Text>,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: t('nav.bookings', 'My Bookings'),
          headerShown: false,
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🎟️</Text>,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: t('nav.notifications', 'Notifications'),
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🔔</Text>,
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: '#c53030',
            color: '#FFFFFF',
            fontSize: 9,
            lineHeight: 13,
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('nav.profile', 'Profile'),
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>👤</Text>,
        }}
      />
    </Tabs>
  );
}
