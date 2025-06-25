'use client';

import { Button } from '@/components/ui/button';
import {
   Command,
   CommandEmpty,
   CommandGroup,
   CommandInput,
   CommandItem,
   CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useConstructionData } from '@/hooks/use-construction-data';
import { CheckIcon, PlusIcon } from 'lucide-react';
import { useId, useState } from 'react';
import { Badge } from '@/components/ui/badge';

interface LabelSelectorProps {
   selectedLabels: any[];
   onChange: (labels: any[]) => void;
}

export function LabelSelector({ selectedLabels, onChange }: LabelSelectorProps) {
   const id = useId();
   const [open, setOpen] = useState<boolean>(false);

   const { labels } = useConstructionData();

   const toggleLabel = (label: any) => {
      const isSelected = selectedLabels.some(l => l._id === label._id);
      if (isSelected) {
         onChange(selectedLabels.filter(l => l._id !== label._id));
      } else {
         onChange([...selectedLabels, label]);
      }
   };

   return (
      <div className="space-y-2">
         <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
               <Button
                  id={id}
                  className="flex items-center gap-2"
                  size="xs"
                  variant="secondary"
                  role="combobox"
                  aria-expanded={open}
               >
                  <PlusIcon className="size-4" />
                  <span>Добавить метку</span>
               </Button>
            </PopoverTrigger>
            <PopoverContent
               className="border-input w-full min-w-[var(--radix-popper-anchor-width)] p-0"
               align="start"
            >
               <Command>
                  <CommandInput placeholder="Выберите метки..." />
                  <CommandList>
                     <CommandEmpty>Метка не найдена.</CommandEmpty>
                     <CommandGroup>
                        {labels?.map((label) => {
                           const isSelected = selectedLabels.some(l => l._id === label._id);
                           return (
                              <CommandItem
                                 key={label._id}
                                 value={label._id}
                                 onSelect={() => toggleLabel(label)}
                                 className="flex items-center justify-between"
                              >
                                 <div className="flex items-center gap-2">
                                    <div
                                       className="size-3 rounded-full border"
                                       style={{ backgroundColor: label.color, borderColor: label.color }}
                                    />
                                    {label.name}
                                 </div>
                                 {isSelected && <CheckIcon size={16} className="ml-auto" />}
                              </CommandItem>
                           );
                        })}
                     </CommandGroup>
                  </CommandList>
               </Command>
            </PopoverContent>
         </Popover>

         {/* Display selected labels */}
         {selectedLabels.length > 0 && (
            <div className="flex flex-wrap gap-1">
               {selectedLabels.map((label) => (
                  <Badge
                     key={label._id}
                     variant="outline"
                     className="text-xs cursor-pointer"
                     style={{
                        borderColor: label.color,
                        color: label.color,
                        backgroundColor: `${label.color}10`
                     }}
                     onClick={() => toggleLabel(label)}
                  >
                     {label.name}
                     <span className="ml-1">×</span>
                  </Badge>
               ))}
            </div>
         )}
      </div>
   );
}
