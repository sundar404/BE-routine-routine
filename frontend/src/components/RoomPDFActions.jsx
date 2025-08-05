/**
 * Room PDF Actions Component
 * Replaces RoomExcelActions for PDF export
 */

import React, { useState } from 'react';
import { Button, Space, Tooltip } from 'antd';
import { FilePdfOutlined, LoadingOutlined } from '@ant-design/icons';
import { message } from 'antd';
import { roomsAPI } from '../services/api';
import { useSemesterGroup } from '../contexts/SemesterGroupContext';

const RoomPDFActions = ({ 
  roomId,
  roomName = 'Room',
  size = 'small',
  showAllRoomsExport = false
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingAll, setIsExportingAll] = useState(false);
  const { semesterGroup } = useSemesterGroup();

  const handleExportRoomSchedule = async () => {
    if (!roomId) {
      message.error('Room ID is required');
      return;
    }

    setIsExporting(true);
    
    try {
      console.log('🎯 Exporting room schedule to PDF:', { roomId, roomName, semesterGroup });
      
      const response = await roomsAPI.exportRoomScheduleToPDF(roomId, semesterGroup);
      
      // Create blob and download
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with semester group indicator
      const sanitizedName = roomName.replace(/[^a-zA-Z0-9]/g, '_');
      const timestamp = new Date().toISOString().split('T')[0];
      const semesterSuffix = semesterGroup && semesterGroup !== 'all' ? `_${semesterGroup.toUpperCase()}` : '';
      link.download = `${sanitizedName}_Schedule${semesterSuffix}_${timestamp}.pdf`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      const groupText = semesterGroup && semesterGroup !== 'all' ? ` (${semesterGroup} semesters)` : '';
      message.success(`✅ ${roomName} schedule${groupText} exported successfully!`);
      console.log('✅ Room schedule PDF export completed');
      
    } catch (error) {
      console.error('❌ Room schedule PDF export failed:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Failed to export room schedule';
      
      message.error(`❌ Export failed: ${errorMessage}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportAllRoomSchedules = async () => {
    setIsExportingAll(true);
    
    try {
      console.log(`🎯 Exporting all room schedules to PDF for semester group: ${semesterGroup}`);
      
      const response = await roomsAPI.exportAllRoomSchedulesToPDF(semesterGroup);
      
      // Create blob and download
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with semester group indicator
      const timestamp = new Date().toISOString().split('T')[0];
      const semesterSuffix = semesterGroup && semesterGroup !== 'all' ? `_${semesterGroup.toUpperCase()}` : '';
      link.download = `All_Room_Schedules${semesterSuffix}_${timestamp}.pdf`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      message.success(`✅ All room schedules exported successfully!${semesterGroup && semesterGroup !== 'all' ? ` (${semesterGroup.toUpperCase()} Semester)` : ''}`);
      console.log('✅ All room schedules PDF export completed');
      
    } catch (error) {
      console.error('❌ All room schedules PDF export failed:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Failed to export all room schedules';
      
      message.error(`❌ Export failed: ${errorMessage}`);
    } finally {
      setIsExportingAll(false);
    }
  };

  return (
    <Space size="small">
      {/* Individual Room Export */}
      <Tooltip title={`Export ${roomName} schedule to PDF`}>
        <Button
          type="primary"
          icon={isExporting ? <LoadingOutlined /> : <FilePdfOutlined />}
          onClick={handleExportRoomSchedule}
          loading={isExporting}
          size={size}
          style={{
            background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
            border: 'none',
            borderRadius: '6px',
            fontWeight: '500'
          }}
        >
          {isExporting ? 'Exporting...' : 'Export PDF'}
        </Button>
      </Tooltip>

      {/* All Rooms Export (if enabled) */}
      {showAllRoomsExport && (
        <Tooltip title="Export all room schedules to PDF">
          <Button
            type="default"
            icon={isExportingAll ? <LoadingOutlined /> : <FilePdfOutlined />}
            onClick={handleExportAllRoomSchedules}
            loading={isExportingAll}
            size={size}
            style={{
              borderColor: '#ff6b6b',
              color: '#ff6b6b',
              borderRadius: '6px',
              fontWeight: '500'
            }}
          >
            {isExportingAll ? 'Exporting All...' : 'Export All Rooms'}
          </Button>
        </Tooltip>
      )}
    </Space>
  );
};

export default RoomPDFActions;
