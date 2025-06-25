'use client';

import { BarChart3, Layers, MoreHorizontal } from 'lucide-react';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Link } from '@tanstack/react-router';
import { constructionMainItems, constructionAnalyticsItems } from '@/mock-data/construction/construction-nav';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useConstructionData } from '@/hooks/use-construction-data';
import { Button } from '@/components/ui/button';

export function NavConstructionMain() {
    const { seedData } = useConstructionData();

    const handleSeedData = async () => {
        await seedData();
    };

    return (
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel>Система сбалансированных показателей</SidebarGroupLabel>
            <SidebarMenu>
                {constructionMainItems.map((item) => (
                    <SidebarMenuItem key={item.name}>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <SidebarMenuButton asChild>
                                        <Link to={item.url}>
                                            <item.icon />
                                            <span>{item.name}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                    <p>{item.description}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </SidebarMenuItem>
                ))}
                <SidebarMenuItem>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <SidebarMenuButton asChild>
                                <span>
                                    <MoreHorizontal />
                                    <span>Аналитика</span>
                                </span>
                            </SidebarMenuButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-64 rounded-lg" side="bottom" align="start">
                            {constructionAnalyticsItems.map((item, index) => (
                                <DropdownMenuItem key={item.name} asChild>
                                    <Link to={item.url}>
                                        <item.icon className="text-muted-foreground" />
                                        <div className="flex flex-col">
                                            <span>{item.name}</span>
                                            <span className="text-xs text-muted-foreground">{item.description}</span>
                                        </div>
                                    </Link>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarGroup>
    );
} 