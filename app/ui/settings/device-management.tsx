"use client";

import { useEffect, useState } from 'react';
import { fetchDevices, addDevice, createDevicesTable } from '@/app/lib/data';
import { Device } from '@/app/lib/definitions';

type DeviceManagementProps = {
  userId: string;
};

export default function DeviceManagement({ userId }: DeviceManagementProps) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [newDeviceName, setNewDeviceName] = useState('');

  useEffect(() => {
    async function initialize() {
      await createDevicesTable();
      const fetchedDevices = await fetchDevices(userId);
      setDevices(fetchedDevices);
    }

    initialize();
  }, [userId]);

  const handleAddDevice = async () => {
    if (newDeviceName.trim() === '') return;

    await addDevice(userId, newDeviceName);
    const updatedDevices = await fetchDevices(userId);
    setDevices(updatedDevices);
    setNewDeviceName('');
  };

  return (
    <div>
      <h2>Device Management</h2>
      <ul>
        {devices.map((device) => (
          <li key={device.id}>
            {device.device_name} - Last Login: {new Date(device.last_login).toLocaleString()}
          </li>
        ))}
      </ul>
      <input
        type="text"
        value={newDeviceName}
        onChange={(e) => setNewDeviceName(e.target.value)}
        placeholder="Enter new device name"
      />
      <button onClick={handleAddDevice}>Add Device</button>
    </div>
  );
}
