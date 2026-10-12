import React from 'react';
import { WhatsAppInbox } from '@/components/whatsapp/whatsapp-inbox';

export const WhatsAppPage: React.FC = () => {
  return (
    <div className="h-screen max-h-screen overflow-hidden flex flex-col">
      <WhatsAppInbox />
    </div>
  );
};

export default WhatsAppPage;
