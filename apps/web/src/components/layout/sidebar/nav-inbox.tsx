'use client';

import {
   SidebarMenu,
   SidebarMenuItem,
   SidebarMenuButton,
   SidebarMenuBadge,
} from '@/components/ui/sidebar';
import { Link } from '@tanstack/react-router';
import { Inbox } from 'lucide-react';
import { useInboxStore } from '@/store/inbox-store';

export function NavInbox() {
   const { unreadCount } = useInboxStore();
   return (
      <SidebarMenu>
         <SidebarMenuItem>
            <Link to="/" className="w-full">
               <SidebarMenuButton>
                  <Inbox size={16} />
                  <span>Входящие</span>
                  {unreadCount > 0 && <SidebarMenuBadge>{unreadCount}</SidebarMenuBadge>}
               </SidebarMenuButton>
            </Link>
         </SidebarMenuItem>
      </SidebarMenu>
   );
}
